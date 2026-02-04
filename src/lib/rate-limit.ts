/**
 * Rate Limiting Middleware
 *
 * Implementiert Rate-Limiting für API-Endpoints zum Schutz vor:
 * - Spam (Einladungen)
 * - DoS-Attacken (Onboarding)
 * - Airtable API-Limit-Überschreitung (Base-Sync)
 * - Brute-Force-Attacken (Token-Validierung)
 *
 * Verwendet In-Memory-Speicher (für Produktion: Upstash Redis empfohlen)
 */

import { NextResponse } from 'next/server'

// Rate Limit Konfiguration aus der Feature-Spec
export const RATE_LIMITS = {
  // Einladungs-APIs (Spam-Schutz)
  'invitations': {
    windowMs: 60 * 60 * 1000, // 1 Stunde
    max: 20,
    message: 'Zu viele Einladungen. Bitte warte eine Stunde.',
  },

  // Onboarding-APIs (DoS-Schutz)
  'onboarding': {
    windowMs: 60 * 1000, // 1 Minute
    max: 10,
    message: 'Zu viele Anfragen. Bitte warte einen Moment.',
  },

  // Base-Sync (Airtable-API-Limit-Schutz)
  'bases-sync': {
    windowMs: 5 * 60 * 1000, // 5 Minuten
    max: 1,
    message: 'Bases wurden kürzlich synchronisiert. Bitte warte 5 Minuten.',
  },

  // Einladungs-Token-Validierung (Brute-Force-Schutz)
  'invitation-token': {
    windowMs: 60 * 1000, // 1 Minute
    max: 5,
    message: 'Zu viele Versuche. Bitte warte einen Moment.',
  },
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS

// In-Memory Store für Rate-Limiting
// Hinweis: In Produktion sollte Upstash Redis verwendet werden
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup-Intervall für abgelaufene Einträge (alle 5 Minuten)
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// Starte Cleanup automatisch
if (typeof window === 'undefined') {
  startCleanup()
}

/**
 * Generiert einen eindeutigen Schlüssel für Rate-Limiting
 */
function getRateLimitKey(
  identifier: string,
  limitKey: RateLimitKey,
  additionalKey?: string
): string {
  const parts = [limitKey, identifier]
  if (additionalKey) {
    parts.push(additionalKey)
  }
  return parts.join(':')
}

/**
 * Extrahiert die Client-IP aus dem Request
 */
export function getClientIp(request: Request): string {
  // Vercel/Cloudflare Header
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Prüft und aktualisiert das Rate-Limit für einen Identifier
 */
export function checkRateLimit(
  identifier: string,
  limitKey: RateLimitKey,
  additionalKey?: string
): { success: boolean; remaining: number; resetTime: number; message?: string } {
  const config = RATE_LIMITS[limitKey]
  const key = getRateLimitKey(identifier, limitKey, additionalKey)
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Neuer Eintrag oder abgelaufener Eintrag
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime,
    }
  }

  // Erhöhe Counter
  entry.count++

  // Prüfe Limit
  if (entry.count > config.max) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message,
    }
  }

  return {
    success: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate-Limit Response mit korrekten Headers
 */
export function rateLimitResponse(
  message: string,
  resetTime: number
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    }
  )
}

/**
 * Wrapper-Funktion für einfache Rate-Limit-Prüfung in API-Routen
 *
 * Beispiel:
 * ```ts
 * const rateLimitResult = await applyRateLimit(request, 'invitations', orgId)
 * if (rateLimitResult) return rateLimitResult // Ist ein 429 Response
 * ```
 */
export function applyRateLimit(
  request: Request,
  limitKey: RateLimitKey,
  additionalKey?: string
): NextResponse | null {
  const ip = getClientIp(request)
  const result = checkRateLimit(ip, limitKey, additionalKey)

  if (!result.success) {
    console.warn(`Rate limit exceeded: ${limitKey} for IP ${ip}`, {
      additionalKey,
      resetTime: new Date(result.resetTime).toISOString(),
    })
    return rateLimitResponse(result.message || 'Zu viele Anfragen', result.resetTime)
  }

  return null
}

/**
 * Fügt Rate-Limit-Headers zu einer erfolgreichen Response hinzu
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limitKey: RateLimitKey,
  identifier: string,
  additionalKey?: string
): NextResponse {
  const config = RATE_LIMITS[limitKey]
  const key = getRateLimitKey(identifier, limitKey, additionalKey)
  const entry = rateLimitStore.get(key)

  if (entry) {
    response.headers.set('X-RateLimit-Limit', String(config.max))
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.max - entry.count)))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)))
  }

  return response
}

/**
 * Setzt das Rate-Limit für einen Identifier zurück
 * Nützlich für Tests oder manuelle Resets
 */
export function resetRateLimit(
  identifier: string,
  limitKey: RateLimitKey,
  additionalKey?: string
): void {
  const key = getRateLimitKey(identifier, limitKey, additionalKey)
  rateLimitStore.delete(key)
}
