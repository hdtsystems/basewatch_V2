import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeamStepClient } from "./team-step-client"

export default async function TeamStepPage() {
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
    .select("organization_id, role, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .single()

  // If no org, go back to step 1
  if (!membership?.organization_id) {
    redirect("/onboarding/organization")
  }

  const org = membership.organizations as unknown as { id: string; name: string; plan: string } | null

  return (
    <TeamStepClient
      orgId={membership.organization_id}
      orgName={org?.name || ""}
    />
  )
}
