"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (orgId: string) => void
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (name.trim().length < 2) {
      setError("Name muss mindestens 2 Zeichen haben")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Fehler beim Erstellen")
        return
      }

      toast.success("Organisation erfolgreich erstellt")

      if (onSuccess) {
        onSuccess(data.organization.id)
      }

      // Refresh the page to load the new organization
      router.refresh()
    } catch {
      setError("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Organisation erstellen</DialogTitle>
              <DialogDescription>
                Erstelle deine erste Organisation, um Airtable-Verbindungen zu verwalten.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name der Organisation</Label>
            <Input
              id="org-name"
              placeholder="z.B. Meine Firma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || name.trim().length < 2}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                "Organisation erstellen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
