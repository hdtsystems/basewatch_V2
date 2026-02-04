import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

interface RouteParams {
  params: Promise<{ id: string; baseId: string }>
}

/**
 * POST /api/organizations/[id]/bases/[baseId]/monitor
 *
 * Aktiviert die Überwachung einer Base.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id, baseId } = await params
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
        { error: 'Nur Owner oder Admin können die Überwachung aktivieren' },
        { status: 403 }
      )
    }

    // 3. Prüfe ob Base existiert und zur Org gehört (via Connection)
    const { data: base, error: baseError } = await supabase
      .from('airtable_bases')
      .select(`
        id,
        name,
        airtable_connections!inner (
          organization_id
        )
      `)
      .eq('id', baseId)
      .single()

    if (baseError || !base) {
      return NextResponse.json(
        { error: 'Base nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob Base zur Org gehört
    const connection = base.airtable_connections as unknown as { organization_id: string }
    if (!connection || connection.organization_id !== id) {
      return NextResponse.json(
        { error: 'Diese Base gehört nicht zu dieser Organisation' },
        { status: 403 }
      )
    }

    // 4. Prüfe Plan-Limit
    const { data: org } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', id)
      .single()

    const limits = getPlanLimits(org?.plan || 'free')

    const { count: currentCount } = await supabase
      .from('monitored_bases')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('is_active', true)

    if ((currentCount || 0) >= limits.bases) {
      return NextResponse.json(
        {
          error: `Limit erreicht (${limits.bases} Bases). Upgrade deinen Plan für mehr Bases.`,
          limit: limits.bases,
          current: currentCount,
        },
        { status: 400 }
      )
    }

    // 5. Aktiviere Überwachung (Upsert)
    const { data: monitored, error: upsertError } = await supabase
      .from('monitored_bases')
      .upsert({
        organization_id: id,
        airtable_base_id: baseId,
        is_active: true,
        activated_at: new Date().toISOString(),
        activated_by: user.id,
        deactivated_at: null,
      }, {
        onConflict: 'organization_id,airtable_base_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Activate monitoring error:', upsertError)
      return NextResponse.json(
        { error: 'Fehler beim Aktivieren der Überwachung' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      monitored_base: monitored,
      message: `Base "${base.name}" wird jetzt überwacht`,
    }, { status: 201 })

  } catch (error) {
    console.error('Activate monitoring error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/[id]/bases/[baseId]/monitor
 *
 * Deaktiviert die Überwachung einer Base.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id, baseId } = await params
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
        { error: 'Nur Owner oder Admin können die Überwachung deaktivieren' },
        { status: 403 }
      )
    }

    // 3. Prüfe ob Monitoring existiert
    const { data: monitored, error: fetchError } = await supabase
      .from('monitored_bases')
      .select('id, is_active')
      .eq('organization_id', id)
      .eq('airtable_base_id', baseId)
      .single()

    if (fetchError || !monitored) {
      return NextResponse.json(
        { error: 'Überwachung nicht gefunden' },
        { status: 404 }
      )
    }

    if (!monitored.is_active) {
      return NextResponse.json(
        { error: 'Diese Base wird bereits nicht überwacht' },
        { status: 400 }
      )
    }

    // 4. Deaktiviere Überwachung
    const { error: updateError } = await supabase
      .from('monitored_bases')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', monitored.id)

    if (updateError) {
      console.error('Deactivate monitoring error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Deaktivieren der Überwachung' },
        { status: 500 }
      )
    }

    // TODO: Webhooks deregistrieren wenn implementiert

    return NextResponse.json({
      success: true,
      message: 'Überwachung deaktiviert. Historische Daten bleiben erhalten.',
    })

  } catch (error) {
    console.error('Deactivate monitoring error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
