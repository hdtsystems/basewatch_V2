import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/rate-limit'

// Validation Schema
const CompleteStepSchema = z.object({
  step: z.number().min(1).max(4),
  organization_id: z.string().uuid().optional(),
})

/**
 * POST /api/onboarding/complete-step
 *
 * Markiert einen Onboarding-Schritt als abgeschlossen und geht zum nächsten.
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

    // 2. Parse und validiere Request Body
    const body = await request.json()
    const parsed = CompleteStepSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { step, organization_id } = parsed.data

    // 3. Hole aktuellen Status
    const { data: currentStatus, error: fetchError } = await supabase
      .from('user_onboarding_status')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Onboarding-Status nicht gefunden' },
        { status: 404 }
      )
    }

    // 4. Validiere dass der Schritt der aktuelle ist
    if (currentStatus.current_step !== step) {
      return NextResponse.json(
        { error: `Ungültiger Schritt. Aktueller Schritt: ${currentStatus.current_step}` },
        { status: 400 }
      )
    }

    // 5. Berechne nächsten Schritt
    const nextStep = step + 1
    const isComplete = nextStep > 4

    // 6. Update Onboarding-Status
    const updateData: Record<string, unknown> = {
      current_step: isComplete ? 4 : nextStep,
    }

    if (organization_id) {
      updateData.organization_id = organization_id
    }

    if (isComplete) {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedStatus, error: updateError } = await supabase
      .from('user_onboarding_status')
      .update(updateData)
      .eq('user_id', user.id)
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

    if (updateError) {
      console.error('Update onboarding status error:', updateError)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren des Onboarding-Status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: {
        ...updatedStatus,
        isCompleted: isComplete,
        totalSteps: 4,
        progress: Math.min(nextStep / 4 * 100, 100),
      },
      message: isComplete
        ? 'Onboarding abgeschlossen!'
        : `Schritt ${step} abgeschlossen. Weiter zu Schritt ${nextStep}.`,
    })

  } catch (error) {
    console.error('Complete step error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
