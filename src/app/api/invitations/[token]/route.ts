import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * GET /api/invitations/[token]
 *
 * Gibt die Details einer Einladung zurück (öffentlich).
 * Verwendet zum Anzeigen der Einladungsseite.
 * Rate-Limit: max 5 pro Minute (Brute-Force-Schutz)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 0. Rate-Limit prüfen (max 5/min - Brute-Force-Schutz für Token)
    const rateLimitResponse = applyRateLimit(request, 'invitation-token')
    if (rateLimitResponse) return rateLimitResponse

    const { token } = await params
    const supabase = await createClient()

    // 1. Hole Einladung
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        declined_at,
        created_at,
        invited_by,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden' },
        { status: 404 }
      )
    }

    // 2. Prüfe Status
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Diese Einladung wurde bereits angenommen' },
        { status: 400 }
      )
    }

    if (invitation.declined_at) {
      return NextResponse.json(
        { error: 'Diese Einladung wurde abgelehnt' },
        { status: 400 }
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Diese Einladung ist abgelaufen' },
        { status: 400 }
      )
    }

    // 3. Hole Einlader-Details
    let inviterName = 'Ein Teammitglied'
    if (invitation.invited_by) {
      const adminSupabase = createAdminClient()
      const { data: inviterData } = await adminSupabase.auth.admin.getUserById(invitation.invited_by)
      inviterName = inviterData?.user?.user_metadata?.full_name ||
        inviterData?.user?.email?.split('@')[0] || 'Ein Teammitglied'
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        created_at: invitation.created_at,
        organization: invitation.organizations,
        invited_by_name: inviterName,
      },
    })

  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
