import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InviteAcceptClient } from "./invite-accept-client"
import type { OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Einladung | Basewatch",
  description: "Nimm eine Einladung zu einer Organisation an",
}

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function InviteAcceptPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  if (!token) {
    redirect("/login?error=invalid_invitation")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/login?redirect=/invite/accept?token=${token}`)
  }

  // Fetch invitation details
  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .select(`
      id,
      email,
      role,
      expires_at,
      accepted_at,
      organization_id,
      organizations (
        id,
        name
      ),
      inviter:invited_by (
        email,
        raw_user_meta_data
      )
    `)
    .eq("token", token)
    .single()

  // Handle errors
  if (error || !invitation) {
    return (
      <InviteAcceptClient
        status="not_found"
        userEmail={user.email || ""}
      />
    )
  }

  // Check if invitation is for this user's email
  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return (
      <InviteAcceptClient
        status="wrong_email"
        userEmail={user.email || ""}
        invitationEmail={invitation.email}
      />
    )
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    return (
      <InviteAcceptClient
        status="already_accepted"
        userEmail={user.email || ""}
      />
    )
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <InviteAcceptClient
        status="expired"
        userEmail={user.email || ""}
      />
    )
  }

  // Check if user is already a member of an organization
  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", user.id)
    .single()

  const existingOrg = existingMembership?.organizations as unknown as { name: string } | null

  const org = invitation.organizations as unknown as { id: string; name: string }
  const inviter = invitation.inviter as unknown as { email: string; raw_user_meta_data: { full_name?: string } | null } | null

  return (
    <InviteAcceptClient
      status="pending"
      token={token}
      userEmail={user.email || ""}
      invitation={{
        id: invitation.id,
        organizationName: org?.name || "",
        organizationId: org?.id || "",
        role: invitation.role as OrgRole,
        inviterName: inviter?.raw_user_meta_data?.full_name || inviter?.email || "",
        expiresAt: invitation.expires_at,
      }}
      existingOrgName={existingOrg?.name}
    />
  )
}
