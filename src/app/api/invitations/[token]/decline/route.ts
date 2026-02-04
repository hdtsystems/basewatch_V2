import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * POST /api/invitations/[token]/decline
 *
 * Lehnt eine Einladung ab.
 * User muss eingeloggt sein und die E-Mail muss übereinstimmen.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Du musst eingeloggt sein, um eine Einladung abzulehnen' },
        { status: 401 }
      )
    }

    // 2. Hole Einladung
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden' },
        { status: 404 }
      )
    }

    // 3. Prüfe E-Mail
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Diese Einladung ist nicht für dich bestimmt' },
        { status: 403 }
      )
    }

    // 4. Prüfe Status
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Diese Einladung wurde bereits angenommen' },
        { status: 400 }
      )
    }

    if (invitation.declined_at) {
      return NextResponse.json(
        { error: 'Diese Einladung wurde bereits abgelehnt' },
        { status: 400 }
      )
    }

    // 5. Markiere Einladung als abgelehnt
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ declined_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Decline invitation error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Ablehnen der Einladung' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Einladung abgelehnt',
    })

  } catch (error) {
    console.error('Decline invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
