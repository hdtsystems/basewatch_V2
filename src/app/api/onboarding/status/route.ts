import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/onboarding/status
 *
 * Gibt den aktuellen Onboarding-Status des eingeloggten Users zurück.
 * Erstellt einen neuen Status-Eintrag falls keiner existiert.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Prüfe Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // 2. Hole Onboarding-Status
    let { data: status, error: fetchError } = await supabase
      .from('user_onboarding_status')
      .select(`
        *,
        organizations (
          id,
          name,
          slug,
          plan
        )
      `)
      .eq('user_id', user.id)
      .single()

    // 3. Falls kein Status existiert, erstelle einen neuen
    if (fetchError?.code === 'PGRST116') {
      // Prüfe ob User bereits einer Org angehört
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const initialStep = membership ? 2 : 1 // Wenn bereits in Org, starte bei Schritt 2
      const completedAt = membership ? new Date().toISOString() : null

      const { data: newStatus, error: insertError } = await supabase
        .from('user_onboarding_status')
        .insert({
          user_id: user.id,
          current_step: initialStep,
          organization_id: membership?.organization_id || null,
          completed_at: completedAt,
        })
        .select(`
          *,
          organizations (
            id,
            name,
            slug,
            plan
          )
        `)
        .single()

      if (insertError) {
        console.error('Create onboarding status error:', insertError)
        return NextResponse.json(
          { error: 'Fehler beim Erstellen des Onboarding-Status' },
          { status: 500 }
        )
      }

      status = newStatus
    } else if (fetchError) {
      console.error('Fetch onboarding status error:', fetchError)
      return NextResponse.json(
        { error: 'Fehler beim Laden des Onboarding-Status' },
        { status: 500 }
      )
    }

    // 4. Berechne zusätzliche Infos
    const isCompleted = !!status?.completed_at || !!status?.skipped_at
    const totalSteps = 4

    return NextResponse.json({
      status: {
        ...status,
        isCompleted,
        totalSteps,
        progress: Math.min((status?.current_step || 1) / totalSteps * 100, 100),
      },
    })

  } catch (error) {
    console.error('Get onboarding status error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
