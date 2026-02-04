"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingLayout } from "@/components/onboarding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Database, ChevronDown, ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Link2Off } from "lucide-react"
import { toast } from "sonner"
import { PLAN_LIMITS_FULL, type PlanType } from "@/types/airtable"

interface Base {
  id: string
  name: string
  airtable_base_id: string
}

interface Workspace {
  id: string
  name: string
  connectionEmail: string
  bases: Base[]
}

interface BasesStepClientProps {
  orgId: string
  orgPlan: PlanType
  workspaces: Workspace[]
  hasConnections: boolean
  // EC-12: Initialer Token-Status (von Server-Seite)
  tokenExpired?: boolean
}

export function BasesStepClient({
  orgId,
  orgPlan,
  workspaces,
  hasConnections,
  tokenExpired: initialTokenExpired = false,
}: BasesStepClientProps) {
  const router = useRouter()
  const [selectedBases, setSelectedBases] = useState<Set<string>>(new Set())
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(workspaces.map((ws) => ws.id))
  )
  const [isLoading, setIsLoading] = useState(false)
  // EC-12: State für abgelaufenen Token
  const [tokenExpired, setTokenExpired] = useState(initialTokenExpired)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const planLimits = PLAN_LIMITS_FULL[orgPlan]
  const maxBases = planLimits.bases === Infinity ? 999 : planLimits.bases
  const totalBases = workspaces.reduce((acc, ws) => acc + ws.bases.length, 0)

  const isAtLimit = selectedBases.size >= maxBases
  const progressPercent = (selectedBases.size / maxBases) * 100

  const toggleBase = (baseId: string) => {
    const newSelected = new Set(selectedBases)
    if (newSelected.has(baseId)) {
      newSelected.delete(baseId)
    } else if (!isAtLimit) {
      newSelected.add(baseId)
    }
    setSelectedBases(newSelected)
  }

  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces)
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)
    }
    setExpandedWorkspaces(newExpanded)
  }

  const selectAllInWorkspace = (workspace: Workspace) => {
    const newSelected = new Set(selectedBases)
    let addedCount = 0

    for (const base of workspace.bases) {
      if (!newSelected.has(base.id) && newSelected.size < maxBases) {
        newSelected.add(base.id)
        addedCount++
      }
    }

    setSelectedBases(newSelected)

    if (addedCount < workspace.bases.length && newSelected.size >= maxBases) {
      toast.info(`Plan-Limit erreicht. Upgrade für mehr Bases.`)
    }
  }

  const deselectAllInWorkspace = (workspace: Workspace) => {
    const newSelected = new Set(selectedBases)
    for (const base of workspace.bases) {
      newSelected.delete(base.id)
    }
    setSelectedBases(newSelected)
  }

  const handleContinue = async () => {
    if (selectedBases.size === 0) {
      toast.error("Bitte wähle mindestens eine Base aus")
      return
    }

    setIsLoading(true)

    try {
      // Save selected bases to monitored_bases
      const response = await fetch("/api/bases/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: orgId,
          base_ids: Array.from(selectedBases),
        }),
      })

      // EC-12: Prüfe auf 401 (Token abgelaufen)
      if (response.status === 401) {
        setTokenExpired(true)
        toast.error("Deine Airtable-Verbindung ist abgelaufen")
        return
      }

      if (!response.ok) {
        const data = await response.json()
        // EC-12: Zusätzliche Prüfung auf Token-Fehler in der Response
        if (data.code === "TOKEN_EXPIRED" || data.error?.includes("token") || data.error?.includes("Token")) {
          setTokenExpired(true)
          toast.error("Deine Airtable-Verbindung ist abgelaufen")
          return
        }
        toast.error(data.error || "Fehler beim Speichern")
        return
      }

      // Update onboarding status to step 4
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_step: 4,
        }),
      })

      toast.success(`${selectedBases.size} Base${selectedBases.size !== 1 ? "s" : ""} ausgewählt`)
      router.push("/onboarding/team")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  // EC-12: Handler für "Erneut verbinden"
  const handleReconnect = () => {
    // Navigiere zurück zu Schritt 2 (Airtable verbinden)
    router.push("/onboarding/airtable?reconnect=true")
  }

  const handleBack = () => {
    router.push("/onboarding/airtable")
  }

  const handleSkip = async () => {
    // Update onboarding status to step 4 without selecting bases
    await fetch("/api/onboarding/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_step: 4,
      }),
    })

    toast.info("Du kannst Bases jederzeit später auswählen.")
    router.push("/onboarding/team")
  }

  // No connections state
  if (!hasConnections) {
    return (
      <OnboardingLayout currentStep={3} completedSteps={[1, 2]}>
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Keine Airtable-Verbindung</CardTitle>
              <CardDescription className="mt-2">
                Verbinde zuerst deinen Airtable-Account, um Bases auswählen zu können.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="flex-1">
                Überspringen
              </Button>
            </div>
          </CardContent>
        </Card>
      </OnboardingLayout>
    )
  }

  // EC-12: Token abgelaufen - Zeige Reconnect-UI
  if (tokenExpired) {
    return (
      <OnboardingLayout currentStep={3} completedSteps={[1, 2]}>
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Link2Off className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Airtable-Verbindung abgelaufen</CardTitle>
              <CardDescription className="mt-2">
                Deine Airtable-Verbindung ist abgelaufen. Bitte verbinde deinen Account erneut,
                um Bases auswählen zu können.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info-Box */}
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p className="text-sm text-muted-foreground">
                Deine bereits ausgewählten Bases bleiben gespeichert. Nach der erneuten
                Verbindung kannst du dort weitermachen, wo du aufgehört hast.
              </p>
            </div>

            {/* Aktionen */}
            <div className="flex flex-col gap-3">
              <Button onClick={handleReconnect} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Erneut verbinden
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <Button variant="ghost" onClick={handleSkip} className="flex-1">
                  Überspringen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout currentStep={3} completedSteps={[1, 2]}>
      <Card>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Welche Bases möchtest du überwachen?</CardTitle>
            <CardDescription className="mt-2">
              Wähle die Airtable-Bases aus, deren Schema-Änderungen du überwachen möchtest.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {selectedBases.size} von {maxBases === 999 ? totalBases : maxBases} Bases ausgewählt
              </span>
              <span className="text-muted-foreground">
                {orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}-Plan
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Limit Warning */}
          {isAtLimit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                Limit erreicht. Upgrade auf Pro für bis zu 10 Bases.
              </p>
            </div>
          )}

          {/* Workspaces List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {workspaces.map((workspace) => {
              const selectedInWorkspace = workspace.bases.filter((b) =>
                selectedBases.has(b.id)
              ).length
              const allSelectedInWorkspace =
                selectedInWorkspace === workspace.bases.length

              return (
                <Collapsible
                  key={workspace.id}
                  open={expandedWorkspaces.has(workspace.id)}
                  onOpenChange={() => toggleWorkspace(workspace.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedWorkspaces.has(workspace.id)
                                ? ""
                                : "-rotate-90"
                            }`}
                          />
                          <span className="font-medium">{workspace.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({selectedInWorkspace}/{workspace.bases.length})
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t px-3 py-2 space-y-1">
                        {/* Select/Deselect All */}
                        <div className="flex gap-2 pb-2 border-b mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAllInWorkspace(workspace)}
                            disabled={allSelectedInWorkspace}
                            className="text-xs h-7"
                          >
                            Alle auswählen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deselectAllInWorkspace(workspace)}
                            disabled={selectedInWorkspace === 0}
                            className="text-xs h-7"
                          >
                            Keine auswählen
                          </Button>
                        </div>

                        {/* Bases */}
                        {workspace.bases.map((base) => (
                          <div
                            key={base.id}
                            className="flex items-center gap-3 py-2 px-2 hover:bg-muted/30 rounded"
                          >
                            <Checkbox
                              id={base.id}
                              checked={selectedBases.has(base.id)}
                              onCheckedChange={() => toggleBase(base.id)}
                              disabled={
                                !selectedBases.has(base.id) && isAtLimit
                              }
                            />
                            <label
                              htmlFor={base.id}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {base.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            <Button
              onClick={handleContinue}
              disabled={isLoading || selectedBases.size === 0}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  Weiter
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
