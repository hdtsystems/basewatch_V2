import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Link2, Settings, Database, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Willkommen bei Basewatch</h1>
        <p className="text-muted-foreground">
          Überwache deine Airtable-Bases und bleibe über Änderungen informiert.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Schnellzugriff</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Bases */}
          <Link
            href="/settings/bases"
            className="group flex items-start gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium group-hover:text-primary">
                Bases verwalten
              </h3>
              <p className="text-sm text-muted-foreground">
                Überwache und konfiguriere deine Airtable-Bases
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>

          {/* Airtable Connections */}
          <Link
            href="/settings/connections"
            className="group flex items-start gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium group-hover:text-primary">
                Airtable-Verbindungen
              </h3>
              <p className="text-sm text-muted-foreground">
                Verbinde und verwalte deine Airtable-Accounts
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>

          {/* Settings */}
          <Link
            href="/settings/profile"
            className="group flex items-start gap-4 rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium group-hover:text-primary">
                Einstellungen
              </h3>
              <p className="text-sm text-muted-foreground">
                Verwalte dein Konto und deine Präferenzen
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </div>
      </div>
    </div>
  )
}
