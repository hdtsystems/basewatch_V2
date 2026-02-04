import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompleteStepClient } from "./complete-step-client"
import type { PlanType } from "@/types/airtable"

export default async function CompleteStepPage() {
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
    .select("organization_id, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .single()

  if (!membership?.organization_id) {
    redirect("/onboarding/organization")
  }

  const org = membership.organizations as unknown as { id: string; name: string; plan: PlanType } | null

  // Get connection count
  const { count: connectionCount } = await supabase
    .from("airtable_connections")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)

  // Get monitored bases count
  const { count: monitoredBasesCount } = await supabase
    .from("monitored_bases")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)
    .eq("is_active", true)

  // Get member count
  const { count: memberCount } = await supabase
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)

  // Get pending invites count
  const { count: pendingInvitesCount } = await supabase
    .from("organization_invitations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", membership.organization_id)
    .is("accepted_at", null)

  return (
    <CompleteStepClient
      orgName={org?.name || ""}
      connectionCount={connectionCount || 0}
      monitoredBasesCount={monitoredBasesCount || 0}
      memberCount={memberCount || 1}
      pendingInvitesCount={pendingInvitesCount || 0}
    />
  )
}
