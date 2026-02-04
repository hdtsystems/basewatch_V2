import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/organizations/[id]/members
 *
 * Listet alle Mitglieder einer Organisation auf.
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
    const { data: currentMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    // 3. Hole Mitglieder mit User-Infos
    const { data: members, error: fetchError } = await supabase
      .from('organization_members')
      .select('id, user_id, role, created_at')
      .eq('organization_id', id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Fetch members error:', fetchError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Mitglieder' },
        { status: 500 }
      )
    }

    // 4. Hole User-Details via Admin Client
    const adminSupabase = createAdminClient()
    const memberIds = members?.map(m => m.user_id) || []

    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(member.user_id)

        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.created_at,
          email: userData?.user?.email || 'Unbekannt',
          name: userData?.user?.user_metadata?.full_name || userData?.user?.email?.split('@')[0] || 'Unbekannt',
          avatar_url: userData?.user?.user_metadata?.avatar_url || null,
        }
      })
    )

    // 5. Sortiere nach Rolle
    const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 }
    const sortedMembers = membersWithDetails.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 99
      const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 99
      return roleA - roleB
    })

    return NextResponse.json({
      members: sortedMembers,
      total: sortedMembers.length,
      currentUserRole: currentMembership.role,
    })

  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
