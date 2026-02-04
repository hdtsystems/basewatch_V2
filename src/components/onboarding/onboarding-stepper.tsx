"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { OnboardingStep } from "@/types/airtable"

interface OnboardingStepperProps {
  currentStep: OnboardingStep
  completedSteps?: OnboardingStep[]
}

const steps = [
  { number: 1, label: "Organisation" },
  { number: 2, label: "Airtable" },
  { number: 3, label: "Bases" },
  { number: 4, label: "Team" },
] as const

export function OnboardingStepper({
  currentStep,
  completedSteps = [],
}: OnboardingStepperProps) {
  return (
    <nav aria-label="Fortschritt" className="w-full max-w-md mx-auto">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number as OnboardingStep)
          const isCurrent = currentStep === step.number
          const isUpcoming = currentStep < step.number && !isCompleted

          return (
            <li key={step.number} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary",
                    isUpcoming &&
                      "border-muted-foreground/30 bg-background text-muted-foreground/50"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground",
                    isUpcoming && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 sm:w-16 lg:w-20 transition-colors",
                    isCompleted || currentStep > step.number
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
