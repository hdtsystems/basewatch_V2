import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/onboarding/skip
 *
 * Überspringt das Onboarding für den eingeloggten User.
 * Kann nur verwendet werden, wenn der User bereits einer Organisation angehört.
 * Rate-Limit: max 10 pro Minute (DoS-Schutz)
 */
export async function POST(request: Request) {
  try {
    // 0. Rate-Limit prüfen (max 10/min)
    const rateLimitResponse = applyRateLimit(request, 'onboarding')
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

    // 2. Prüfe ob User einer Org angehört
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Du musst mindestens einer Organisation angehören, um das Onboarding zu überspringen' },
        { status: 400 }
      )
    }

    // 3. Update Onboarding-Status
    const { data: status, error: upsertError } = await supabase
      .from('user_onboarding_status')
      .upsert({
        user_id: user.id,
        current_step: 4,
        organization_id: membership.organization_id,
        skipped_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
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

    if (upsertError) {
      console.error('Skip onboarding error:', upsertError)
      return NextResponse.json(
        { error: 'Fehler beim Überspringen des Onboardings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        isCompleted: true,
        totalSteps: 4,
        progress: 100,
      },
      message: 'Onboarding übersprungen',
    })

  } catch (error) {
    console.error('Skip onboarding error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
