"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import type { AirtableConnection } from "@/types/airtable"

interface ErrorBannerProps {
  connections: AirtableConnection[]
  onReconnect?: (id: string) => void
}

export function ErrorBanner({ connections, onReconnect }: ErrorBannerProps) {
  // Filter for disconnected or error connections
  const problemConnections = connections.filter(
    (c) => c.status === "disconnected" || c.status === "error"
  )

  if (problemConnections.length === 0) {
    return null
  }

  // Show banner for each problem connection
  return (
    <div className="space-y-3">
      {problemConnections.map((connection) => (
        <Alert key={connection.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Airtable-Verbindung unterbrochen</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Die Verbindung zu <strong>{connection.airtable_email}</strong> ist
              nicht mehr gültig.
              {connection.error_message && (
                <span className="block text-sm opacity-80">
                  {connection.error_message}
                </span>
              )}
            </span>
            {onReconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReconnect(connection.id)}
                className="shrink-0 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <RefreshCw className="h-4 w-4" />
                Erneut verbinden
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
