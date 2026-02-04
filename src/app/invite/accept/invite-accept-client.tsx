"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Building2, CheckCircle, XCircle, AlertTriangle, Clock, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import type { OrgRole } from "@/types/airtable"

// EC-15: "org_deleted" hinzugefügt für gelöschte Organisationen
type InviteStatus = "pending" | "not_found" | "wrong_email" | "already_accepted" | "expired" | "org_deleted"

interface Invitation {
  id: string
  organizationName: string
  organizationId: string
  role: OrgRole
  inviterName: string
  expiresAt: string
}

interface InviteAcceptClientProps {
  status: InviteStatus
  userEmail: string
  invitationEmail?: string
  token?: string
  invitation?: Invitation
  existingOrgName?: string
}

const roleLabels: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
}

const roleDescriptions: Record<OrgRole, string> = {
  owner: "Voller Zugriff inkl. Org-Einstellungen",
  admin: "Voller Zugriff außer Org-Einstellungen",
  member: "Lesen + Kommentieren",
  viewer: "Nur Lesen",
}

export function InviteAcceptClient({
  status,
  userEmail,
  invitationEmail,
  token,
  invitation,
  existingOrgName,
}: InviteAcceptClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<"accept" | "decline" | null>(null)

  const handleAccept = async () => {
    if (!token) return

    setIsLoading(true)
    setAction("accept")

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        // EC-15: Prüfe auf gelöschte Organisation
        if (response.status === 404 || data.code === "ORG_NOT_FOUND" || data.code === "ORG_DELETED") {
          toast.error("Diese Einladung ist nicht mehr gültig")
          router.refresh() // Lädt die Seite neu, Server wird "org_deleted" Status zurückgeben
          return
        }
        toast.error(data.error || "Fehler beim Annehmen der Einladung")
        return
      }

      toast.success(`Du bist jetzt Mitglied von ${invitation?.organizationName}!`)
      router.push("/dashboard")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const handleDecline = async () => {
    if (!token) return

    setIsLoading(true)
    setAction("decline")

    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Ablehnen der Einladung")
        return
      }

      toast.success("Einladung abgelehnt")
      router.push("/dashboard")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
      {/* Header with Logo */}
      <header className="py-6 px-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">B</span>
            </div>
            <span className="font-bold text-2xl">Basewatch</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Not Found */}
          {status === "not_found" && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Einladung nicht gefunden</CardTitle>
                  <CardDescription className="mt-2">
                    Diese Einladung existiert nicht oder wurde bereits verwendet.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Zum Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Wrong Email */}
          {status === "wrong_email" && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Falsche E-Mail-Adresse</CardTitle>
                  <CardDescription className="mt-2">
                    Diese Einladung ist für eine andere E-Mail-Adresse bestimmt.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Eingeladen:</p>
                    <p className="font-medium">{invitationEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Angemeldet als:</p>
                    <p className="font-medium">{userEmail}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Melde dich mit der eingeladenen E-Mail-Adresse an, um diese
                  Einladung anzunehmen.
                </p>
                <Button onClick={() => router.push("/dashboard")} className="w-full" variant="outline">
                  Zum Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Already Accepted */}
          {status === "already_accepted" && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Bereits angenommen</CardTitle>
                  <CardDescription className="mt-2">
                    Du hast diese Einladung bereits angenommen.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Zum Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Expired */}
          {status === "expired" && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Einladung abgelaufen</CardTitle>
                  <CardDescription className="mt-2">
                    Diese Einladung ist nicht mehr gültig. Bitte den
                    Organisationsadmin um eine neue Einladung.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/dashboard")} className="w-full" variant="outline">
                  Zum Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* EC-15: Organisation gelöscht - Einladung nicht mehr gültig */}
          {status === "org_deleted" && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <XCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Einladung nicht mehr gültig</CardTitle>
                  <CardDescription className="mt-2">
                    Diese Einladung ist nicht mehr gültig.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Die Einladung kann nicht mehr angenommen werden.
                  Bitte kontaktiere die Person, die dich eingeladen hat.
                </p>
                <Button onClick={() => router.push("/dashboard")} className="w-full" variant="outline">
                  Zum Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pending - Valid Invitation */}
          {status === "pending" && invitation && (
            <Card>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">Einladung zu {invitation.organizationName}</CardTitle>
                  <CardDescription className="mt-2">
                    {invitation.inviterName} hat dich eingeladen, der Organisation
                    beizutreten.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Existing Org Warning */}
                {existingOrgName && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Du bist bereits Mitglied</AlertTitle>
                    <AlertDescription>
                      Du bist aktuell Mitglied von <strong>{existingOrgName}</strong>.
                      Wenn du diese Einladung annimmst, verlässt du diese Organisation.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Invitation Details */}
                <div className="space-y-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Organisation</span>
                    <span className="font-medium">{invitation.organizationName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deine Rolle</span>
                    <Badge>{roleLabels[invitation.role]}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Eingeladen von</span>
                    <span className="font-medium">{invitation.inviterName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gültig bis</span>
                    <span className="text-sm">{formatDate(invitation.expiresAt)}</span>
                  </div>
                </div>

                {/* Role Description */}
                <div className="text-sm text-muted-foreground text-center">
                  Als <strong>{roleLabels[invitation.role]}</strong>:{" "}
                  {roleDescriptions[invitation.role]}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && action === "decline" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Ablehnen"
                    )}
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && action === "accept" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Wird angenommen...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Annehmen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
