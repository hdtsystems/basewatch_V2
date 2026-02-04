import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrganizationStepClient } from "./organization-step-client"

export default async function OrganizationStepPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has an organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name)")
    .eq("user_id", user.id)
    .single()

  // If already has org, skip to next step
  if (membership?.organization_id) {
    redirect("/onboarding/airtable")
  }

  return <OrganizationStepClient />
}
