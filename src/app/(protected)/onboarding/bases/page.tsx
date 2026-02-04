import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BasesStepClient } from "./bases-step-client"
import type { PlanType } from "@/types/airtable"

export default async function BasesStepPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's organization with plan
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .single()

  // If no org, go back to step 1
  if (!membership?.organization_id) {
    redirect("/onboarding/organization")
  }

  const org = membership.organizations as unknown as { id: string; name: string; plan: PlanType } | null

  // Get all bases from all connections, grouped by workspace
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
    .eq("airtable_connections.organization_id", membership.organization_id)

  // Transform data for client
  const workspacesWithBases = (workspaces || []).map((ws) => ({
    id: ws.id,
    name: ws.name,
    connectionEmail: (ws.airtable_connections as unknown as { airtable_email: string })?.airtable_email || "",
    bases: (ws.airtable_bases || []).map((base) => ({
      id: base.id,
      name: base.name,
      airtable_base_id: base.airtable_base_id,
    })),
  }))

  // Check if user has any connections
  const hasConnections = workspacesWithBases.length > 0

  return (
    <BasesStepClient
      orgId={membership.organization_id}
      orgPlan={(org?.plan as PlanType) || "free"}
      workspaces={workspacesWithBases}
      hasConnections={hasConnections}
    />
  )
}
