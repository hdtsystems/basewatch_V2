"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, Sparkles, AlertTriangle } from "lucide-react"
import { PLAN_LIMITS, type PlanType } from "@/types/airtable"
import Link from "next/link"

interface PlanLimitBannerProps {
  currentCount: number
  plan: PlanType
  showUpgrade?: boolean
}

const planNames: Record<PlanType, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
}

export function PlanLimitBanner({
  currentCount,
  plan,
  showUpgrade = true,
}: PlanLimitBannerProps) {
  const limit = PLAN_LIMITS[plan]
  const isAtLimit = currentCount >= limit
  const isOverLimit = currentCount > limit

  // Don't show for enterprise (unlimited)
  if (plan === "enterprise") {
    return null
  }

  // Don't show if well under limit
  if (currentCount < limit) {
    return null
  }

  // Over limit (after downgrade)
  if (isOverLimit) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Limit überschritten</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Du hast {currentCount} Verbindungen, dein {planNames[plan]}-Plan
            erlaubt {limit}. Neue Verbindungen sind nicht möglich.
          </span>
          {showUpgrade && (
            <Button asChild size="sm" className="shrink-0">
              <Link href="/settings/billing">
                <Sparkles className="h-4 w-4" />
                Plan upgraden
              </Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // At limit
  if (isAtLimit) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Verbindungs-Limit erreicht</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Dein {planNames[plan]}-Plan erlaubt {limit} Verbindung
            {limit !== 1 ? "en" : ""}. Upgrade für mehr Verbindungen.
          </span>
          {showUpgrade && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/settings/billing">
                <Sparkles className="h-4 w-4" />
                Plan upgraden
              </Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
