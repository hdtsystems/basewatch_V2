import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * POST /api/invitations/[token]/accept
 *
 * Nimmt eine Einladung an.
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
        { error: 'Du musst eingeloggt sein, um eine Einladung anzunehmen' },
        { status: 401 }
      )
    }

    // 2. Hole Einladung
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        *,
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

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Diese Einladung ist abgelaufen' },
        { status: 400 }
      )
    }

    // 5. Prüfe ob User bereits in einer Org ist
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      // Prüfe ob es dieselbe Org ist
      if (existingMembership.organization_id === invitation.organization_id) {
        return NextResponse.json(
          { error: 'Du bist bereits Mitglied dieser Organisation' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Du bist bereits Mitglied einer anderen Organisation. Du musst diese erst verlassen.',
          current_org_id: existingMembership.organization_id,
        },
        { status: 400 }
      )
    }

    // 6. Erstelle Mitgliedschaft
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (memberError) {
      console.error('Create membership error:', memberError)
      return NextResponse.json(
        { error: 'Fehler beim Beitreten der Organisation' },
        { status: 500 }
      )
    }

    // 7. Markiere Einladung als angenommen
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Update invitation error:', updateError)
      // Nicht kritisch, Mitgliedschaft wurde erstellt
    }

    // 8. Update Onboarding-Status (falls vorhanden)
    await supabase
      .from('user_onboarding_status')
      .upsert({
        user_id: user.id,
        current_step: 4,
        organization_id: invitation.organization_id,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    return NextResponse.json({
      success: true,
      organization: invitation.organizations,
      role: invitation.role,
      message: `Du bist jetzt Mitglied von "${invitation.organizations?.name}"`,
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
