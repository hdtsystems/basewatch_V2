'use client'

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordInput } from "@/components/auth/password-input"
import { PasswordStrength } from "@/components/auth/password-strength"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
      .regex(/\d/, "Passwort muss mindestens eine Zahl enthalten"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tokenError, setTokenError] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  })

  const password = watch("password", "")

  React.useEffect(() => {
    // Check if we have the access token in the URL (Supabase adds it as a hash)
    const hash = window.location.hash
    if (!hash || !hash.includes("access_token")) {
      // Also check for error in hash
      if (hash.includes("error")) {
        setTokenError(true)
      }
    }
  }, [])

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      if (updateError.message.toLowerCase().includes("expired") || updateError.message.toLowerCase().includes("invalid")) {
        setTokenError(true)
      } else {
        setError(getAuthErrorMessage(updateError))
      }
      setIsLoading(false)
      return
    }

    // Success toast and redirect to dashboard
    toast.success("Passwort erfolgreich geändert!")
    window.location.href = "/dashboard"
  }

  if (tokenError) {
    return (
      <AuthCard
        title="Link abgelaufen"
        description="Der Reset-Link ist nicht mehr gültig"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <p className="text-muted-foreground">
            Der Link zum Zurücksetzen deines Passworts ist abgelaufen oder ungültig.
          </p>

          <Button asChild className="mt-4">
            <Link href="/forgot-password">Neuen Link anfordern</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Neues Passwort"
      description="Wähle ein neues Passwort für deinen Account"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Neues Passwort</Label>
          <PasswordInput
            id="password"
            placeholder="Wähle ein sicheres Passwort"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
          />
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Passwort wiederholen"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Passwort speichern
        </Button>
      </form>
    </AuthCard>
  )
}
