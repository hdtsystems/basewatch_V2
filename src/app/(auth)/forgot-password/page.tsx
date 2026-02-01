'use client'

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const forgotPasswordSchema = z.object({
  email: z.string().email("Bitte gib eine gültige Email-Adresse ein"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      }
    )

    setIsLoading(false)

    if (resetError) {
      setError(getAuthErrorMessage(resetError))
      return
    }

    // Always show success message (even if email doesn't exist - security best practice)
    toast.success("Reset-Link wurde gesendet!")
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <AuthCard
        title="Email gesendet"
        description="Prüfe dein Postfach"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              Falls ein Account mit dieser Email existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet.
            </p>
            <p className="text-sm text-muted-foreground">
              Der Link ist 24 Stunden gültig.
            </p>
          </div>

          <Button asChild variant="outline" className="mt-4">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Login
            </Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Passwort vergessen"
      description="Gib deine Email-Adresse ein, um einen Reset-Link zu erhalten"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset-Link senden
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Login
        </Link>
      </div>
    </AuthCard>
  )
}
