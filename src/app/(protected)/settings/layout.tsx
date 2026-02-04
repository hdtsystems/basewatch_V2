export const metadata = {
  title: "Einstellungen | Basewatch",
  description: "Verwalte deine Basewatch-Einstellungen",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Settings pages nutzen das globale protected Layout
  // Keine zusaetzliche Navigation noetig
  return <>{children}</>
}
