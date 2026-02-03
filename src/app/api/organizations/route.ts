import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation Schema
const CreateOrgSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
})

/**
 * POST /api/organizations
 *
 * Erstellt eine neue Organisation.
 * Der eingeloggte User wird automatisch als Owner hinzugefügt (via DB Trigger).
 */
export async function POST(request: Request) {
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

    // 2. Prüfe ob User bereits einer Org angehört
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Du bist bereits Mitglied einer Organisation' },
        { status: 400 }
      )
    }

    // 3. Parse und validiere Request Body
    const body = await request.json()
    const parsed = CreateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name } = parsed.data

    // 4. Generiere Slug aus Name
    const slug = name
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    // 5. Erstelle Organisation
    // Der Trigger `create_owner_membership` fügt den User automatisch als Owner hinzu
    const { data: org, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        plan: 'free',
      })
      .select('id, name, slug, plan')
      .single()

    if (insertError) {
      console.error('Org insert error:', insertError)

      if (insertError.code === '23505') {
        // Unique constraint violation (slug exists)
        return NextResponse.json(
          { error: 'Eine Organisation mit diesem Namen existiert bereits' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Organisation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: org,
      message: 'Organisation erfolgreich erstellt',
    }, { status: 201 })

  } catch (error) {
    console.error('Create org error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/organizations
 *
 * Gibt die Organisationen des eingeloggten Users zurück.
 */
export async function GET() {
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

    // 2. Hole User's Organisationen
    const { data: memberships, error: fetchError } = await supabase
      .from('organization_members')
      .select(`
        role,
        organizations (
          id,
          name,
          slug,
          plan,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch orgs error:', fetchError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Organisationen' },
        { status: 500 }
      )
    }

    // Transform data
    const organizations = memberships?.map(m => ({
      ...m.organizations,
      role: m.role,
    })) || []

    return NextResponse.json({ organizations })

  } catch (error) {
    console.error('Get orgs error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
