"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, MoreVertical, Mail, Trash2, RefreshCw, Loader2, Clock, Users, AlertTriangle, MailX, Edit } from "lucide-react"
import { toast } from "sonner"
import { PLAN_LIMITS_FULL, type PlanType, type OrgRole, type EmailDeliveryStatus } from "@/types/airtable"

interface Member {
  userId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: OrgRole
  joinedAt: string
  // EC-14: Timestamp für Optimistic Locking
  updatedAt?: string
}

interface Invitation {
  id: string
  email: string
  role: OrgRole
  expiresAt: string
  createdAt: string
  invitedBy: string
  // EC-11: E-Mail-Zustellungsstatus
  deliveryStatus?: EmailDeliveryStatus
  deliveryAttempts?: number
  lastDeliveryError?: string | null
}

interface TeamSettingsClientProps {
  orgId: string
  orgName: string
  orgPlan: PlanType
  userRole: OrgRole
  currentUserId: string
  members: Member[]
  invitations: Invitation[]
}

const roleLabels: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
}

const roleOrder: OrgRole[] = ["owner", "admin", "member", "viewer"]

export function TeamSettingsClient({
  orgId,
  orgName,
  orgPlan,
  userRole,
  currentUserId,
  members: initialMembers,
  invitations: initialInvitations,
}: TeamSettingsClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Exclude<OrgRole, "owner">>("member")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null)
  // EC-11: State für "Andere E-Mail" Dialog
  const [changeEmailDialogOpen, setChangeEmailDialogOpen] = useState(false)
  const [changeEmailInvite, setChangeEmailInvite] = useState<Invitation | null>(null)
  const [newEmail, setNewEmail] = useState("")

  const canManageTeam = userRole === "owner" || userRole === "admin"
  const isOwner = userRole === "owner"
  const planLimits = PLAN_LIMITS_FULL[orgPlan]
  const memberCount = members.length
  const pendingCount = invitations.length

  // Sort members by role
  const sortedMembers = [...members].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date()
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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Bitte gib eine E-Mail-Adresse ein")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: [inviteEmail.trim()],
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Fehler beim Senden der Einladung")
        return
      }

      toast.success("Einladung gesendet")
      setInviteEmail("")
      setIsInviteDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    setLoadingMemberId(memberId)

    // EC-14: Hole das aktuelle Member-Objekt für Optimistic Locking
    const member = members.find((m) => m.userId === memberId)
    if (!member) {
      toast.error("Mitglied nicht gefunden")
      setLoadingMemberId(null)
      return
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        // EC-14: Sende updated_at für Optimistic Locking
        body: JSON.stringify({
          role: newRole,
          expected_updated_at: member.updatedAt,
        }),
      })

      // EC-14: Prüfe auf Konflikt (409 Conflict)
      if (response.status === 409) {
        toast.error("Daten wurden zwischenzeitlich geändert. Bitte neu laden.", {
          action: {
            label: "Neu laden",
            onClick: () => router.refresh(),
          },
          duration: 10000,
        })
        return
      }

      if (!response.ok) {
        const data = await response.json()
        // EC-14: Zusätzliche Prüfung auf Konflikt-Fehler in Response
        if (data.code === "CONFLICT" || data.error?.includes("geändert")) {
          toast.error("Daten wurden zwischenzeitlich geändert. Bitte neu laden.", {
            action: {
              label: "Neu laden",
              onClick: () => router.refresh(),
            },
            duration: 10000,
          })
          return
        }
        toast.error(data.error || "Fehler beim Ändern der Rolle")
        return
      }

      // EC-14: Aktualisiere auch den updated_at Timestamp
      const data = await response.json()
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === memberId
            ? { ...m, role: newRole, updatedAt: data.updated_at || new Date().toISOString() }
            : m
        )
      )
      toast.success("Rolle aktualisiert")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoadingMemberId(memberId)

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Entfernen des Mitglieds")
        return
      }

      setMembers((prev) => prev.filter((m) => m.userId !== memberId))
      toast.success("Mitglied entfernt")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingMemberId(null)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    setLoadingInviteId(inviteId)

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/invitations/${inviteId}/resend`,
        { method: "POST" }
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim erneuten Senden")
        return
      }

      toast.success("Einladung erneut gesendet")
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingInviteId(null)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    setLoadingInviteId(inviteId)

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/invitations/${inviteId}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Widerrufen der Einladung")
        return
      }

      setInvitations((prev) => prev.filter((inv) => inv.id !== inviteId))
      toast.success("Einladung widerrufen")
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingInviteId(null)
    }
  }

  // EC-11: Handler für "Andere E-Mail"-Funktion
  const handleChangeEmail = async () => {
    if (!changeEmailInvite || !newEmail.trim()) {
      toast.error("Bitte gib eine E-Mail-Adresse ein")
      return
    }

    setLoadingInviteId(changeEmailInvite.id)

    try {
      // Alte Einladung widerrufen
      await fetch(
        `/api/organizations/${orgId}/invitations/${changeEmailInvite.id}`,
        { method: "DELETE" }
      )

      // Neue Einladung mit gleicher Rolle senden
      const response = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: [newEmail.trim()],
          role: changeEmailInvite.role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Senden der neuen Einladung")
        return
      }

      toast.success("Einladung an neue E-Mail-Adresse gesendet")
      setChangeEmailDialogOpen(false)
      setChangeEmailInvite(null)
      setNewEmail("")
      router.refresh()
    } catch {
      toast.error("Verbindungsfehler - bitte erneut versuchen")
    } finally {
      setLoadingInviteId(null)
    }
  }

  // EC-11: Öffne "Andere E-Mail" Dialog
  const openChangeEmailDialog = (invite: Invitation) => {
    setChangeEmailInvite(invite)
    setNewEmail("")
    setChangeEmailDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Verwalte die Mitglieder von {orgName}
          </p>
        </div>
        {canManageTeam && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Einladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Teammitglied einladen</DialogTitle>
                <DialogDescription>
                  Sende eine Einladung per E-Mail.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="max@firma.de"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as Exclude<OrgRole, "owner">)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Nur Lesen</SelectItem>
                      <SelectItem value="member">Member - Lesen + Kommentieren</SelectItem>
                      <SelectItem value="admin">Admin - Voller Zugriff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                  disabled={isLoading}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleInvite} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Einladung senden
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>
            {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
          </span>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {pendingCount} ausstehende {pendingCount === 1 ? "Einladung" : "Einladungen"}
            </span>
          </div>
        )}
        <div className="ml-auto">
          {orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}-Plan (max.{" "}
          {planLimits.members === Infinity ? "unbegrenzt" : planLimits.members})
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            Mitglieder ({memberCount})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Ausstehende Einladungen ({pendingCount})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitglied</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Beigetreten</TableHead>
                    {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((member) => {
                    const isCurrentUser = member.userId === currentUserId
                    const canChangeRole = isOwner && !isCurrentUser && member.role !== "owner"
                    const canRemove = isOwner && !isCurrentUser && member.role !== "owner"
                    const isLoadingThis = loadingMemberId === member.userId

                    return (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>
                                {getInitials(member.fullName, member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.fullName || member.email.split("@")[0]}
                                {isCurrentUser && (
                                  <span className="text-muted-foreground ml-1">(Du)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canChangeRole ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) =>
                                handleRoleChange(member.userId, v as OrgRole)
                              }
                              disabled={isLoadingThis}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={member.role === "owner" ? "default" : "secondary"}
                            >
                              {roleLabels[member.role]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.joinedAt)}
                        </TableCell>
                        {canManageTeam && (
                          <TableCell>
                            {canRemove && (
                              <AlertDialog>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isLoadingThis}
                                    >
                                      {isLoadingThis ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MoreVertical className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Entfernen
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Mitglied entfernen?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Möchtest du {member.fullName || member.email} wirklich
                                      aus der Organisation entfernen? Diese Person verliert
                                      sofort den Zugriff.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveMember(member.userId)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Entfernen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardContent className="p-0">
              {invitations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine ausstehenden Einladungen</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Rolle</TableHead>
                      <TableHead>Gesendet am</TableHead>
                      <TableHead>Läuft ab</TableHead>
                      {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invite) => {
                      const expired = isExpired(invite.expiresAt)
                      const isLoadingThis = loadingInviteId === invite.id
                      // EC-11: Prüfe auf fehlgeschlagene Zustellung
                      const deliveryFailed = invite.deliveryStatus === "failed" || invite.deliveryStatus === "bounced"

                      return (
                        <TableRow key={invite.id} className={expired ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{invite.email}</p>
                              <p className="text-sm text-muted-foreground">
                                Eingeladen von {invite.invitedBy}
                              </p>
                              {/* EC-11: Warnung bei fehlgeschlagener Zustellung */}
                              {deliveryFailed && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <MailX className="h-3.5 w-3.5 text-destructive" />
                                  <span className="text-xs text-destructive">
                                    E-Mail konnte nicht zugestellt werden
                                    {invite.deliveryAttempts && invite.deliveryAttempts > 1 && (
                                      <span className="text-muted-foreground ml-1">
                                        ({invite.deliveryAttempts} Versuche)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{roleLabels[invite.role]}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invite.createdAt)}
                          </TableCell>
                          <TableCell>
                            {expired ? (
                              <Badge variant="destructive">Abgelaufen</Badge>
                            ) : deliveryFailed ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Zustellung fehlgeschlagen
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {formatDate(invite.expiresAt)}
                              </span>
                            )}
                          </TableCell>
                          {canManageTeam && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isLoadingThis}
                                  >
                                    {isLoadingThis ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(invite.id)}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Erneut senden
                                  </DropdownMenuItem>
                                  {/* EC-11: Option für andere E-Mail bei fehlgeschlagener Zustellung */}
                                  {deliveryFailed && (
                                    <DropdownMenuItem
                                      onClick={() => openChangeEmailDialog(invite)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Andere E-Mail verwenden
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Widerrufen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EC-11: Dialog für "Andere E-Mail verwenden" */}
      <Dialog open={changeEmailDialogOpen} onOpenChange={setChangeEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Andere E-Mail-Adresse verwenden</DialogTitle>
            <DialogDescription>
              Die Einladung an <strong>{changeEmailInvite?.email}</strong> konnte nicht zugestellt werden.
              Gib eine andere E-Mail-Adresse ein, um die Einladung erneut zu senden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Neue E-Mail-Adresse</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="neue-email@firma.de"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loadingInviteId === changeEmailInvite?.id}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-muted-foreground">
                Die ursprüngliche Einladung wird widerrufen und eine neue Einladung
                mit der Rolle <strong>{changeEmailInvite && roleLabels[changeEmailInvite.role]}</strong> wird gesendet.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangeEmailDialogOpen(false)
                setChangeEmailInvite(null)
                setNewEmail("")
              }}
              disabled={loadingInviteId === changeEmailInvite?.id}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleChangeEmail}
              disabled={loadingInviteId === changeEmailInvite?.id || !newEmail.trim()}
            >
              {loadingInviteId === changeEmailInvite?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Einladung senden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
