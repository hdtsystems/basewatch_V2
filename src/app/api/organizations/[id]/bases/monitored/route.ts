import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/organizations/[id]/bases/monitored
 *
 * Listet nur die aktiv überwachten Bases einer Organisation.
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

    // 4. Hole aktiv überwachte Bases mit Details
    const { data: monitoredBases, error: fetchError } = await supabase
      .from('monitored_bases')
      .select(`
        id,
        is_active,
        activated_at,
        deactivated_at,
        updated_at,
        airtable_bases (
          id,
          name,
          airtable_base_id,
          airtable_workspaces (
            id,
            name,
            airtable_workspace_id
          )
        )
      `)
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('activated_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch monitored bases error:', fetchError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der überwachten Bases' },
        { status: 500 }
      )
    }

    // 5. Transformiere Daten
    const bases = (monitoredBases || []).map(mb => {
      // Type assertion für die Relation (Supabase gibt ein einzelnes Objekt zurück)
      const base = mb.airtable_bases as unknown as {
        id: string
        name: string
        airtable_base_id: string
        airtable_workspaces: { id: string; name: string; airtable_workspace_id: string } | null
      } | null

      return {
        id: mb.id,
        base_id: base?.id,
        name: base?.name || 'Unbekannt',
        airtable_base_id: base?.airtable_base_id,
        workspace_name: base?.airtable_workspaces?.name || 'Unbekannt',
        activated_at: mb.activated_at,
        last_sync: mb.updated_at,
      }
    })

    return NextResponse.json({
      bases,
      stats: {
        count: bases.length,
        max_bases: limits.bases,
        can_add_more: bases.length < limits.bases,
        remaining: Math.max(0, limits.bases - bases.length),
      },
    })

  } catch (error) {
    console.error('Get monitored bases error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
