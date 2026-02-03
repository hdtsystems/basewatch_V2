"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"

interface DisconnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onConfirm: () => Promise<void>
}

export function DisconnectDialog({
  open,
  onOpenChange,
  email,
  onConfirm,
}: DisconnectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // Reset to step 1 when closing (only if not loading)
      setTimeout(() => setStep(1), 150)
    }
    // Prevent closing during loading
    if (isLoading) return
    onOpenChange(newOpen)
  }

  const handleFirstConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleFinalConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      // Only reset on success - dialog will be closed by parent
    } catch {
      // On error, stay on step 2 so user can retry
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        {step === 1 ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verbindung trennen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du die Verbindung zu <strong>{email}</strong> wirklich
                trennen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              {/* Use Button instead of AlertDialogAction to prevent auto-close */}
              <Button onClick={handleFirstConfirm}>
                Trennen
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                <strong>Alle Daten dieser Verbindung werden gelöscht.</strong>
                <br />
                <br />
                Dies betrifft alle gecachten Workspaces, Bases und
                Überwachungseinstellungen für <strong>{email}</strong>.
                <br />
                <br />
                Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>
                Abbrechen
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleFinalConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird getrennt...
                  </>
                ) : (
                  "Endgültig trennen"
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
