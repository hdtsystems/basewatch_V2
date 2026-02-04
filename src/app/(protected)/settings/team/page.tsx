import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TeamSettingsClient } from "./team-settings-client"
import type { PlanType, OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Team | Einstellungen | Basewatch",
  description: "Verwalte dein Team",
}

export default async function TeamSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's organization with details
  const { data: membership } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization_id,
      organizations (
        id,
        name,
        plan
      )
    `)
    .eq("user_id", user.id)
    .single()

  if (!membership?.organizations) {
    redirect("/onboarding")
  }

  const org = membership.organizations as unknown as {
    id: string
    name: string
    plan: PlanType
  }

  // Get all members (without user join - we'll fetch user data separately)
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      user_id,
      role,
      joined_at
    `)
    .eq("organization_id", org.id)
    .order("joined_at", { ascending: true })

  // Get pending invitations (without user join for inviter)
  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select(`
      id,
      email,
      role,
      expires_at,
      created_at,
      invited_by
    `)
    .eq("organization_id", org.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })

  // Fetch user data from auth.users using admin client
  const adminClient = createAdminClient()

  // Collect all user IDs we need to fetch (members + inviters)
  const memberUserIds = (members || []).map((m) => m.user_id)
  const inviterUserIds = (invitations || [])
    .map((inv) => inv.invited_by)
    .filter((id): id is string => id !== null)
  const allUserIds = [...new Set([...memberUserIds, ...inviterUserIds])]

  // Fetch all users at once using admin API
  let userMap: Map<string, { email: string; full_name?: string; avatar_url?: string }> = new Map()

  if (allUserIds.length > 0) {
    const { data: authUsers } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authUsers?.users) {
      for (const authUser of authUsers.users) {
        if (allUserIds.includes(authUser.id)) {
          userMap.set(authUser.id, {
            email: authUser.email || "",
            full_name: authUser.user_metadata?.full_name,
            avatar_url: authUser.user_metadata?.avatar_url,
          })
        }
      }
    }
  }

  // Transform members data
  const transformedMembers = (members || []).map((m) => {
    const userData = userMap.get(m.user_id)

    return {
      userId: m.user_id,
      email: userData?.email || "",
      fullName: userData?.full_name || null,
      avatarUrl: userData?.avatar_url || null,
      role: m.role as OrgRole,
      joinedAt: m.joined_at,
    }
  })

  // Transform invitations data
  const transformedInvitations = (invitations || []).map((inv) => {
    const inviterData = inv.invited_by ? userMap.get(inv.invited_by) : null

    return {
      id: inv.id,
      email: inv.email,
      role: inv.role as OrgRole,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
      invitedBy: inviterData?.full_name || inviterData?.email || "",
    }
  })

  return (
    <TeamSettingsClient
      orgId={org.id}
      orgName={org.name}
      orgPlan={org.plan}
      userRole={membership.role as OrgRole}
      currentUserId={user.id}
      members={transformedMembers}
      invitations={transformedInvitations}
    />
  )
}
