'use client'

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
}

interface Requirement {
  label: string
  test: (password: string) => boolean
}

const requirements: Requirement[] = [
  {
    label: "Mindestens 8 Zeichen",
    test: (password) => password.length >= 8,
  },
  {
    label: "Mindestens eine Zahl",
    test: (password) => /\d/.test(password),
  },
]

export function PasswordStrength({ password }: PasswordStrengthProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {requirements.map((req, index) => {
          const isFulfilled = req.test(password)
          return (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isFulfilled ? "bg-success" : "bg-muted"
              )}
            />
          )
        })}
      </div>
      <ul className="space-y-1 text-sm">
        {requirements.map((req, index) => {
          const isFulfilled = req.test(password)
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2",
                isFulfilled ? "text-success" : "text-muted-foreground"
              )}
            >
              {isFulfilled ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {req.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function isPasswordValid(password: string): boolean {
  return requirements.every((req) => req.test(password))
}
