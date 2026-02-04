import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileSettingsClient } from "./profile-settings-client"

export const metadata = {
  title: "Profil | Einstellungen | Basewatch",
  description: "Verwalte deine persönlichen Einstellungen",
}

export default async function ProfileSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <ProfileSettingsClient
      user={{
        id: user.id,
        email: user.email || "",
        fullName: user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        createdAt: user.created_at,
      }}
    />
  )
}
