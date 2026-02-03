import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshAccessToken, AIRTABLE_SCOPES } from '@/lib/airtable/oauth'

/**
 * POST /api/airtable/connections/[id]/refresh
 *
 * Refresht das Access Token einer Verbindung manuell.
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
      .select('id, organization_id, refresh_token_secret_id, status')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Verbindung nicht gefunden' },
        { status: 404 }
      )
    }

    // 3. Prüfe ob Refresh Token vorhanden
    if (!connection.refresh_token_secret_id) {
      return NextResponse.json(
        { error: 'Kein Refresh Token vorhanden' },
        { status: 400 }
      )
    }

    // 4. Hole Refresh Token aus Vault
    const { data: refreshToken, error: vaultError } = await adminClient.rpc(
      'get_token_from_vault',
      { p_secret_id: connection.refresh_token_secret_id }
    )

    if (vaultError || !refreshToken) {
      console.error('Vault read error:', vaultError)

      // EC-4: Token nicht mehr vorhanden
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'disconnected',
          error_message: 'Token nicht mehr verfügbar',
        })
        .eq('id', connectionId)

      return NextResponse.json(
        { error: 'Token konnte nicht gelesen werden' },
        { status: 500 }
      )
    }

    // 5. Refresh Token bei Airtable
    const clientId = process.env.AIRTABLE_CLIENT_ID!
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET!

    try {
      const tokens = await refreshAccessToken({
        clientId,
        clientSecret,
        refreshToken,
      })

      // 6. Neue Tokens im Vault speichern
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

      // 7. Berechne neuen Ablaufzeitpunkt
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      // 8. Connection aktualisieren
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

      return NextResponse.json({
        success: true,
        message: 'Token erfolgreich aktualisiert',
        expiresAt: tokenExpiresAt.toISOString(),
      })

    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)

      // EC-4: Token refresh fehlgeschlagen
      await adminClient
        .from('airtable_connections')
        .update({
          status: 'disconnected',
          error_message: 'Token-Refresh fehlgeschlagen. Bitte erneut verbinden.',
        })
        .eq('id', connectionId)

      return NextResponse.json(
        { error: 'Token konnte nicht aktualisiert werden. Bitte erneut verbinden.' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
