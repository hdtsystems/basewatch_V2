"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

interface ProfileSettingsClientProps {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    createdAt: string
  }
}

export function ProfileSettingsClient({ user }: ProfileSettingsClientProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(user.fullName || "")
  const [isLoading, setIsLoading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Speichern")
        return
      }

      toast.success("Profil aktualisiert")
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = fullName.trim() !== (user.fullName || "")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Verwalte deine persönlichen Einstellungen
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(user.fullName, user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName || user.email.split("@")[0]}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="full-name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dein Name"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                value={user.email}
                readOnly
                className="pl-10 bg-muted"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Deine E-Mail-Adresse kann nicht geändert werden.
            </p>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Mitglied seit {formatDate(user.createdAt)}</span>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Änderungen speichern
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Passwort</CardTitle>
          <CardDescription>
            Ändere dein Passwort für mehr Sicherheit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/forgot-password">
              Passwort ändern
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Account löschen</CardTitle>
          <CardDescription>
            Lösche deinen Account und alle zugehörigen Daten permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Account löschen
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Kontaktiere den Support um deinen Account zu löschen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
