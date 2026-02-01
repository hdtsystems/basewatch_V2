/**
 * Wandelt Supabase Auth-Fehler in benutzerfreundliche deutsche Meldungen um.
 * Erkennt auch Netzwerkfehler und gibt passende Meldungen zurück.
 */
export function getAuthErrorMessage(error: Error | null): string {
  if (!error) {
    return "Ein unbekannter Fehler ist aufgetreten."
  }

  const message = error.message?.toLowerCase() || ""

  // Netzwerkfehler erkennen
  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("timeout") ||
    message.includes("aborted") ||
    message.includes("connection")
  ) {
    return "Verbindungsproblem. Bitte prüfe deine Internetverbindung und versuche es erneut."
  }

  // Supabase Auth-Fehler
  if (message.includes("invalid login credentials") || message.includes("invalid_credentials")) {
    return "Email oder Passwort falsch"
  }

  if (message.includes("email not confirmed")) {
    return "Bitte verifiziere deine Email-Adresse, bevor du dich einloggst."
  }

  if (message.includes("user already registered")) {
    return "Ein Account mit dieser Email existiert bereits."
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut."
  }

  if (message.includes("expired") || message.includes("invalid")) {
    return "Der Link ist abgelaufen oder ungültig."
  }

  if (message.includes("password")) {
    return "Das Passwort entspricht nicht den Anforderungen."
  }

  // Fallback
  return "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
}

/**
 * Prüft ob ein Fehler ein Netzwerkfehler ist
 */
export function isNetworkError(error: Error | null): boolean {
  if (!error) return false

  const message = error.message?.toLowerCase() || ""
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("timeout") ||
    message.includes("aborted") ||
    message.includes("connection")
  )
}
