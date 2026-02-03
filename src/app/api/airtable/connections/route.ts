import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/airtable/connections
 *
 * Gibt alle Airtable-Verbindungen der Organisation zurück.
 * Query Parameter: org_id (required)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole org_id aus Query Parameter
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID fehlt' },
        { status: 400 }
      )
    }

    // 3. Prüfe Mitgliedschaft (RLS macht das automatisch, aber wir wollen explizit)
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    // 4. Hole Verbindungen mit Workspace/Base Counts
    const { data: connections, error: connectionsError } = await supabase
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
        updated_at
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (connectionsError) {
      console.error('Connections fetch error:', connectionsError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Verbindungen' },
        { status: 500 }
      )
    }

    // 5. Hole Plan-Limits für die Organisation
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single()

    if (orgError) {
      console.error('Org fetch error:', orgError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Organisation' },
        { status: 500 }
      )
    }

    // Berechne Limits
    const limits = {
      free: 1,
      pro: 5,
      enterprise: 999999,
    }

    const maxConnections = limits[org.plan as keyof typeof limits] || 1
    const currentCount = connections?.length || 0
    const canAddMore = currentCount < maxConnections

    return NextResponse.json({
      connections: connections || [],
      limits: {
        current: currentCount,
        max: maxConnections,
        canAddMore,
        plan: org.plan,
      },
      userRole: membership.role,
    })

  } catch (error) {
    console.error('Connections API error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
