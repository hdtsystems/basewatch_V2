"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Check, X, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Connection {
  id: string
  airtable_email: string
  status: string
}

interface AirtableStepClientProps {
  orgId: string
  hasConnections: boolean
  connections: Connection[]
}

export function AirtableStepClient({
  orgId,
  hasConnections,
  connections,
}: AirtableStepClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "connected") {
      toast.success("Airtable-Account erfolgreich verbunden!")
      // Reload to update connections list
      router.replace("/onboarding/airtable")
      // Auto-advance to next step after short delay
      setTimeout(() => {
        handleContinue()
      }, 1500)
    } else if (error) {
      toast.error("Verbindung fehlgeschlagen: " + decodeURIComponent(error))
      router.replace("/onboarding/airtable")
    }
  }, [searchParams, router])

  const handleConnect = () => {
    // Redirect to OAuth flow with return URL
    window.location.href = `/api/airtable/connect?org_id=${orgId}&return_to=/onboarding/airtable`
  }

  const handleSkip = async () => {
    // Update onboarding status - skip airtable step
    await fetch("/api/onboarding/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_step: 3,
      }),
    })

    toast.info("Du kannst Airtable jederzeit später verbinden.")
    router.push("/onboarding/bases")
  }

  const handleContinue = async () => {
    // Update onboarding status to step 3
    await fetch("/api/onboarding/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_step: 3,
      }),
    })

    router.push("/onboarding/bases")
  }

  const handleBack = () => {
    router.push("/onboarding/organization")
  }

  return (
    <OnboardingLayout currentStep={2} completedSteps={[1]}>
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Link2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Verbinde deinen Airtable-Account</CardTitle>
            <CardDescription className="mt-2">
              Basewatch benötigt Zugriff auf deine Airtable-Workspaces um
              Schema-Änderungen und Nutzung zu überwachen.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connected Accounts (if any) */}
          {hasConnections && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Verbundene Accounts:</p>
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{conn.airtable_email}</span>
                </div>
              ))}
            </div>
          )}

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            variant={hasConnections ? "outline" : "default"}
            className="w-full h-12"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {hasConnections ? "Weiteren Account verbinden" : "Mit Airtable verbinden"}
          </Button>

          {/* What we use / don't use */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Was wir verwenden:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Workspace- und Base-Informationen
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                Tabellen- und Feld-Schema
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4 text-red-500" />
                Keine Inhalte deiner Datensätze
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            {hasConnections ? (
              <Button
                onClick={handleContinue}
                className="flex-1"
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1"
              >
                Später einrichten
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  )
}
