import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check onboarding status and redirect to current step
  const { data: onboardingStatus } = await supabase
    .from("user_onboarding_status")
    .select("current_step, completed_at")
    .eq("user_id", user.id)
    .single()

  // If completed, go to dashboard
  if (onboardingStatus?.completed_at) {
    redirect("/dashboard")
  }

  // Redirect to current step (default to step 1)
  const currentStep = onboardingStatus?.current_step || 1

  const stepRoutes: Record<number, string> = {
    1: "/onboarding/organization",
    2: "/onboarding/airtable",
    3: "/onboarding/bases",
    4: "/onboarding/team",
  }

  redirect(stepRoutes[currentStep] || "/onboarding/organization")
}
