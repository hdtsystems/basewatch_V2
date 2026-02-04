import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/organizations/[id]/bases/sync
 *
 * Synchronisiert die Airtable Bases mit der Datenbank.
 * Holt neue Bases und markiert gelöschte als nicht verfügbar.
 * Rate-Limit: max 1 Sync pro 5 Minuten (Airtable API-Schutz)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // 0. Rate-Limit prüfen (max 1/5min pro Organisation)
    const rateLimitResponse = applyRateLimit(request, 'bases-sync', id)
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Prüfe Mitgliedschaft
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Organisation' },
        { status: 403 }
      )
    }

    // 3. Hole alle aktiven Airtable Connections
    const { data: connections, error: connError } = await supabase
      .from('airtable_connections')
      .select('id, airtable_email')
      .eq('organization_id', id)
      .eq('status', 'active')

    if (connError) {
      console.error('Fetch connections error:', connError)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Verbindungen' },
        { status: 500 }
      )
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine aktiven Verbindungen zum Synchronisieren',
        synced: 0,
      })
    }

    // 4. Trigger Sync für jede Connection
    // Dies ruft die bestehende Sync-Route auf
    const syncResults = await Promise.all(
      connections.map(async (conn) => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const response = await fetch(`${baseUrl}/api/airtable/connections/${conn.id}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Forward cookies for auth
              Cookie: request.headers.get('cookie') || '',
            },
          })

          if (!response.ok) {
            const error = await response.json()
            return {
              connection_id: conn.id,
              email: conn.airtable_email,
              success: false,
              error: error.error || 'Sync fehlgeschlagen',
            }
          }

          const result = await response.json()
          return {
            connection_id: conn.id,
            email: conn.airtable_email,
            success: true,
            workspaces: result.workspaces_count || 0,
            bases: result.bases_count || 0,
          }
        } catch (error) {
          console.error(`Sync error for connection ${conn.id}:`, error)
          return {
            connection_id: conn.id,
            email: conn.airtable_email,
            success: false,
            error: 'Netzwerkfehler beim Synchronisieren',
          }
        }
      })
    )

    const successCount = syncResults.filter(r => r.success).length
    const totalWorkspaces = syncResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + ((r as { workspaces: number }).workspaces || 0), 0)
    const totalBases = syncResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + ((r as { bases: number }).bases || 0), 0)

    return NextResponse.json({
      success: true,
      results: syncResults,
      summary: {
        connections_synced: successCount,
        connections_failed: syncResults.length - successCount,
        total_workspaces: totalWorkspaces,
        total_bases: totalBases,
      },
      message: `${successCount} von ${syncResults.length} Verbindungen synchronisiert`,
    })

  } catch (error) {
    console.error('Bases sync error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
