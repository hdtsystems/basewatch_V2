import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getAirtableBases,
  getAirtableWorkspaces,
  refreshAccessToken,
  AIRTABLE_SCOPES,
} from '@/lib/airtable/oauth'

/**
 * POST /api/airtable/connections/[id]/sync
 *
 * Synchronisiert Workspaces und Bases einer Verbindung mit Airtable.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole Connection
    const { data: connection, error: connectionError } = await supabase
      .from('airtable_connections')
      .select(`
        id,
        organization_id,
        access_token_secret_id,
        refresh_token_secret_id,
        token_expires_at,
        status
      `)
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Verbindung nicht gefunden' },
        { status: 404 }
      )
    }

    if (connection.status === 'disconnected') {
      return NextResponse.json(
        { error: 'Verbindung ist getrennt. Bitte erneut verbinden.' },
        { status: 400 }
      )
    }

    // 3. Hole Access Token aus Vault
    let accessToken: string | null = null

    if (connection.access_token_secret_id) {
      const { data: token } = await adminClient.rpc('get_token_from_vault', {
        p_secret_id: connection.access_token_secret_id,
      })
      accessToken = token
    }

    // 4. Prüfe ob Token abgelaufen ist
    const tokenExpired = connection.token_expires_at
      ? new Date(connection.token_expires_at) < new Date()
      : true

    if (tokenExpired && connection.refresh_token_secret_id) {
      // Token ist abgelaufen - versuche zu refreshen
      const { data: refreshToken } = await adminClient.rpc('get_token_from_vault', {
        p_secret_id: connection.refresh_token_secret_id,
      })

      if (refreshToken) {
        try {
          const clientId = process.env.AIRTABLE_CLIENT_ID!
          const clientSecret = process.env.AIRTABLE_CLIENT_SECRET!

          const tokens = await refreshAccessToken({
            clientId,
            clientSecret,
            refreshToken,
          })

          accessToken = tokens.access_token

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

          const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

          await adminClient
            .from('airtable_connections')
            .update({
              access_token_secret_id: accessSecretId,
              refresh_token_secret_id: refreshSecretId,
              token_expires_at: tokenExpiresAt.toISOString(),
              scopes: AIRTABLE_SCOPES,
            })
            .eq('id', connectionId)

        } catch {
          // Token refresh failed
          await adminClient
            .from('airtable_connections')
            .update({
              status: 'disconnected',
              error_message: 'Token abgelaufen. Bitte erneut verbinden.',
            })
            .eq('id', connectionId)

          return NextResponse.json(
            { error: 'Token abgelaufen. Bitte erneut verbinden.' },
            { status: 401 }
          )
        }
      }
    }

    if (!accessToken) {
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'disconnected',
          error_message: 'Kein gültiger Token verfügbar',
        })
        .eq('id', connectionId)

      return NextResponse.json(
        { error: 'Kein gültiger Token verfügbar' },
        { status: 401 }
      )
    }

    // 5. Hole Workspaces und Bases von Airtable
    try {
      const { workspaces } = await getAirtableWorkspaces(accessToken)
      const { bases } = await getAirtableBases(accessToken)

      // 6. Lösche alte Daten
      await adminClient
        .from('airtable_bases')
        .delete()
        .eq('connection_id', connectionId)

      await adminClient
        .from('airtable_workspaces')
        .delete()
        .eq('connection_id', connectionId)

      // Default Workspace falls keine vorhanden
      const workspacesToSave = workspaces.length > 0
        ? workspaces
        : [{ id: 'default', name: 'Meine Bases' }]

      // 7. Speichere Workspaces
      const workspaceMap = new Map<string, string>()

      for (const workspace of workspacesToSave) {
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

      // 8. Speichere Bases
      for (const base of bases) {
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

      // 9. Aktualisiere Connection Status + Counts (explizit als Backup zu Triggern)
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString(),
          error_message: null,
          workspace_count: workspacesToSave.length,
          base_count: bases.length,
        })
        .eq('id', connectionId)

      return NextResponse.json({
        success: true,
        message: 'Synchronisation erfolgreich',
        workspaceCount: workspacesToSave.length,
        baseCount: bases.length,
      })

    } catch (apiError) {
      console.error('Airtable API error:', apiError)

      // Prüfe ob 401 (Token widerrufen)
      if (apiError instanceof Error && apiError.message.includes('401')) {
        await adminClient
          .from('airtable_connections')
          .update({
            status: 'disconnected',
            error_message: 'Airtable-Zugriff wurde widerrufen. Bitte erneut verbinden.',
          })
          .eq('id', connectionId)

        return NextResponse.json(
          { error: 'Airtable-Zugriff wurde widerrufen. Bitte erneut verbinden.' },
          { status: 401 }
        )
      }

      // EC-3: Andere API-Fehler
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'error',
          error_message: 'Synchronisation fehlgeschlagen. Versuche es später erneut.',
        })
        .eq('id', connectionId)

      return NextResponse.json(
        { error: 'Synchronisation fehlgeschlagen' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
