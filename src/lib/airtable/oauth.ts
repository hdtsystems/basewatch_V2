import crypto from 'crypto'

// Airtable OAuth Configuration
const AIRTABLE_OAUTH_URL = 'https://airtable.com/oauth2/v1/authorize'
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token'
const AIRTABLE_API_URL = 'https://api.airtable.com/v0'

// OAuth Scopes - minimal erforderlich
export const AIRTABLE_SCOPES = [
  'data.records:read',
  'data.recordComments:read',
  'schema.bases:read',
  'user.email:read',
] as const

/**
 * Generiert einen kryptografisch sicheren State-Token
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generiert PKCE Code Verifier (43-128 Zeichen)
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString('base64url')
}

/**
 * Berechnet PKCE Code Challenge aus Code Verifier
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
}

/**
 * Baut die Airtable Authorization URL
 */
export function buildAuthorizationUrl(params: {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL(AIRTABLE_OAUTH_URL)

  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', params.state)
  url.searchParams.set('scope', AIRTABLE_SCOPES.join(' '))
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  return url.toString()
}

/**
 * Token Response von Airtable
 */
export interface AirtableTokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number // Sekunden bis Ablauf
  scope: string
}

/**
 * Tauscht Authorization Code gegen Access + Refresh Token
 */
export async function exchangeCodeForTokens(params: {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
  codeVerifier: string
}): Promise<AirtableTokenResponse> {
  const credentials = Buffer.from(
    `${params.clientId}:${params.clientSecret}`
  ).toString('base64')

  const response = await fetch(AIRTABLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

/**
 * Refresht Access Token mit Refresh Token
 */
export async function refreshAccessToken(params: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<AirtableTokenResponse> {
  const credentials = Buffer.from(
    `${params.clientId}:${params.clientSecret}`
  ).toString('base64')

  const response = await fetch(AIRTABLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: params.refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  return response.json()
}

/**
 * Airtable User Info
 */
export interface AirtableUserInfo {
  id: string
  email: string
}

/**
 * Holt User Info von Airtable API
 */
export async function getAirtableUserInfo(accessToken: string): Promise<AirtableUserInfo> {
  const response = await fetch(`${AIRTABLE_API_URL}/meta/whoami`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  return response.json()
}

/**
 * Airtable Workspace
 */
export interface AirtableWorkspace {
  id: string
  name: string
}

/**
 * Airtable Base
 */
export interface AirtableBase {
  id: string
  name: string
  permissionLevel: string
}

/**
 * Holt alle Bases von Airtable API (inkl. Workspace-Zuordnung)
 */
export async function getAirtableBases(accessToken: string): Promise<{
  bases: Array<AirtableBase & { workspaceId?: string }>
}> {
  const response = await fetch(`${AIRTABLE_API_URL}/meta/bases`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get bases: ${error}`)
  }

  return response.json()
}

/**
 * Holt alle Workspaces von Airtable Enterprise API
 * Hinweis: Erfordert Enterprise-Plan bei Airtable
 */
export async function getAirtableWorkspaces(accessToken: string): Promise<{
  workspaces: AirtableWorkspace[]
}> {
  const response = await fetch(`${AIRTABLE_API_URL}/meta/workspaces`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  // Workspace-API ist nur für Enterprise verfügbar
  // Für andere Plans: Leere Liste zurückgeben
  if (response.status === 403 || response.status === 404) {
    return { workspaces: [] }
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get workspaces: ${error}`)
  }

  return response.json()
}
