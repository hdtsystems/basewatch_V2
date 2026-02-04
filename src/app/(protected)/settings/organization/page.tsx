import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrganizationSettingsClient } from "./organization-settings-client"
import type { PlanType, OrgRole } from "@/types/airtable"

export const metadata = {
  title: "Organisation | Einstellungen | Basewatch",
  description: "Verwalte deine Organisationseinstellungen",
}

export default async function OrganizationSettingsPage() {
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
        slug,
        plan,
        created_at
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
    slug: string
    plan: PlanType
    created_at: string
  }

  // Get counts for usage display
  const [
    { count: connectionCount },
    { count: baseCount },
    { count: memberCount },
  ] = await Promise.all([
    supabase
      .from("airtable_connections")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id),
    supabase
      .from("monitored_bases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("is_active", true),
    supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", org.id),
  ])

  return (
    <OrganizationSettingsClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        createdAt: org.created_at,
      }}
      userRole={membership.role as OrgRole}
      usage={{
        connections: connectionCount || 0,
        bases: baseCount || 0,
        members: memberCount || 0,
      }}
    />
  )
}
