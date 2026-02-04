import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation Schema for role change
const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
  expected_updated_at: z.string().optional(), // Für Optimistic Locking
})

interface RouteParams {
  params: Promise<{ id: string; userId: string }>
}

/**
 * PATCH /api/organizations/[id]/members/[userId]
 *
 * Ändert die Rolle eines Mitglieds (nur Owner).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, userId } = await params
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
    const { data: currentMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Nur der Owner kann Rollen ändern' },
        { status: 403 }
      )
    }

    // 3. Prüfe ob Ziel-Mitglied existiert
    const { data: targetMember, error: memberError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', id)
      .eq('user_id', userId)
      .single()

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      )
    }

    // 4. Verhindere Änderung der Owner-Rolle
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Die Owner-Rolle kann nicht geändert werden. Nutze stattdessen den Owner-Transfer.' },
        { status: 400 }
      )
    }

    // 5. Parse und validiere Request Body
    const body = await request.json()
    const parsed = UpdateRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Rolle. Erlaubt: admin, member, viewer' },
        { status: 400 }
      )
    }

    const { role, expected_updated_at } = parsed.data

    // 6. Optimistic Locking: Prüfe ob Daten zwischenzeitlich geändert wurden
    if (expected_updated_at) {
      const { data: currentMember } = await supabase
        .from('organization_members')
        .select('updated_at')
        .eq('id', targetMember.id)
        .single()

      if (currentMember && currentMember.updated_at !== expected_updated_at) {
        return NextResponse.json(
          { error: 'Daten wurden zwischenzeitlich geändert. Bitte neu laden.', code: 'CONFLICT' },
          { status: 409 }
        )
      }
    }

    // 7. Update Rolle
    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', targetMember.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update role error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Ändern der Rolle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: `Rolle erfolgreich auf "${role}" geändert`,
    })

  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/[id]/members/[userId]
 *
 * Entfernt ein Mitglied aus der Organisation (nur Owner).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id, userId } = await params
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
    const { data: currentMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Nur der Owner kann Mitglieder entfernen' },
        { status: 403 }
      )
    }

    // 3. Prüfe ob Ziel-Mitglied existiert
    const { data: targetMember, error: memberError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', id)
      .eq('user_id', userId)
      .single()

    if (memberError || !targetMember) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      )
    }

    // 4. Verhindere Entfernung des Owners
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Der Owner kann nicht entfernt werden' },
        { status: 400 }
      )
    }

    // 5. Entferne Mitglied
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', targetMember.id)

    if (deleteError) {
      console.error('Delete member error:', deleteError)
      return NextResponse.json(
        { error: 'Fehler beim Entfernen des Mitglieds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mitglied erfolgreich entfernt',
    })

  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
