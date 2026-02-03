"use client"

import { ConnectButton } from "./connect-button"
import { Link2Off } from "lucide-react"

interface EmptyStateProps {
  orgId: string
  canConnect: boolean
}

export function EmptyState({ orgId, canConnect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center">
      {/* Illustration */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Link2Off className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Text */}
      <h3 className="mb-2 text-lg font-medium">
        Noch keine Airtable-Accounts verbunden
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Verbinde deinen Airtable-Account, um deine Bases in Basewatch zu
        überwachen.
      </p>

      {/* CTA */}
      {canConnect && <ConnectButton orgId={orgId} />}

      {!canConnect && (
        <p className="text-sm text-muted-foreground">
          Nur Admins können Airtable-Accounts verbinden.
        </p>
      )}
    </div>
  )
}
