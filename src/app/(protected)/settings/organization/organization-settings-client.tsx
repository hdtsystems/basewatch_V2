"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, Pencil, Link2, Database, Users, ArrowUpRight, Loader2, Check, Calendar } from "lucide-react"
import { toast } from "sonner"
import { PLAN_LIMITS_FULL, type PlanType, type OrgRole } from "@/types/airtable"

interface OrganizationSettingsClientProps {
  org: {
    id: string
    name: string
    slug: string
    plan: PlanType
    createdAt: string
  }
  userRole: OrgRole
  usage: {
    connections: number
    bases: number
    members: number
  }
}

export function OrganizationSettingsClient({
  org,
  userRole,
  usage,
}: OrganizationSettingsClientProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newName, setNewName] = useState(org.name)
  const [isLoading, setIsLoading] = useState(false)

  const canEdit = userRole === "owner"
  const planLimits = PLAN_LIMITS_FULL[org.plan]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const handleSaveName = async () => {
    if (newName.trim().length < 2) {
      toast.error("Name muss mindestens 2 Zeichen haben")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Speichern")
        return
      }

      toast.success("Organisationsname aktualisiert")
      setIsEditDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercent = (current: number, max: number) => {
    if (max === Infinity) return 0
    return Math.min((current / max) * 100, 100)
  }

  const formatLimit = (limit: number) => {
    if (limit === Infinity) return "Unbegrenzt"
    return limit.toString()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Organisation</h1>
        <p className="text-muted-foreground">
          Verwalte deine Organisationseinstellungen
        </p>
      </div>

      {/* Organization Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <CardDescription>/{org.slug}</CardDescription>
              </div>
            </div>
            {canEdit && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Organisationsname ändern</DialogTitle>
                    <DialogDescription>
                      Der Slug wird automatisch aktualisiert.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organisationsname</Label>
                      <Input
                        id="org-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Meine Firma GmbH"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isLoading}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleSaveName}
                      disabled={isLoading || newName.trim().length < 2}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Wird gespeichert...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Speichern
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Erstellt am</p>
                <p className="text-sm font-medium">{formatDate(org.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <Badge variant={org.plan === "free" ? "secondary" : "default"}>
                  {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Nutzung</CardTitle>
          <CardDescription>
            Aktuelle Nutzung deiner {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}-Plan Limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span>Airtable-Verbindungen</span>
              </div>
              <span className="font-medium">
                {usage.connections} / {formatLimit(planLimits.connections)}
              </span>
            </div>
            <Progress
              value={getProgressPercent(usage.connections, planLimits.connections)}
              className="h-2"
            />
          </div>

          {/* Bases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Überwachte Bases</span>
              </div>
              <span className="font-medium">
                {usage.bases} / {formatLimit(planLimits.bases)}
              </span>
            </div>
            <Progress
              value={getProgressPercent(usage.bases, planLimits.bases)}
              className="h-2"
            />
          </div>

          {/* Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Teammitglieder</span>
              </div>
              <span className="font-medium">
                {usage.members} / {formatLimit(planLimits.members)}
              </span>
            </div>
            <Progress
              value={getProgressPercent(usage.members, planLimits.members)}
              className="h-2"
            />
          </div>

          {/* Upgrade CTA */}
          {org.plan === "free" && (
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <a href="/settings/billing">
                  Plan upgraden
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone - Only for owners */}
      {canEdit && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
            <CardDescription>
              Diese Aktionen können nicht rückgängig gemacht werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Organisation löschen
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Kontaktiere den Support um deine Organisation zu löschen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
