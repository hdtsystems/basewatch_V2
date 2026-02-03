import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConnectionsPageClient } from "./connections-page-client"
import type { PlanType, OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Airtable-Verbindungen | Basewatch",
  description: "Verwalte deine Airtable-Verbindungen",
}

export default async function ConnectionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's organization membership with org details
  const { data: membership } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization_id,
      organizations (
        id,
        plan
      )
    `)
    .eq("user_id", user.id)
    .single()

  // If user has no organization, show dialog to create one
  if (!membership?.organizations) {
    return (
      <ConnectionsPageClient
        userEmail={user.email || ""}
        orgId=""
        orgPlan="free"
        userRole="owner"
        hasNoOrganization={true}
      />
    )
  }

  // Supabase returns the joined table as an object (not array) for single relations
  const org = membership.organizations as unknown as { id: string; plan: PlanType }

  return (
    <ConnectionsPageClient
      userEmail={user.email || ""}
      orgId={org.id}
      orgPlan={org.plan}
      userRole={membership.role as OrgRole}
    />
  )
}
