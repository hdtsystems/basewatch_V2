import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"

export default async function ProtectedLayout({
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
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .single()

  const org = membership?.organizations as unknown as { id: string; name: string } | null
  const userRole = membership?.role || "member"

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar userRole={userRole} orgName={org?.name} />
      <div className="flex-1 flex flex-col">
        <AppHeader
          user={{
            email: user.email || "",
            fullName: user.user_metadata?.full_name,
            avatarUrl: user.user_metadata?.avatar_url,
          }}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
