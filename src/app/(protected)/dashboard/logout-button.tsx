'use client'

import * as React from "react"
import { LogOut, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleLogout() {
    setIsLoading(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    toast.success("Erfolgreich abgemeldet!")
    // Hard redirect to login page
    window.location.href = "/login"
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </>
      )}
    </Button>
  )
}
