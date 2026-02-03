"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ConnectionList,
  ConnectButton,
  ErrorBanner,
  PlanLimitBanner,
} from "@/components/airtable"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import type {
  AirtableConnection,
  PlanType,
  OrgRole,
} from "@/types/airtable"
import { PLAN_LIMITS } from "@/types/airtable"
import Link from "next/link"

interface ConnectionsPageClientProps {
  userEmail: string
  orgId: string
  orgPlan: PlanType
  userRole: OrgRole
}

export function ConnectionsPageClient({
  userEmail,
  orgId,
  orgPlan,
  userRole,
}: ConnectionsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<AirtableConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const canManage = userRole === "owner" || userRole === "admin"
  const limit = PLAN_LIMITS[orgPlan]
  const isAtLimit = connections.length >= limit

  // Check for OAuth callback messages
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "connected") {
      toast.success("Airtable-Account erfolgreich verbunden")
      // Clear the query params
      router.replace("/settings/connections")
    } else if (success === "updated") {
      toast.success("Verbindung aktualisiert")
      router.replace("/settings/connections")
    } else if (error === "cancelled") {
      toast.info("Verbindung abgebrochen - Du kannst es jederzeit erneut versuchen")
      router.replace("/settings/connections")
    } else if (error) {
      toast.error("Verbindung fehlgeschlagen: " + decodeURIComponent(error))
      router.replace("/settings/connections")
    }
  }, [searchParams, router])

  // Fetch connections on mount
  useEffect(() => {
    async function fetchConnections() {
      if (!orgId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/airtable/connections?org_id=${orgId}`)

        if (!response.ok) {
          throw new Error("Fehler beim Laden")
        }

        const data = await response.json()
        setConnections(data.connections || [])
      } catch {
        toast.error("Verbindungen konnten nicht geladen werden")
      } finally {
        setIsLoading(false)
      }
    }

    fetchConnections()
  }, [orgId])

  const handleDisconnect = async (id: string) => {
    try {
      const response = await fetch(`/api/airtable/connections/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Fehler beim Trennen")
      }

      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error("Verbindung konnte nicht getrennt werden")
      throw new Error("Disconnect failed")
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      const response = await fetch(`/api/airtable/connections/${id}/sync`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren")
      }

      const data = await response.json()

      // Update connection in list
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data.connection } : c))
      )
    } catch {
      toast.error("Aktualisierung fehlgeschlagen")
      throw new Error("Refresh failed")
    }
  }

  const handleReconnect = (id: string) => {
    // Redirect to OAuth flow to re-authenticate
    window.location.href = `/api/airtable/connect?org_id=${orgId}&reconnect=${id}`
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Navigation */}
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="font-semibold text-lg">Basewatch</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Airtable-Verbindungen</h1>
            <p className="text-muted-foreground">
              Verbinde und verwalte deine Airtable-Accounts
            </p>
          </div>

          {canManage && connections.length > 0 && (
            <ConnectButton
              orgId={orgId}
              disabled={isAtLimit}
              disabledReason={
                isAtLimit
                  ? `Dein ${orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}-Plan erlaubt maximal ${limit} Verbindung${limit !== 1 ? "en" : ""}`
                  : undefined
              }
            />
          )}
        </div>

        {/* Banners */}
        <div className="mb-6 space-y-4">
          <ErrorBanner
            connections={connections}
            onReconnect={handleReconnect}
          />
          <PlanLimitBanner currentCount={connections.length} plan={orgPlan} />
        </div>

        {/* Connection List */}
        <ConnectionList
          orgId={orgId}
          connections={connections}
          canManage={canManage}
          isLoading={isLoading}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
        />

        {/* Usage Info for non-empty state */}
        {!isLoading && connections.length > 0 && orgPlan !== "enterprise" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {connections.length} von {limit === Infinity ? "∞" : limit} Verbindungen
            verwendet
          </p>
        )}
      </main>
    </div>
  )
}
