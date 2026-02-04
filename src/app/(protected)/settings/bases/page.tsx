import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BasesSettingsClient } from "./bases-settings-client"
import type { PlanType, OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Bases | Einstellungen | Basewatch",
  description: "Verwalte deine überwachten Airtable Bases",
}

export default async function BasesSettingsPage() {
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

  // Get all workspaces with bases for this organization
  const { data: workspaces } = await supabase
    .from("airtable_workspaces")
    .select(`
      id,
      name,
      airtable_workspace_id,
      airtable_connections!inner(
        id,
        airtable_email,
        organization_id
      ),
      airtable_bases(
        id,
        airtable_base_id,
        name
      )
    `)
    .eq("airtable_connections.organization_id", org.id)

  // Get monitored bases for this organization
  const { data: monitoredBases } = await supabase
    .from("monitored_bases")
    .select("id, airtable_base_id, is_active, activated_at")
    .eq("organization_id", org.id)

  // Create a map of monitored base IDs
  const monitoredBaseIds = new Set(
    (monitoredBases || [])
      .filter((mb) => mb.is_active)
      .map((mb) => mb.airtable_base_id)
  )

  // Transform data for client
  const workspacesWithBases = (workspaces || []).map((ws) => ({
    id: ws.id,
    name: ws.name,
    connectionEmail: (ws.airtable_connections as unknown as { airtable_email: string })?.airtable_email || "",
    bases: (ws.airtable_bases || []).map((base) => ({
      id: base.id,
      name: base.name,
      airtableBaseId: base.airtable_base_id,
      isMonitored: monitoredBaseIds.has(base.id),
    })),
  }))

  // Count monitored bases
  const monitoredCount = (monitoredBases || []).filter((mb) => mb.is_active).length

  return (
    <BasesSettingsClient
      orgId={org.id}
      orgPlan={org.plan}
      userRole={membership.role as OrgRole}
      workspaces={workspacesWithBases}
      monitoredCount={monitoredCount}
    />
  )
}
