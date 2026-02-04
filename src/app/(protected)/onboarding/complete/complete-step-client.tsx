"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Building2, Link2, Database, Users, ArrowRight, PartyPopper } from "lucide-react"

interface CompleteStepClientProps {
  orgName: string
  connectionCount: number
  monitoredBasesCount: number
  memberCount: number
  pendingInvitesCount: number
}

export function CompleteStepClient({
  orgName,
  connectionCount,
  monitoredBasesCount,
  memberCount,
  pendingInvitesCount,
}: CompleteStepClientProps) {
  const router = useRouter()

  const handleGoToDashboard = () => {
    router.push("/dashboard")
  }

  return (
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

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">Deine Organisation ist eingerichtet!</CardTitle>
                <CardDescription className="mt-2">
                  Alles ist bereit. Du kannst jetzt mit Basewatch starten.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Zusammenfassung:</p>

                {/* Organization */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{orgName}</p>
                    <p className="text-sm text-muted-foreground">Organisation erstellt</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>

                {/* Connections */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {connectionCount} Airtable-{connectionCount === 1 ? "Account" : "Accounts"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {connectionCount > 0 ? "Verbunden" : "Noch nicht verbunden"}
                    </p>
                  </div>
                  {connectionCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </div>

                {/* Bases */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {monitoredBasesCount} {monitoredBasesCount === 1 ? "Base" : "Bases"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {monitoredBasesCount > 0 ? "Zur Überwachung ausgewählt" : "Noch keine ausgewählt"}
                    </p>
                  </div>
                  {monitoredBasesCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </div>

                {/* Team */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
                      {pendingInvitesCount > 0 && (
                        <span className="text-muted-foreground">
                          {" "}+ {pendingInvitesCount} ausstehend
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pendingInvitesCount > 0 ? "Einladungen gesendet" : "Nur du bisher"}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>

              {/* CTA */}
              <Button onClick={handleGoToDashboard} className="w-full h-12">
                Zum Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Hint */}
              <p className="text-sm text-center text-muted-foreground">
                Du kannst alle Einstellungen später unter{" "}
                <span className="font-medium">Einstellungen</span> anpassen.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
