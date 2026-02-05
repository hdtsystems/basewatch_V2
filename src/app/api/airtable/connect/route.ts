import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from '@/lib/airtable/oauth'

/**
 * GET /api/airtable/connect
 *
 * Startet den OAuth 2.0 PKCE Flow mit Airtable.
 * Prüft vorher User-Berechtigung und Plan-Limits.
 */
export async function GET(request: Request) {
  try {
    // 1. Prüfe: User ist eingeloggt
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole org_id aus Query Parameter
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID fehlt' },
        { status: 400 }
      )
    }

    // 3. Prüfe: User ist Owner/Admin der Org
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Nur Eigentümer oder Admins können Verbindungen erstellen' },
        { status: 403 }
      )
    }

    // 4. Prüfe Plan-Limits (optional - skip wenn RPC nicht existiert)
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError) {
      console.error('Admin client creation failed:', adminError)
      return NextResponse.json(
        { error: 'Server-Konfiguration fehlerhaft (Admin). Bitte kontaktiere den Support.' },
        { status: 500 }
      )
    }
    try {
      const { data: canCreate, error: limitError } = await adminClient
        .rpc('can_create_connection', { org_id: orgId })

      // Wenn die RPC-Funktion nicht existiert, erlauben wir die Connection
      if (limitError && limitError.code === '42883') {
        // Function does not exist - skip limit check
        console.log('can_create_connection RPC not found, skipping limit check')
      } else if (limitError) {
        console.error('Limit check error:', limitError)
        return NextResponse.json(
          { error: 'Fehler bei der Limit-Prüfung' },
          { status: 500 }
        )
      } else if (canCreate === false) {
        return NextResponse.json(
          { error: 'Verbindungs-Limit erreicht. Bitte upgrade deinen Plan.' },
          { status: 403 }
        )
      }
    } catch (rpcError) {
      // Bei RPC-Fehlern fortfahren (Limit-Check ist nicht kritisch)
      console.warn('RPC limit check failed, continuing:', rpcError)
    }

    // 5. Generiere PKCE + State
    const state = generateState()
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // 6. Speichere State + Code Verifier in oauth_states
    const { error: stateError } = await adminClient
      .from('oauth_states')
      .insert({
        state,
        user_id: user.id,
        organization_id: orgId,
        code_verifier: codeVerifier,
      })

    if (stateError) {
      console.error('State save error:', stateError)
      // Detailliertere Fehlermeldung für Debugging
      if (stateError.code === '42P01') {
        console.error('oauth_states table does not exist')
        return NextResponse.json(
          { error: 'OAuth-Tabelle nicht gefunden. Bitte kontaktiere den Support.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Fehler beim Speichern des OAuth-States' },
        { status: 500 }
      )
    }

    // 7. Baue Authorization URL
    const clientId = process.env.AIRTABLE_CLIENT_ID
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
      console.error('Missing Airtable OAuth config')
      return NextResponse.json(
        { error: 'Airtable OAuth ist nicht konfiguriert' },
        { status: 500 }
      )
    }

    const authUrl = buildAuthorizationUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge,
    })

    // 8. Redirect zu Airtable
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('OAuth connect error:', error)

    // Bessere Fehlerbehandlung für Debugging
    if (error instanceof Error) {
      if (error.message.includes('Missing Supabase environment')) {
        return NextResponse.json(
          { error: 'Server-Konfiguration fehlerhaft. Bitte kontaktiere den Support.' },
          { status: 500 }
        )
      }
      // Log den genauen Fehler für Debugging
      console.error('Error details:', error.message)
    }

    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
