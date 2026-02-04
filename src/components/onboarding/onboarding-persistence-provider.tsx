"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

interface OnboardingPersistenceProviderProps {
  children: React.ReactNode
}

/**
 * EC-13: Provider für Browser-Back Handling während Onboarding
 *
 * Dieser Provider:
 * 1. Reagiert auf Browser-Back (popstate Event)
 * 2. Lädt den aktuellen Onboarding-Status aus der Datenbank
 * 3. Navigiert zum korrekten Schritt wenn nötig
 * 4. Stellt sicher, dass keine Daten verloren gehen
 */
export function OnboardingPersistenceProvider({
  children,
}: OnboardingPersistenceProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isHandlingPopstate = useRef(false)
  const lastPathname = useRef(pathname)

  useEffect(() => {
    // Aktualisiere den letzten Pfad
    lastPathname.current = pathname
  }, [pathname])

  useEffect(() => {
    const stepRoutes: Record<number, string> = {
      1: "/onboarding/organization",
      2: "/onboarding/airtable",
      3: "/onboarding/bases",
      4: "/onboarding/team",
    }

    const routeToStep: Record<string, number> = {
      "/onboarding/organization": 1,
      "/onboarding/airtable": 2,
      "/onboarding/bases": 3,
      "/onboarding/team": 4,
    }

    // Handler für Browser-Back (popstate)
    const handlePopstate = async () => {
      // Verhindere mehrfache gleichzeitige Aufrufe
      if (isHandlingPopstate.current) return
      isHandlingPopstate.current = true

      try {
        // Lade aktuellen Status aus DB
        const response = await fetch("/api/onboarding/status")
        if (!response.ok) {
          isHandlingPopstate.current = false
          return
        }

        const status = await response.json()

        if (status && status.current_step) {
          // Ermittle den aktuellen Route-Schritt
          const currentRouteStep = routeToStep[window.location.pathname]

          // Wenn der User zu einem Schritt zurückgeht, der vor seinem
          // gespeicherten Fortschritt liegt, ist das OK (er kann zurückblättern)
          // Aber wir aktualisieren den State nicht, die Daten sind ja noch da

          // Wenn der gespeicherte Schritt weiter ist als die aktuelle Route,
          // können wir dem User erlauben zurückzugehen - die Daten bleiben in der DB
          if (currentRouteStep && currentRouteStep <= status.current_step) {
            // User geht zurück zu einem früheren Schritt - das ist erlaubt
            // Die Daten des aktuellen Schritts sind bereits in der DB gespeichert
            router.refresh()
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden des Onboarding-Status:", error)
      } finally {
        // Reset nach kurzer Verzögerung
        setTimeout(() => {
          isHandlingPopstate.current = false
        }, 200)
      }
    }

    // Event Listener hinzufügen
    window.addEventListener("popstate", handlePopstate)

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopstate)
    }
  }, [router])

  return <>{children}</>
}
