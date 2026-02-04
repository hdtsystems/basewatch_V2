"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function OrganizationStepClient() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const isValidName = name.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidName) {
      setError("Name muss mindestens 2 Zeichen haben")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Erstellen der Organisation")
        return
      }

      // Update onboarding status to step 2
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_step: 2,
          organization_id: data.organization.id,
        }),
      })

      toast.success("Organisation erstellt!")
      router.push("/onboarding/airtable")
    } catch {
      setError("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingLayout currentStep={1}>
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Willkommen bei Basewatch!</CardTitle>
            <CardDescription className="mt-2">
              Lass uns deine Organisation einrichten.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisationsname</Label>
              <Input
                id="org-name"
                placeholder="z.B. Meine Firma GmbH"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                disabled={isLoading}
                autoFocus
                className="h-12"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Der Name ist für dein Team sichtbar und kann später geändert werden.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading || !isValidName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  Organisation erstellen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </OnboardingLayout>
  )
}
