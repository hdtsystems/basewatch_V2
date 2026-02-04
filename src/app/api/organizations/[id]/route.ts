import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation Schema for PATCH
const UpdateOrgSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(50).optional(),
  description: z.string().max(500).optional(),
  logo_url: z.string().url().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/organizations/[id]
 *
 * Gibt die Details einer Organisation zurück.
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

    // 3. Hole Organisation mit Statistiken
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !org) {
      return NextResponse.json(
        { error: 'Organisation nicht gefunden' },
        { status: 404 }
      )
    }

    // 4. Hole Statistiken
    const [membersResult, connectionsResult, basesResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', id),
      supabase
        .from('airtable_connections')
        .select('id', { count: 'exact' })
        .eq('organization_id', id)
        .eq('status', 'active'),
      supabase
        .from('monitored_bases')
        .select('id', { count: 'exact' })
        .eq('organization_id', id)
        .eq('is_active', true),
    ])

    return NextResponse.json({
      organization: {
        ...org,
        role: membership.role,
        stats: {
          members: membersResult.count || 0,
          connections: connectionsResult.count || 0,
          monitored_bases: basesResult.count || 0,
        },
      },
    })

  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/organizations/[id]
 *
 * Aktualisiert eine Organisation (nur Owner).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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

    // 2. Prüfe Owner-Berechtigung
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Nur der Owner kann die Organisation bearbeiten' },
        { status: 403 }
      )
    }

    // 3. Parse und validiere Request Body
    const body = await request.json()
    const parsed = UpdateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updateData = parsed.data

    // 4. Wenn Name geändert wird, generiere neuen Slug
    let newSlug: string | undefined
    if (updateData.name) {
      newSlug = updateData.name
        .toLowerCase()
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)
    }

    // 5. Update Organisation
    const { data: org, error: updateError } = await supabase
      .from('organizations')
      .update({
        ...updateData,
        ...(newSlug && { slug: newSlug }),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update org error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Organisation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: org,
      message: 'Organisation erfolgreich aktualisiert',
    })

  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/[id]
 *
 * Löscht eine Organisation (nur Owner).
 * Alle zugehörigen Daten werden kaskadierend gelöscht.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // 2. Prüfe Owner-Berechtigung
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Nur der Owner kann die Organisation löschen' },
        { status: 403 }
      )
    }

    // 3. Lösche Organisation (CASCADE löscht alle zugehörigen Daten)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete org error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Organisation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Organisation erfolgreich gelöscht',
    })

  } catch (error) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
