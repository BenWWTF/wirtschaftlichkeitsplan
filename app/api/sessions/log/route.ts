import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAuthUserId } from '@/lib/utils/auth'
import { logError } from '@/lib/utils/logger'

/**
 * POST /api/sessions/log
 *
 * Log completed sessions by incrementing actual_sessions column.
 * Used by both Session Logger UI and Latido import.
 *
 * Request body:
 * {
 *   therapy_id: string      // UUID of therapy type
 *   month_year: string      // YYYY-MM format
 *   sessions_count: number  // Positive integer of sessions to add
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   data?: { actual_sessions: number }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    let body: {
      therapy_id?: unknown
      month_year?: unknown
      sessions_count?: unknown
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body: must be valid JSON'
        },
        { status: 400 }
      )
    }

    // Validate therapy_id
    if (!body.therapy_id || typeof body.therapy_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'therapy_id is required and must be a string'
        },
        { status: 400 }
      )
    }

    // Validate month_year format (YYYY-MM)
    if (!body.month_year || typeof body.month_year !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'month_year is required and must be a string (format: YYYY-MM)'
        },
        { status: 400 }
      )
    }

    const monthRegex = /^\d{4}-\d{2}$/
    if (!monthRegex.test(body.month_year)) {
      return NextResponse.json(
        {
          success: false,
          message: 'month_year must be in YYYY-MM format'
        },
        { status: 400 }
      )
    }

    // Validate sessions_count
    if (
      typeof body.sessions_count !== 'number' ||
      !Number.isInteger(body.sessions_count) ||
      body.sessions_count <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'sessions_count is required and must be a positive integer'
        },
        { status: 400 }
      )
    }

    // Get authenticated user
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: user not authenticated'
        },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Convert month_year to YYYY-MM-01 for database
    const monthDate = `${body.month_year}-01`

    // Check if monthly_plans row exists for this user, therapy, and month
    const { data: existingPlan, error: queryError } = await supabase
      .from('monthly_plans')
      .select('id, actual_sessions')
      .eq('user_id', userId)
      .eq('therapy_type_id', body.therapy_id)
      .eq('month', monthDate)
      .maybeSingle()

    if (queryError) {
      logError('POST /api/sessions/log', 'Error querying monthly_plans', queryError, {
        userId,
        therapy_id: body.therapy_id,
        month_year: body.month_year
      })
      return NextResponse.json(
        {
          success: false,
          message: 'Error querying database'
        },
        { status: 500 }
      )
    }

    let updatedActualSessions = body.sessions_count

    if (existingPlan) {
      // Row exists: increment actual_sessions
      updatedActualSessions = (existingPlan.actual_sessions || 0) + body.sessions_count

      const { error: updateError } = await supabase
        .from('monthly_plans')
        .update({
          actual_sessions: updatedActualSessions,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id)

      if (updateError) {
        logError('POST /api/sessions/log', 'Error updating monthly_plans', updateError, {
          userId,
          plan_id: existingPlan.id,
          sessions_count: body.sessions_count
        })
        return NextResponse.json(
          {
            success: false,
            message: 'Error updating sessions'
          },
          { status: 500 }
        )
      }
    } else {
      // Row doesn't exist: create new record with actual_sessions = sessions_count
      const { error: insertError } = await supabase
        .from('monthly_plans')
        .insert({
          user_id: userId,
          therapy_type_id: body.therapy_id,
          month: monthDate,
          planned_sessions: 0,
          actual_sessions: body.sessions_count,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        logError('POST /api/sessions/log', 'Error inserting monthly_plans', insertError, {
          userId,
          therapy_id: body.therapy_id,
          month_year: body.month_year,
          sessions_count: body.sessions_count
        })
        return NextResponse.json(
          {
            success: false,
            message: 'Error creating session record'
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully logged ${body.sessions_count} session(s)`,
        data: {
          actual_sessions: updatedActualSessions
        }
      },
      { status: 200 }
    )

  } catch (error) {
    logError('POST /api/sessions/log', 'Unexpected error in POST handler', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected server error'
      },
      { status: 500 }
    )
  }
}
