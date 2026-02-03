"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ConnectButtonProps {
  orgId: string
  disabled?: boolean
  disabledReason?: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function ConnectButton({
  orgId,
  disabled = false,
  disabledReason,
  variant = "default",
  size = "default",
  className,
}: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (disabled) {
      if (disabledReason) {
        toast.error(disabledReason)
      }
      return
    }

    setIsLoading(true)

    try {
      // Redirect to OAuth flow with org_id
      window.location.href = `/api/airtable/connect?org_id=${orgId}`
    } catch {
      toast.error("Verbindung konnte nicht gestartet werden")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verbinde...</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          <span>Mit Airtable verbinden</span>
        </>
      )}
    </Button>
  )
}
