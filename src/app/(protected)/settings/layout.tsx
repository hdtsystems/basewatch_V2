import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsNav } from "@/components/settings/settings-nav"

export const metadata = {
  title: "Einstellungen | Basewatch",
  description: "Verwalte deine Basewatch-Einstellungen",
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's organization and role
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id, organizations(id, name)")
    .eq("user_id", user.id)
    .single()

  const org = membership?.organizations as unknown as { id: string; name: string } | null
  const userRole = membership?.role || "member"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-xl">Basewatch</span>
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Einstellungen</span>
          </div>
          {org && (
            <div className="text-sm text-muted-foreground">
              {org.name}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <SettingsNav userRole={userRole} />
          </aside>

          {/* Page Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
