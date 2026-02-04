import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; invitationId: string }>
}

/**
 * DELETE /api/organizations/[id]/invitations/[invitationId]
 *
 * Widerruft (löscht) eine ausstehende Einladung.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id, invitationId } = await params
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
        { error: 'Keine Berechtigung zum Widerrufen von Einladungen' },
        { status: 403 }
      )
    }

    // 3. Prüfe ob Einladung existiert und zur Org gehört
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('id', invitationId)
      .eq('organization_id', id)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden' },
        { status: 404 }
      )
    }

    // 4. Lösche Einladung
    const { error: deleteError } = await supabase
      .from('organization_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Delete invitation error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Widerrufen der Einladung' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Einladung widerrufen',
    })

  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/[id]/invitations/[invitationId]/resend
 *
 * Alias für diese Route - sendet Einladung erneut (verlängert Ablaufdatum)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, invitationId } = await params
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
        { error: 'Keine Berechtigung zum Erneut-Senden von Einladungen' },
        { status: 403 }
      )
    }

    // 3. Aktualisiere Einladung (neues Token und Ablaufdatum)
    const { data: invitation, error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(), // Reset timestamp
      })
      .eq('id', invitationId)
      .eq('organization_id', id)
      .is('accepted_at', null)
      .select()
      .single()

    if (updateError || !invitation) {
      return NextResponse.json(
        { error: 'Einladung nicht gefunden oder bereits angenommen' },
        { status: 404 }
      )
    }

    // TODO: E-Mail erneut senden

    return NextResponse.json({
      success: true,
      invitation,
      message: 'Einladung erneut gesendet',
    })

  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
