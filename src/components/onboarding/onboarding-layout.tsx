"use client"

import { OnboardingStepper } from "./onboarding-stepper"
import { OnboardingPersistenceProvider } from "./onboarding-persistence-provider"
import type { OnboardingStep } from "@/types/airtable"

interface OnboardingLayoutProps {
  children: React.ReactNode
  currentStep: OnboardingStep
  completedSteps?: OnboardingStep[]
}

export function OnboardingLayout({
  children,
  currentStep,
  completedSteps = [],
}: OnboardingLayoutProps) {
  return (
    // EC-13: Provider für Browser-Back Handling
    <OnboardingPersistenceProvider>
      <div className="min-h-screen bg-muted/50 flex flex-col">
        {/* Header with Logo */}
        <header className="py-6 px-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B</span>
              </div>
              <span className="font-bold text-2xl">Basewatch</span>
            </div>
          </div>
        </header>

        {/* Stepper */}
        <div className="px-4 py-6">
          <OnboardingStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-sm text-muted-foreground">
          <p>Schritt {currentStep} von 4</p>
        </footer>
      </div>
    </OnboardingPersistenceProvider>
  )
}
