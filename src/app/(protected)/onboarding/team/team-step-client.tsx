"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import type { OrgRole } from "@/types/airtable"

interface TeamStepClientProps {
  orgId: string
  orgName: string
}

const roleDescriptions: Record<Exclude<OrgRole, "owner">, string> = {
  admin: "Voller Zugriff außer Org-Einstellungen",
  member: "Lesen + Kommentieren",
  viewer: "Nur Lesen",
}

export function TeamStepClient({ orgId, orgName }: TeamStepClientProps) {
  const router = useRouter()
  const [emails, setEmails] = useState("")
  const [role, setRole] = useState<Exclude<OrgRole, "owner">>("member")
  const [isLoading, setIsLoading] = useState(false)
  const [sentInvites, setSentInvites] = useState<string[]>([])

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,\s]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0 && email.includes("@"))
  }

  const validEmails = parseEmails(emails)
  const hasValidEmails = validEmails.length > 0

  const handleSendInvites = async () => {
    if (!hasValidEmails) {
      toast.error("Bitte gib mindestens eine gültige E-Mail-Adresse ein")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: validEmails,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Fehler beim Senden der Einladungen")
        return
      }

      setSentInvites((prev) => [...prev, ...validEmails])
      setEmails("")
      toast.success(`${validEmails.length} Einladung${validEmails.length !== 1 ? "en" : ""} gesendet`)
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      // Mark onboarding as completed
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: true,
        }),
      })

      toast.success("Onboarding abgeschlossen!")
      router.push("/onboarding/complete")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    await handleComplete()
  }

  const handleBack = () => {
    router.push("/onboarding/bases")
  }

  return (
    <OnboardingLayout currentStep={4} completedSteps={[1, 2, 3]}>
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Lade dein Team ein</CardTitle>
            <CardDescription className="mt-2">
              Teammitglieder können die überwachten Bases einsehen und
              Benachrichtigungen erhalten.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sent Invites */}
          {sentInvites.length > 0 && (
            <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Einladungen gesendet:
              </p>
              <div className="flex flex-wrap gap-2">
                {sentInvites.map((email) => (
                  <span
                    key={email}
                    className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="emails">E-Mail-Adressen</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="emails"
                placeholder="max@firma.de, anna@firma.de"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-12"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Mehrere E-Mail-Adressen mit Komma trennen
            </p>
            {validEmails.length > 0 && (
              <p className="text-sm text-primary">
                {validEmails.length} gültige E-Mail{validEmails.length !== 1 ? "s" : ""} erkannt
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Rolle für alle Eingeladenen</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Exclude<OrgRole, "owner">)}>
              <SelectTrigger id="role" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Descriptions */}
          <div className="space-y-2 p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-2">Rollen-Berechtigungen:</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className={role === "viewer" ? "text-foreground font-medium" : ""}>
                • <span className="font-medium">Viewer:</span> {roleDescriptions.viewer}
              </li>
              <li className={role === "member" ? "text-foreground font-medium" : ""}>
                • <span className="font-medium">Member:</span> {roleDescriptions.member}
              </li>
              <li className={role === "admin" ? "text-foreground font-medium" : ""}>
                • <span className="font-medium">Admin:</span> {roleDescriptions.admin}
              </li>
            </ul>
          </div>

          {/* Send Button */}
          {hasValidEmails && (
            <Button
              onClick={handleSendInvites}
              disabled={isLoading}
              className="w-full h-12"
              variant="secondary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {validEmails.length} Einladung{validEmails.length !== 1 ? "en" : ""} senden
                </>
              )}
            </Button>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            <Button
              onClick={sentInvites.length > 0 ? handleComplete : handleSkip}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird geladen...
                </>
              ) : sentInvites.length > 0 ? (
                <>
                  Abschließen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Überspringen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  )
}
