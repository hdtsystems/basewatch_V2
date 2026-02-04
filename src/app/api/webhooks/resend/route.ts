import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

/**
 * Anonymisiert eine E-Mail-Adresse für DSGVO-konformes Logging
 * Beispiel: "max.mustermann@example.com" -> "ma***@example.com"
 */
function anonymizeEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  return `${local.slice(0, 2)}***@${domain}`
}

/**
 * Anonymisiert ein Array von E-Mail-Adressen
 */
function anonymizeEmails(emails: string[]): string[] {
  return emails.map(anonymizeEmail)
}

/**
 * Resend Webhook Events
 * https://resend.com/docs/webhooks
 */
type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked'

interface ResendWebhookPayload {
  type: ResendEventType
  created_at: string
  data: {
    created_at: string
    email_id: string
    from: string
    to: string[]
    subject: string
    // Bounce-spezifische Felder
    bounce?: {
      message: string
      // 'hard' = permanenter Fehler (E-Mail existiert nicht)
      // 'soft' = temporärer Fehler (Postfach voll)
      type?: 'hard' | 'soft'
    }
    // Complaint-spezifische Felder (Spam-Meldung)
    complaint?: {
      message: string
    }
  }
}

/**
 * Verifiziert die Resend Webhook-Signatur
 * https://resend.com/docs/webhooks#verify-webhooks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    // Timing-safe comparison um Timing-Attacks zu verhindern
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * POST /api/webhooks/resend
 *
 * Empfängt Webhook-Events von Resend für:
 * - Bounces (E-Mail konnte nicht zugestellt werden)
 * - Complaints (Empfänger hat als Spam markiert)
 *
 * Bei Bounce/Complaint:
 * - Markiere ausstehende Einladungen als fehlgeschlagen
 * - Logge das Event für Debugging
 */
export async function POST(request: Request) {
  try {
    // 1. Hole den rohen Body für Signatur-Verifikation
    const rawBody = await request.text()
    const signature = request.headers.get('svix-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    // 2. Verifiziere Signatur (in Produktion erforderlich)
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret) {
        console.error('RESEND_WEBHOOK_SECRET nicht konfiguriert')
        return NextResponse.json(
          { error: 'Webhook-Konfiguration fehlt' },
          { status: 500 }
        )
      }

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('Ungültige Webhook-Signatur', {
          signature: signature?.substring(0, 20) + '...',
        })
        return NextResponse.json(
          { error: 'Ungültige Signatur' },
          { status: 401 }
        )
      }
    }

    // 3. Parse Payload
    let payload: ResendWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Ungültiges JSON-Format' },
        { status: 400 }
      )
    }

    // 4. Validiere Payload-Struktur
    if (!payload.type || !payload.data) {
      return NextResponse.json(
        { error: 'Ungültige Payload-Struktur' },
        { status: 400 }
      )
    }

    console.log('Resend Webhook empfangen:', {
      type: payload.type,
      email_id: payload.data.email_id,
      to: anonymizeEmails(payload.data.to),
      subject: payload.data.subject,
    })

    // 5. Handle relevante Events
    const supabase = createAdminClient()

    switch (payload.type) {
      case 'email.bounced': {
        const bounceType = payload.data.bounce?.type || 'unknown'
        const bounceMessage = payload.data.bounce?.message || 'Unbekannter Bounce'

        console.warn('E-Mail Bounce erkannt:', {
          to: anonymizeEmails(payload.data.to),
          type: bounceType,
          message: bounceMessage,
        })

        // Markiere Einladungen für diese E-Mail-Adressen
        for (const email of payload.data.to) {
          // Finde ausstehende Einladungen für diese E-Mail
          const { data: invitations, error: fetchError } = await supabase
            .from('organization_invitations')
            .select('id, organization_id')
            .eq('email', email.toLowerCase())
            .is('accepted_at', null)
            .is('declined_at', null)

          if (fetchError) {
            console.error('Fehler beim Suchen von Einladungen:', fetchError)
            continue
          }

          if (invitations && invitations.length > 0) {
            // Bei Hard-Bounce: Einladung als "declined" markieren
            // (User kann nicht erreicht werden)
            if (bounceType === 'hard') {
              const { error: updateError } = await supabase
                .from('organization_invitations')
                .update({
                  declined_at: new Date().toISOString(),
                  // Speichere Bounce-Info in einem Custom-Feld (optional)
                  // bounce_reason: bounceMessage,
                })
                .in('id', invitations.map(i => i.id))

              if (updateError) {
                console.error('Fehler beim Aktualisieren der Einladung:', updateError)
              } else {
                console.log(`${invitations.length} Einladung(en) als unzustellbar markiert für ${anonymizeEmail(email)}`)
              }
            }
            // Bei Soft-Bounce: nur loggen, nicht markieren
            // (temporäres Problem, wird evtl. später zugestellt)
          }
        }
        break
      }

      case 'email.complained': {
        const complaintMessage = payload.data.complaint?.message || 'Spam-Meldung'

        console.warn('Spam-Beschwerde erkannt:', {
          to: anonymizeEmails(payload.data.to),
          message: complaintMessage,
        })

        // Bei Spam-Beschwerden: Einladung als declined markieren
        for (const email of payload.data.to) {
          const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
              declined_at: new Date().toISOString(),
            })
            .eq('email', email.toLowerCase())
            .is('accepted_at', null)
            .is('declined_at', null)

          if (updateError) {
            console.error('Fehler beim Aktualisieren der Einladung (Complaint):', updateError)
          } else {
            console.log(`Einladung als Spam-Beschwerde markiert für ${anonymizeEmail(email)}`)
          }
        }
        break
      }

      case 'email.delivered': {
        // Optional: Erfolgreich zugestellte E-Mails loggen
        console.log('E-Mail erfolgreich zugestellt:', {
          to: anonymizeEmails(payload.data.to),
          subject: payload.data.subject,
        })
        break
      }

      default:
        // Andere Events nur loggen
        console.log('Unbehandeltes Resend-Event:', payload.type)
    }

    // 6. Erfolgreiche Antwort
    return NextResponse.json({
      received: true,
      type: payload.type,
    })

  } catch (error) {
    console.error('Resend Webhook Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/resend
 *
 * Health-Check für den Webhook-Endpoint.
 * Kann von Monitoring-Tools verwendet werden.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'resend',
    timestamp: new Date().toISOString(),
  })
}
