"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * EC-13: Hook für Browser-Back Handling während Onboarding
 *
 * Dieser Hook:
 * 1. Reagiert auf Browser-Back (popstate Event)
 * 2. Lädt den aktuellen Onboarding-Status aus der Datenbank
 * 3. Stellt sicher, dass keine Daten verloren gehen
 */
export function useOnboardingPersistence(currentStep: number) {
  const router = useRouter()
  const isHandlingPopstate = useRef(false)

  // Funktion zum Laden des Onboarding-Status aus der DB
  const loadOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/onboarding/status")
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error("Fehler beim Laden des Onboarding-Status:", error)
    }
    return null
  }, [])

  // Funktion zum Navigieren zum richtigen Schritt
  const navigateToStep = useCallback((step: number) => {
    const stepRoutes: Record<number, string> = {
      1: "/onboarding/organization",
      2: "/onboarding/airtable",
      3: "/onboarding/bases",
      4: "/onboarding/team",
    }

    const route = stepRoutes[step]
    if (route) {
      router.replace(route)
    }
  }, [router])

  useEffect(() => {
    // Handler für Browser-Back (popstate)
    const handlePopstate = async () => {
      // Verhindere mehrfache gleichzeitige Aufrufe
      if (isHandlingPopstate.current) return
      isHandlingPopstate.current = true

      try {
        // Lade aktuellen Status aus DB
        const status = await loadOnboardingStatus()

        if (status) {
          // Wenn der aktuelle Schritt in der DB anders ist als erwartet,
          // navigiere zum korrekten Schritt
          if (status.current_step !== currentStep) {
            navigateToStep(status.current_step)
          }
        }
      } finally {
        // Reset nach kurzer Verzögerung
        setTimeout(() => {
          isHandlingPopstate.current = false
        }, 100)
      }
    }

    // Event Listener hinzufügen
    window.addEventListener("popstate", handlePopstate)

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopstate)
    }
  }, [currentStep, loadOnboardingStatus, navigateToStep])

  // Funktion zum Speichern des aktuellen Schritts in der DB
  const saveCurrentStep = useCallback(async (step: number) => {
    try {
      await fetch("/api/onboarding/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_step: step,
        }),
      })
    } catch (error) {
      console.error("Fehler beim Speichern des Onboarding-Status:", error)
    }
  }, [])

  return {
    loadOnboardingStatus,
    saveCurrentStep,
    navigateToStep,
  }
}
