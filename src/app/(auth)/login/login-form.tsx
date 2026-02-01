'use client'

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { AuthCard } from "@/components/auth/auth-card"
import { PasswordInput } from "@/components/auth/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige Email-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"
  const message = searchParams.get("message")

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = React.useState(false)
  const [verificationEmail, setVerificationEmail] = React.useState<string | null>(null)
  const [resendLoading, setResendLoading] = React.useState(false)
  const [resendSuccess, setResendSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setError(null)
    setNeedsVerification(false)

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true)
        setVerificationEmail(data.email)
        setError("Bitte verifiziere deine Email-Adresse, bevor du dich einloggst.")
      } else {
        setError(getAuthErrorMessage(authError))
      }
      setIsLoading(false)
      return
    }

    if (authData.session) {
      toast.success("Willkommen zurück!")
      // Hard redirect to ensure cookies are properly set
      window.location.href = redirectTo
    } else {
      setError("Login fehlgeschlagen. Bitte versuche es erneut.")
      setIsLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!verificationEmail) return

    setResendLoading(true)
    setResendSuccess(false)

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: verificationEmail,
    })

    setResendLoading(false)

    if (resendError) {
      setError(getAuthErrorMessage(resendError))
    } else {
      setResendSuccess(true)
      toast.success("Verifizierungs-Email wurde gesendet!")
    }
  }

  return (
    <AuthCard
      title="Willkommen zurück"
      description="Melde dich mit deinem Account an"
    >
      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resendSuccess && (
        <Alert className="mb-4">
          <AlertDescription>
            Verifizierungs-Email wurde gesendet. Bitte prüfe dein Postfach.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@beispiel.de"
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Passwort</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Passwort vergessen?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Dein Passwort"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Anmelden
        </Button>

        {needsVerification && verificationEmail && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verifizierungs-Email erneut senden
          </Button>
        )}
      </form>

      <div className="mt-4 text-center text-sm">
        Noch kein Account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Registrieren
        </Link>
      </div>
    </AuthCard>
  )
}
