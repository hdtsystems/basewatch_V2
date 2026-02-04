import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has an organization (completed onboarding)
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  // Check onboarding status
  const { data: onboardingStatus } = await supabase
    .from("user_onboarding_status")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // If user has org and completed onboarding, redirect to dashboard
  if (membership && onboardingStatus?.completed_at) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
