"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Database,
  ScrollText,
  Settings,
  Link2,
  Users,
  Building2,
  CreditCard,
  User,
} from "lucide-react"

interface AppSidebarProps {
  userRole?: string
  orgName?: string
}

const mainNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/settings/bases",
    label: "Bases",
    icon: Database,
  },
  {
    href: "/logs",
    label: "Logs",
    icon: ScrollText,
  },
]

const settingsNavItems = [
  {
    href: "/settings/profile",
    label: "Profil",
    icon: User,
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/organization",
    label: "Organisation",
    icon: Building2,
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/team",
    label: "Team",
    icon: Users,
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/connections",
    label: "Verbindungen",
    icon: Link2,
    roles: ["owner", "admin"],
  },
  {
    href: "/settings/billing",
    label: "Abrechnung",
    icon: CreditCard,
    roles: ["owner"],
  },
]

export function AppSidebar({ userRole = "member", orgName }: AppSidebarProps) {
  const pathname = usePathname()

  const visibleSettingsItems = settingsNavItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl">Basewatch</span>
        </Link>
        {orgName && (
          <p className="text-xs text-muted-foreground mt-2 truncate">{orgName}</p>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Settings Section */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Einstellungen
          </h3>
          {visibleSettingsItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
