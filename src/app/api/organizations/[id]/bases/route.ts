import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/organizations/[id]/bases
 *
 * Listet alle verfügbaren Airtable Bases einer Organisation,
 * gruppiert nach Workspace.
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

    // 2. Prüfe Mitgliedschaft
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    // 3. Hole Org-Plan
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', id)
      .single()

    const limits = getPlanLimits(org?.plan || 'free')

    // 4. Hole alle Airtable Connections der Organisation
    const { data: connections, error: connError } = await supabase
      .from('airtable_connections')
      .select('id, airtable_email, status')
      .eq('organization_id', id)
      .eq('status', 'active')

    if (connError) {
      console.error('Fetch connections error:', connError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Verbindungen' },
        { status: 500 }
      )
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        workspaces: [],
        stats: {
          total_bases: 0,
          monitored_bases: 0,
          max_bases: limits.bases,
        },
      })
    }

    const connectionIds = connections.map(c => c.id)

    // 5. Hole Workspaces und Bases
    const { data: workspaces, error: wsError } = await supabase
      .from('airtable_workspaces')
      .select(`
        id,
        name,
        airtable_workspace_id,
        connection_id,
        airtable_bases (
          id,
          name,
          airtable_base_id,
          updated_at
        )
      `)
      .in('connection_id', connectionIds)

    if (wsError) {
      console.error('Fetch workspaces error:', wsError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Workspaces' },
        { status: 500 }
      )
    }

    // 6. Hole Monitored Bases Status
    const { data: monitoredBases } = await supabase
      .from('monitored_bases')
      .select('airtable_base_id, is_active, activated_at, updated_at')
      .eq('organization_id', id)

    const monitoredMap = new Map(
      (monitoredBases || []).map(mb => [mb.airtable_base_id, mb])
    )

    // 7. Erweitere Workspaces mit Connection-Info und Monitoring-Status
    const connectionMap = new Map(
      connections.map(c => [c.id, c])
    )

    const enrichedWorkspaces = (workspaces || []).map(ws => {
      const connection = connectionMap.get(ws.connection_id)

      const bases = (ws.airtable_bases || []).map(base => {
        const monitored = monitoredMap.get(base.id)
        return {
          ...base,
          is_monitored: monitored?.is_active || false,
          monitored_since: monitored?.activated_at || null,
          last_sync: monitored?.updated_at || null,
        }
      })

      return {
        id: ws.id,
        name: ws.name,
        airtable_workspace_id: ws.airtable_workspace_id,
        connection_email: connection?.airtable_email || 'Unbekannt',
        bases,
      }
    })

    // 8. Berechne Statistiken
    const totalBases = enrichedWorkspaces.reduce(
      (sum, ws) => sum + ws.bases.length,
      0
    )
    const monitoredCount = enrichedWorkspaces.reduce(
      (sum, ws) => sum + ws.bases.filter(b => b.is_monitored).length,
      0
    )

    return NextResponse.json({
      workspaces: enrichedWorkspaces,
      stats: {
        total_bases: totalBases,
        monitored_bases: monitoredCount,
        max_bases: limits.bases,
        can_add_more: monitoredCount < limits.bases,
      },
      currentUserRole: membership.role,
    })

  } catch (error) {
    console.error('Get bases error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
