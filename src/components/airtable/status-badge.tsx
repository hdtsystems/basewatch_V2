"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import type { ConnectionStatus } from "@/types/airtable"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: ConnectionStatus
  className?: string
}

const statusConfig: Record<
  ConnectionStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: React.ElementType
    className: string
  }
> = {
  active: {
    label: "Aktiv",
    variant: "default",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
  },
  disconnected: {
    label: "Getrennt",
    variant: "destructive",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
  pending_sync: {
    label: "Synchronisiert...",
    variant: "secondary",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  error: {
    label: "Fehler",
    variant: "destructive",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}
