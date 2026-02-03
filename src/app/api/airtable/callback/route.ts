import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeCodeForTokens,
  getAirtableUserInfo,
  getAirtableBases,
  getAirtableWorkspaces,
  AIRTABLE_SCOPES,
} from '@/lib/airtable/oauth'

/**
 * GET /api/airtable/callback
 *
 * OAuth 2.0 Callback - verarbeitet den Authorization Code von Airtable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Basis-URL für Redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const settingsUrl = `${baseUrl}/settings/connections`

  // EC-1: OAuth wurde abgebrochen
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const message = error === 'access_denied'
      ? 'Verbindung abgebrochen - Du kannst es jederzeit erneut versuchen.'
      : `OAuth-Fehler: ${errorDescription || error}`

    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent(message)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent('Ungültige OAuth-Antwort')}`
    )
  }

  try {
    const adminClient = createAdminClient()

    // 1. Validiere State und lade Code Verifier
    const { data: oauthState, error: stateError } = await adminClient
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !oauthState) {
      console.error('Invalid or expired state:', stateError)
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent('OAuth-Session abgelaufen. Bitte erneut versuchen.')}`
      )
    }

    // 2. Lösche State (einmalige Verwendung)
    await adminClient
      .from('oauth_states')
      .delete()
      .eq('id', oauthState.id)

    // 3. Tausche Code gegen Tokens
    const clientId = process.env.AIRTABLE_CLIENT_ID!
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET!
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI!

    const tokens = await exchangeCodeForTokens({
      clientId,
      clientSecret,
      code,
      redirectUri,
      codeVerifier: oauthState.code_verifier,
    })

    // 4. Hole Airtable User Info
    const userInfo = await getAirtableUserInfo(tokens.access_token)

    // 5. Prüfe ob Connection bereits existiert (Duplikat-Handling)
    const { data: existingConnection } = await adminClient
      .from('airtable_connections')
      .select('id')
      .eq('organization_id', oauthState.organization_id)
      .eq('airtable_user_id', userInfo.id)
      .single()

    // 6. Berechne Token-Ablaufzeit
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    let connectionId: string

    if (existingConnection) {
      // Duplikat: Tokens aktualisieren
      connectionId = existingConnection.id

      // Alte Tokens löschen
      await adminClient.rpc('delete_connection_tokens', {
        p_connection_id: connectionId,
      })

      // Neue Tokens speichern
      const { data: accessSecretId } = await adminClient.rpc('store_token_in_vault', {
        p_connection_id: connectionId,
        p_token_type: 'access',
        p_token: tokens.access_token,
      })

      const { data: refreshSecretId } = await adminClient.rpc('store_token_in_vault', {
        p_connection_id: connectionId,
        p_token_type: 'refresh',
        p_token: tokens.refresh_token,
      })

      // Connection aktualisieren
      await adminClient
        .from('airtable_connections')
        .update({
          access_token_secret_id: accessSecretId,
          refresh_token_secret_id: refreshSecretId,
          token_expires_at: tokenExpiresAt.toISOString(),
          scopes: AIRTABLE_SCOPES,
          status: 'active',
          error_message: null,
        })
        .eq('id', connectionId)

      // Redirect mit "aktualisiert" Message
      return NextResponse.redirect(
        `${settingsUrl}?success=${encodeURIComponent('Verbindung aktualisiert')}`
      )
    }

    // 7. Neue Connection erstellen
    const { data: newConnection, error: insertError } = await adminClient
      .from('airtable_connections')
      .insert({
        organization_id: oauthState.organization_id,
        connected_by: oauthState.user_id,
        airtable_user_id: userInfo.id,
        airtable_email: userInfo.email,
        token_expires_at: tokenExpiresAt.toISOString(),
        scopes: AIRTABLE_SCOPES,
        status: 'pending_sync',
      })
      .select('id')
      .single()

    if (insertError || !newConnection) {
      console.error('Connection insert error:', insertError)
      return NextResponse.redirect(
        `${settingsUrl}?error=${encodeURIComponent('Fehler beim Speichern der Verbindung')}`
      )
    }

    connectionId = newConnection.id

    // 8. Tokens im Vault speichern
    const { data: accessSecretId } = await adminClient.rpc('store_token_in_vault', {
      p_connection_id: connectionId,
      p_token_type: 'access',
      p_token: tokens.access_token,
    })

    const { data: refreshSecretId } = await adminClient.rpc('store_token_in_vault', {
      p_connection_id: connectionId,
      p_token_type: 'refresh',
      p_token: tokens.refresh_token,
    })

    // Secret-IDs in Connection speichern
    await adminClient
      .from('airtable_connections')
      .update({
        access_token_secret_id: accessSecretId,
        refresh_token_secret_id: refreshSecretId,
      })
      .eq('id', connectionId)

    // 9. Initial Sync - Workspaces und Bases laden
    try {
      const { workspaceCount, baseCount } = await syncWorkspacesAndBases(
        adminClient,
        connectionId,
        tokens.access_token
      )

      // Status auf active setzen + Counts explizit speichern
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString(),
          workspace_count: workspaceCount,
          base_count: baseCount,
        })
        .eq('id', connectionId)
    } catch (syncError) {
      console.error('Initial sync error:', syncError)
      // EC-3: Sync fehlgeschlagen, aber Connection trotzdem behalten
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'pending_sync',
          error_message: 'Synchronisation ausstehend',
        })
        .eq('id', connectionId)
    }

    // 10. Redirect zur Verbindungs-Übersicht
    return NextResponse.redirect(
      `${settingsUrl}?success=${encodeURIComponent('Airtable erfolgreich verbunden!')}`
    )

  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      `${settingsUrl}?error=${encodeURIComponent('Ein Fehler ist aufgetreten. Bitte erneut versuchen.')}`
    )
  }
}

/**
 * Synchronisiert Workspaces und Bases von Airtable
 * Gibt die Anzahl der Workspaces und Bases zurück
 */
async function syncWorkspacesAndBases(
  adminClient: ReturnType<typeof createAdminClient>,
  connectionId: string,
  accessToken: string
): Promise<{ workspaceCount: number; baseCount: number }> {
  // Hole Workspaces (falls verfügbar)
  const { workspaces } = await getAirtableWorkspaces(accessToken)

  // Hole Bases
  const { bases } = await getAirtableBases(accessToken)

  // Lösche alte Daten
  await adminClient
    .from('airtable_bases')
    .delete()
    .eq('connection_id', connectionId)

  await adminClient
    .from('airtable_workspaces')
    .delete()
    .eq('connection_id', connectionId)

  // Erstelle "Default" Workspace falls keine vorhanden
  if (workspaces.length === 0) {
    workspaces.push({
      id: 'default',
      name: 'Meine Bases',
    })
  }

  // Speichere Workspaces
  const workspaceMap = new Map<string, string>()

  for (const workspace of workspaces) {
    const { data: savedWorkspace } = await adminClient
      .from('airtable_workspaces')
      .insert({
        connection_id: connectionId,
        airtable_workspace_id: workspace.id,
        name: workspace.name,
      })
      .select('id')
      .single()

    if (savedWorkspace) {
      workspaceMap.set(workspace.id, savedWorkspace.id)
    }
  }

  // Speichere Bases
  for (const base of bases) {
    // Finde passenden Workspace oder nutze Default
    const workspaceDbId = base.workspaceId
      ? workspaceMap.get(base.workspaceId)
      : workspaceMap.get('default')

    if (workspaceDbId) {
      await adminClient
        .from('airtable_bases')
        .insert({
          connection_id: connectionId,
          workspace_id: workspaceDbId,
          airtable_base_id: base.id,
          name: base.name,
        })
    }
  }

  return {
    workspaceCount: workspaces.length,
    baseCount: bases.length,
  }
}
