'use client'

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const signupSchema = z
  .object({
    email: z.string().email("Bitte gib eine gültige Email-Adresse ein"),
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

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  })

  const password = watch("password", "")

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signupError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signupError) {
      if (signupError.message.toLowerCase().includes("user already registered")) {
        router.push("/login?message=Account existiert bereits. Bitte melde dich an.")
      } else {
        setError(getAuthErrorMessage(signupError))
      }
      setIsLoading(false)
      return
    }

    // Success toast and redirect to confirmation page
    toast.success("Registrierung erfolgreich!")
    router.push("/signup/confirm")
  }

  return (
    <AuthCard
      title="Account erstellen"
      description="Registriere dich, um loszulegen"
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

        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
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
          Registrieren
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        Bereits registriert?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Anmelden
        </Link>
      </div>
    </AuthCard>
  )
}
