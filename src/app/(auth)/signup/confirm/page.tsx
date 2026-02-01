import Link from "next/link"
import { Mail } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"

export default function SignupConfirmPage() {
  return (
    <AuthCard
      title="Prüfe deine Email"
      description="Wir haben dir eine Verifizierungs-Email gesendet"
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">
            Bitte klicke auf den Link in der Email, um deinen Account zu aktivieren.
          </p>
          <p className="text-sm text-muted-foreground">
            Die Email kann einige Minuten dauern. Prüfe auch deinen Spam-Ordner.
          </p>
        </div>

        <Button asChild variant="outline" className="mt-4">
          <Link href="/login">Zurück zum Login</Link>
        </Button>
      </div>
    </AuthCard>
  )
}
