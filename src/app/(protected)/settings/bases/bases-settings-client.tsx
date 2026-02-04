"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Database, ChevronDown, RefreshCw, Loader2, AlertCircle, ArrowUpRight, Link2 } from "lucide-react"
import { toast } from "sonner"
import { PLAN_LIMITS_FULL, type PlanType, type OrgRole } from "@/types/airtable"

interface Base {
  id: string
  name: string
  airtableBaseId: string
  isMonitored: boolean
}

interface Workspace {
  id: string
  name: string
  connectionEmail: string
  bases: Base[]
}

interface BasesSettingsClientProps {
  orgId: string
  orgPlan: PlanType
  userRole: OrgRole
  workspaces: Workspace[]
  monitoredCount: number
}

export function BasesSettingsClient({
  orgId,
  orgPlan,
  userRole,
  workspaces: initialWorkspaces,
  monitoredCount: initialMonitoredCount,
}: BasesSettingsClientProps) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState(initialWorkspaces)
  const [monitoredCount, setMonitoredCount] = useState(initialMonitoredCount)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(initialWorkspaces.map((ws) => ws.id))
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingBaseId, setLoadingBaseId] = useState<string | null>(null)

  const canManageBases = userRole === "owner" || userRole === "admin"
  const planLimits = PLAN_LIMITS_FULL[orgPlan]
  const maxBases = planLimits.bases === Infinity ? 999 : planLimits.bases
  const isAtLimit = monitoredCount >= maxBases
  const progressPercent = (monitoredCount / maxBases) * 100

  const totalBases = workspaces.reduce((acc, ws) => acc + ws.bases.length, 0)
  const hasNoConnections = workspaces.length === 0

  const toggleWorkspace = (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces)
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)
    }
    setExpandedWorkspaces(newExpanded)
  }

  const handleToggleMonitor = async (base: Base, workspaceId: string) => {
    // Check if trying to add when at limit
    if (!base.isMonitored && isAtLimit) {
      toast.error("Plan-Limit erreicht. Upgrade für mehr Bases.")
      return
    }

    setLoadingBaseId(base.id)

    try {
      if (base.isMonitored) {
        // Deactivate monitoring
        const response = await fetch(`/api/organizations/${orgId}/bases/${base.id}/monitor`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const data = await response.json()
          toast.error(data.error || "Fehler beim Deaktivieren")
          return
        }

        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  bases: ws.bases.map((b) =>
                    b.id === base.id ? { ...b, isMonitored: false } : b
                  ),
                }
              : ws
          )
        )
        setMonitoredCount((prev) => prev - 1)
        toast.success(`${base.name} wird nicht mehr überwacht`)
      } else {
        // Activate monitoring
        const response = await fetch(`/api/organizations/${orgId}/bases/${base.id}/monitor`, {
          method: "POST",
        })

        if (!response.ok) {
          const data = await response.json()
          toast.error(data.error || "Fehler beim Aktivieren")
          return
        }

        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === workspaceId
              ? {
                  ...ws,
                  bases: ws.bases.map((b) =>
                    b.id === base.id ? { ...b, isMonitored: true } : b
                  ),
                }
              : ws
          )
        )
        setMonitoredCount((prev) => prev + 1)
        toast.success(`${base.name} wird jetzt überwacht`)
      }
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingBaseId(null)
    }
  }

  const handleRefreshBases = async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch(`/api/organizations/${orgId}/bases/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Aktualisieren")
        return
      }

      toast.success("Bases aktualisiert")
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Empty state: No connections
  if (hasNoConnections) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Airtable Bases</h1>
          <p className="text-muted-foreground">
            Wähle aus, welche Bases überwacht werden sollen
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Kein Airtable verbunden</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Verbinde zuerst deinen Airtable-Account, um Bases zur Überwachung
              auszuwählen.
            </p>
            <Button asChild>
              <a href="/settings/connections">
                Airtable verbinden
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Airtable Bases</h1>
          <p className="text-muted-foreground">
            Wähle aus, welche Bases überwacht werden sollen
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshBases} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Wird aktualisiert...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Bases aktualisieren
            </>
          )}
        </Button>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {monitoredCount} von{" "}
                  {maxBases === 999 ? totalBases : maxBases} Bases überwacht
                </span>
              </div>
              <Badge variant={orgPlan === "free" ? "secondary" : "default"}>
                {orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}-Plan
              </Badge>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Limit Warning */}
      {isAtLimit && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Limit erreicht</p>
            <p className="text-sm opacity-90">
              Du hast das Maximum an überwachten Bases für deinen Plan erreicht.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/settings/billing">
              Upgraden
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      )}

      {/* Workspaces List */}
      <div className="space-y-4">
        {workspaces.map((workspace) => {
          const monitoredInWorkspace = workspace.bases.filter((b) => b.isMonitored).length

          return (
            <Card key={workspace.id}>
              <Collapsible
                open={expandedWorkspaces.has(workspace.id)}
                onOpenChange={() => toggleWorkspace(workspace.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedWorkspaces.has(workspace.id) ? "" : "-rotate-90"
                          }`}
                        />
                        <div className="text-left">
                          <CardTitle className="text-base">{workspace.name}</CardTitle>
                          <CardDescription>{workspace.connectionEmail}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {monitoredInWorkspace}/{workspace.bases.length}
                      </Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="divide-y">
                      {workspace.bases.map((base) => {
                        const isLoading = loadingBaseId === base.id
                        const canToggle =
                          canManageBases && (!isAtLimit || base.isMonitored)

                        return (
                          <div
                            key={base.id}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex items-center gap-3">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{base.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {base.isMonitored ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                >
                                  Überwacht
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Inaktiv
                                </Badge>
                              )}
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Switch
                                  checked={base.isMonitored}
                                  onCheckedChange={() =>
                                    handleToggleMonitor(base, workspace.id)
                                  }
                                  disabled={!canToggle}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
