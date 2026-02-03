import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/airtable/connections/[id]
 *
 * Trennt eine Airtable-Verbindung und löscht alle zugehörigen Daten.
 * Nur Owner/Admin der Organisation können Verbindungen trennen.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole Connection und prüfe Zugehörigkeit
    const { data: connection, error: connectionError } = await supabase
      .from('airtable_connections')
      .select('id, organization_id, airtable_email')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Verbindung nicht gefunden' },
        { status: 404 }
      )
    }

    // 3. Prüfe User-Rolle (muss Owner oder Admin sein)
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', connection.organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Nur Eigentümer oder Admins können Verbindungen trennen' },
        { status: 403 }
      )
    }

    // 4. Lösche Connection (Trigger löscht Tokens + Cascade löscht Workspaces/Bases)
    const { error: deleteError } = await supabase
      .from('airtable_connections')
      .delete()
      .eq('id', connectionId)

    if (deleteError) {
      console.error('Connection delete error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Trennen der Verbindung' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Verbindung zu ${connection.airtable_email} wurde getrennt`,
    })

  } catch (error) {
    console.error('Connection delete error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/airtable/connections/[id]
 *
 * Gibt Details einer einzelnen Verbindung zurück.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole Connection mit Workspaces und Bases
    const { data: connection, error: connectionError } = await supabase
      .from('airtable_connections')
      .select(`
        id,
        airtable_email,
        status,
        workspace_count,
        base_count,
        last_sync_at,
        error_message,
        created_at,
        updated_at,
        airtable_workspaces (
          id,
          airtable_workspace_id,
          name,
          airtable_bases (
            id,
            airtable_base_id,
            name
          )
        )
      `)
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Verbindung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ connection })

  } catch (error) {
    console.error('Connection fetch error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
