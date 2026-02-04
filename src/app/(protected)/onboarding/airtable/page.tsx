import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AirtableStepClient } from "./airtable-step-client"

export default async function AirtableStepPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name)")
    .eq("user_id", user.id)
    .single()

  // If no org, go back to step 1
  if (!membership?.organization_id) {
    redirect("/onboarding/organization")
  }

  // Check existing connections
  const { data: connections } = await supabase
    .from("airtable_connections")
    .select("id, airtable_email, status")
    .eq("organization_id", membership.organization_id)

  const hasConnections = !!(connections && connections.length > 0)

  return (
    <AirtableStepClient
      orgId={membership.organization_id}
      hasConnections={hasConnections}
      connections={connections || []}
    />
  )
}
