import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

  // Get all members with user details
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      user_id,
      role,
      joined_at,
      users:user_id (
        id,
        email,
        raw_user_meta_data
      )
    `)
    .eq("organization_id", org.id)
    .order("joined_at", { ascending: true })

  // Get pending invitations
  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select(`
      id,
      email,
      role,
      expires_at,
      created_at,
      invited_by,
      inviter:invited_by (
        email,
        raw_user_meta_data
      )
    `)
    .eq("organization_id", org.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })

  // Transform members data
  const transformedMembers = (members || []).map((m) => {
    const userData = m.users as unknown as {
      id: string
      email: string
      raw_user_meta_data: { full_name?: string; avatar_url?: string } | null
    } | null

    return {
      userId: m.user_id,
      email: userData?.email || "",
      fullName: userData?.raw_user_meta_data?.full_name || null,
      avatarUrl: userData?.raw_user_meta_data?.avatar_url || null,
      role: m.role as OrgRole,
      joinedAt: m.joined_at,
    }
  })

  // Transform invitations data
  const transformedInvitations = (invitations || []).map((inv) => {
    const inviterData = inv.inviter as unknown as {
      email: string
      raw_user_meta_data: { full_name?: string } | null
    } | null

    return {
      id: inv.id,
      email: inv.email,
      role: inv.role as OrgRole,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
      invitedBy: inviterData?.raw_user_meta_data?.full_name || inviterData?.email || "",
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
