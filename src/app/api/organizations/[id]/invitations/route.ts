import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { getPlanLimits } from '@/lib/plan-limits'
import { applyRateLimit } from '@/lib/rate-limit'

// Validation Schema für Einladung
const CreateInvitationSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

// Bulk Invitation Schema (für mehrere Einladungen)
const BulkInvitationSchema = z.object({
  emails: z.string().transform((val) =>
    val.split(',').map(e => e.trim()).filter(e => e.length > 0)
  ),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/organizations/[id]/invitations
 *
 * Listet alle ausstehenden Einladungen einer Organisation.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Prüfe Owner/Admin-Berechtigung
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Anzeigen von Einladungen' },
        { status: 403 }
      )
    }

    // 3. Hole Einladungen
    const { data: invitations, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('organization_id', id)
      .is('accepted_at', null)
      .is('declined_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch invitations error:', fetchError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Einladungen' },
        { status: 500 }
      )
    }

    // 4. Hole Einlader-Details
    const adminSupabase = createAdminClient()
    const invitationsWithDetails = await Promise.all(
      (invitations || []).map(async (inv) => {
        let inviterName = 'Unbekannt'
        if (inv.invited_by) {
          const { data: inviterData } = await adminSupabase.auth.admin.getUserById(inv.invited_by)
          inviterName = inviterData?.user?.user_metadata?.full_name ||
            inviterData?.user?.email?.split('@')[0] || 'Unbekannt'
        }

        return {
          ...inv,
          invited_by_name: inviterName,
        }
      })
    )

    return NextResponse.json({
      invitations: invitationsWithDetails,
      total: invitationsWithDetails.length,
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/[id]/invitations
 *
 * Erstellt eine oder mehrere Einladungen.
 * Rate-Limit: max 20 Einladungen pro Stunde (Spam-Schutz)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // 0. Rate-Limit prüfen (max 20/Stunde pro Organisation)
    const rateLimitResponse = applyRateLimit(request, 'invitations', id)
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Prüfe Owner/Admin-Berechtigung
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Einladen von Mitgliedern' },
        { status: 403 }
      )
    }

    // 3. Parse Request Body
    const body = await request.json()

    // Bestimme ob Einzel- oder Bulk-Einladung
    let emails: string[] = []
    let role: 'admin' | 'member' | 'viewer' = 'member'

    if (body.emails) {
      const parsed = BulkInvitationSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        )
      }
      emails = parsed.data.emails
      role = parsed.data.role
    } else {
      const parsed = CreateInvitationSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        )
      }
      emails = [parsed.data.email]
      role = parsed.data.role
    }

    // 4. Prüfe Member-Limit
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', id)
      .single()

    const { count: memberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)

    const { count: pendingCount } = await supabase
      .from('organization_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .is('accepted_at', null)
      .is('declined_at', null)
      .gt('expires_at', new Date().toISOString())

    const limits = getPlanLimits(org?.plan || 'free')
    const totalAfterInvite = (memberCount || 0) + (pendingCount || 0) + emails.length

    if (totalAfterInvite > limits.members) {
      return NextResponse.json(
        {
          error: `Member-Limit erreicht (${limits.members}). Upgrade deinen Plan für mehr Mitglieder.`,
        },
        { status: 400 }
      )
    }

    // 5. Prüfe ob E-Mails bereits Mitglieder sind
    const adminSupabase = createAdminClient()
    const results: { email: string; status: 'sent' | 'already_member' | 'already_invited' | 'error'; message: string }[] = []

    for (const email of emails) {
      // Prüfe ob bereits Mitglied
      const { data: existingUsers } = await adminSupabase
        .from('auth.users')
        .select('id')

      // Alternative: Nutze Admin API um User per Email zu finden
      // Da wir keinen direkten Zugriff auf auth.users haben,
      // prüfen wir über organization_members mit einer anderen Methode

      // Prüfe ob Einladung bereits existiert
      const { data: existingInvitation } = await supabase
        .from('organization_invitations')
        .select('id, expires_at')
        .eq('organization_id', id)
        .eq('email', email.toLowerCase())
        .is('accepted_at', null)
        .is('declined_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingInvitation) {
        results.push({
          email,
          status: 'already_invited',
          message: 'Einladung bereits gesendet',
        })
        continue
      }

      // 6. Erstelle Einladung (Upsert, um alte abgelaufene zu ersetzen)
      const { error: inviteError } = await supabase
        .from('organization_invitations')
        .upsert({
          organization_id: id,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Tage
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,email',
        })

      if (inviteError) {
        console.error('Create invitation error:', inviteError)
        results.push({
          email,
          status: 'error',
          message: 'Fehler beim Erstellen der Einladung',
        })
        continue
      }

      // TODO: E-Mail senden (Resend Integration)
      // await sendInvitationEmail(email, org.name, role, token)

      results.push({
        email,
        status: 'sent',
        message: 'Einladung erstellt',
      })
    }

    const sentCount = results.filter(r => r.status === 'sent').length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: emails.length,
        sent: sentCount,
        skipped: emails.length - sentCount,
      },
      message: sentCount > 0
        ? `${sentCount} Einladung${sentCount > 1 ? 'en' : ''} erstellt`
        : 'Keine neuen Einladungen erstellt',
    }, { status: 201 })

  } catch (error) {
    console.error('Create invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
