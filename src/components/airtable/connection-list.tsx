"use client"

import { ConnectionCard } from "./connection-card"
import { EmptyState } from "./empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { AirtableConnection } from "@/types/airtable"

interface ConnectionListProps {
  orgId: string
  connections: AirtableConnection[]
  canManage: boolean
  isLoading?: boolean
  onDisconnect?: (id: string) => Promise<void>
  onRefresh?: (id: string) => Promise<void>
}

function ConnectionListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ConnectionList({
  orgId,
  connections,
  canManage,
  isLoading,
  onDisconnect,
  onRefresh,
}: ConnectionListProps) {
  if (isLoading) {
    return <ConnectionListSkeleton />
  }

  if (connections.length === 0) {
    return <EmptyState orgId={orgId} canConnect={canManage} />
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          canManage={canManage}
          onDisconnect={onDisconnect}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}
