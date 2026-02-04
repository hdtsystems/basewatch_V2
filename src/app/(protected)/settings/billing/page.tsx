import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BillingSettingsClient } from "./billing-settings-client"
import type { PlanType, OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Abrechnung | Einstellungen | Basewatch",
  description: "Verwalte deinen Plan und deine Zahlungen",
}

export default async function BillingSettingsPage() {
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

  // Only owners can access billing
  if (membership.role !== "owner") {
    redirect("/settings/organization")
  }

  const org = membership.organizations as unknown as {
    id: string
    name: string
    plan: PlanType
  }

  return (
    <BillingSettingsClient
      orgId={org.id}
      orgName={org.name}
      orgPlan={org.plan}
    />
  )
}
