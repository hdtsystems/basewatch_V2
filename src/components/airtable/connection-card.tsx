"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { DisconnectDialog } from "./disconnect-dialog"
import { Link2, RefreshCw, Trash2, Loader2 } from "lucide-react"
import type { AirtableConnection } from "@/types/airtable"
import { toast } from "sonner"

interface ConnectionCardProps {
  connection: AirtableConnection
  canManage: boolean
  onDisconnect?: (id: string) => Promise<void>
  onRefresh?: (id: string) => Promise<void>
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function ConnectionCard({
  connection,
  canManage,
  onDisconnect,
  onRefresh,
}: ConnectionCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh(connection.id)
      toast.success("Verbindung aktualisiert")
    } catch {
      toast.error("Aktualisierung fehlgeschlagen")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!onDisconnect) return

    try {
      await onDisconnect(connection.id)
      toast.success("Verbindung getrennt")
      setShowDisconnectDialog(false)
    } catch {
      toast.error("Trennung fehlgeschlagen")
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Connection Info */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>

              {/* Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{connection.airtable_email}</h3>
                  <StatusBadge status={connection.status} />
                </div>

                <p className="text-sm text-muted-foreground">
                  Verbunden am: {formatDate(connection.created_at)}
                </p>

                <p className="text-sm text-muted-foreground">
                  {connection.workspace_count} Workspace
                  {connection.workspace_count !== 1 ? "s" : ""} ·{" "}
                  {connection.base_count} Base
                  {connection.base_count !== 1 ? "s" : ""}
                </p>

                {connection.error_message && (
                  <p className="text-sm text-destructive">
                    {connection.error_message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons - nur für Owner/Admin */}
            {canManage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="sr-only md:not-sr-only">
                    Aktualisieren
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisconnectDialog(true)}
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">
                    Trennen
                  </span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DisconnectDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        email={connection.airtable_email}
        onConfirm={handleDisconnect}
      />
    </>
  )
}
