import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation Schema
const TransferOwnershipSchema = z.object({
  new_owner_id: z.string().uuid(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/organizations/[id]/members/transfer-ownership
 *
 * Transferiert die Owner-Rolle zu einem anderen Mitglied.
 * Der aktuelle Owner wird zum Admin degradiert.
 */
export async function POST(request: Request, { params }: RouteParams) {
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
    const { data: currentMembership } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership || currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Nur der aktuelle Owner kann die Ownership transferieren' },
        { status: 403 }
      )
    }

    // 3. Parse und validiere Request Body
    const body = await request.json()
    const parsed = TransferOwnershipSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige User-ID' },
        { status: 400 }
      )
    }

    const { new_owner_id } = parsed.data

    // 4. Prüfe ob der neue Owner existiert und Mitglied ist
    const { data: newOwnerMembership, error: memberError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', id)
      .eq('user_id', new_owner_id)
      .single()

    if (memberError || !newOwnerMembership) {
      return NextResponse.json(
        { error: 'Der ausgewählte Benutzer ist kein Mitglied dieser Organisation' },
        { status: 400 }
      )
    }

    // 5. Verhindere Transfer zu sich selbst
    if (new_owner_id === user.id) {
      return NextResponse.json(
        { error: 'Du bist bereits der Owner' },
        { status: 400 }
      )
    }

    // 6. Führe Transfer durch (in einer "Transaktion" durch mehrere Updates)
    // 6a. Neuen Owner setzen
    const { error: newOwnerError } = await supabase
      .from('organization_members')
      .update({ role: 'owner', updated_at: new Date().toISOString() })
      .eq('id', newOwnerMembership.id)

    if (newOwnerError) {
      console.error('Set new owner error:', newOwnerError)
      return NextResponse.json(
        { error: 'Fehler beim Setzen des neuen Owners' },
        { status: 500 }
      )
    }

    // 6b. Alten Owner zum Admin degradieren
    const { error: oldOwnerError } = await supabase
      .from('organization_members')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', currentMembership.id)

    if (oldOwnerError) {
      // Rollback: Setze neuen Owner wieder zurück
      await supabase
        .from('organization_members')
        .update({ role: newOwnerMembership.role, updated_at: new Date().toISOString() })
        .eq('id', newOwnerMembership.id)

      console.error('Degrade old owner error:', oldOwnerError)
      return NextResponse.json(
        { error: 'Fehler beim Transfer der Ownership' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ownership erfolgreich transferiert. Du bist jetzt Admin.',
    })

  } catch (error) {
    console.error('Transfer ownership error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
