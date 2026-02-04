"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowUpRight, Link2, Database, Users, Clock } from "lucide-react"
import { PLAN_LIMITS_FULL, type PlanType } from "@/types/airtable"

interface BillingSettingsClientProps {
  orgId: string
  orgName: string
  orgPlan: PlanType
}

const planDetails: Record<PlanType, { name: string; price: string; description: string }> = {
  free: {
    name: "Free",
    price: "0 EUR",
    description: "Perfekt für den Einstieg",
  },
  pro: {
    name: "Pro",
    price: "29 EUR/Monat",
    description: "Für wachsende Teams",
  },
  enterprise: {
    name: "Enterprise",
    price: "Kontaktiere uns",
    description: "Für große Organisationen",
  },
}

export function BillingSettingsClient({
  orgId,
  orgName,
  orgPlan,
}: BillingSettingsClientProps) {
  const currentPlan = planDetails[orgPlan]
  const planLimits = PLAN_LIMITS_FULL[orgPlan]

  const formatLimit = (limit: number) => {
    if (limit === Infinity) return "Unbegrenzt"
    return limit.toString()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Abrechnung</h1>
        <p className="text-muted-foreground">
          Verwalte deinen Plan für {orgName}
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aktueller Plan</CardTitle>
              <CardDescription>{currentPlan.description}</CardDescription>
            </div>
            <Badge
              variant={orgPlan === "free" ? "secondary" : "default"}
              className="text-lg px-4 py-1"
            >
              {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Features */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatLimit(planLimits.connections)} Verbindungen</p>
                <p className="text-sm text-muted-foreground">Airtable-Accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatLimit(planLimits.bases)} Bases</p>
                <p className="text-sm text-muted-foreground">Überwachte Bases</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatLimit(planLimits.members)} Mitglieder</p>
                <p className="text-sm text-muted-foreground">Teammitglieder</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{planLimits.retentionDays} Tage</p>
                <p className="text-sm text-muted-foreground">Datenaufbewahrung</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Preis</p>
            <p className="text-2xl font-bold">{currentPlan.price}</p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan vergleichen</CardTitle>
          <CardDescription>
            Wähle den Plan, der am besten zu deinem Team passt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free Plan */}
            <div className={`p-6 rounded-lg border-2 ${orgPlan === "free" ? "border-primary" : "border-muted"}`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Free</h3>
                  <p className="text-2xl font-bold">0 EUR</p>
                  <p className="text-sm text-muted-foreground">Für immer kostenlos</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    1 Airtable-Verbindung
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    3 überwachte Bases
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    5 Teammitglieder
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    30 Tage Aufbewahrung
                  </li>
                </ul>
                {orgPlan === "free" ? (
                  <Button variant="outline" disabled className="w-full">
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    Downgrade
                  </Button>
                )}
              </div>
            </div>

            {/* Pro Plan */}
            <div className={`p-6 rounded-lg border-2 ${orgPlan === "pro" ? "border-primary" : "border-muted"}`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Pro</h3>
                  <p className="text-2xl font-bold">29 EUR</p>
                  <p className="text-sm text-muted-foreground">pro Monat</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    5 Airtable-Verbindungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    10 überwachte Bases
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    20 Teammitglieder
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    90 Tage Aufbewahrung
                  </li>
                </ul>
                {orgPlan === "pro" ? (
                  <Button variant="outline" disabled className="w-full">
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Upgrade
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className={`p-6 rounded-lg border-2 ${orgPlan === "enterprise" ? "border-primary" : "border-muted"}`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Enterprise</h3>
                  <p className="text-2xl font-bold">Individuell</p>
                  <p className="text-sm text-muted-foreground">Kontaktiere uns</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Unbegrenzte Verbindungen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Unbegrenzte Bases
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Unbegrenzte Mitglieder
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    365 Tage Aufbewahrung
                  </li>
                </ul>
                {orgPlan === "enterprise" ? (
                  <Button variant="outline" disabled className="w-full">
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    Kontaktieren
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-6 p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              Abrechnung kommt bald. Kontaktiere uns für Upgrade-Anfragen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
