"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, Building2, Users, Database, Link2, CreditCard } from "lucide-react"
import type { OrgRole } from "@/types/airtable"

interface SettingsNavProps {
  userRole: OrgRole | string
}

const navItems = [
  {
    href: "/settings/profile",
    label: "Profil",
    icon: User,
    description: "Deine persönlichen Einstellungen",
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/organization",
    label: "Organisation",
    icon: Building2,
    description: "Org-Details und Name",
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/team",
    label: "Team",
    icon: Users,
    description: "Mitglieder verwalten",
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/bases",
    label: "Bases",
    icon: Database,
    description: "Airtable Bases überwachen",
    roles: ["owner", "admin", "member", "viewer"],
  },
  {
    href: "/settings/connections",
    label: "Verbindungen",
    icon: Link2,
    description: "Airtable-Accounts verwalten",
    roles: ["owner", "admin"],
  },
  {
    href: "/settings/billing",
    label: "Abrechnung",
    icon: CreditCard,
    description: "Plan und Zahlungen",
    roles: ["owner"],
  },
]

export function SettingsNav({ userRole }: SettingsNavProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <nav className="space-y-1">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4 px-3">
        Einstellungen
      </h2>
      {visibleItems.map((item) => {
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
            <div className="flex-1 min-w-0">
              <p className={cn("truncate", isActive && "font-medium")}>
                {item.label}
              </p>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
