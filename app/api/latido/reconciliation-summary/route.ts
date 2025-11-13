import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getLatidoReconciliationSummary } from '@/lib/actions/latido-import'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch reconciliation summary
    const summary = await getLatidoReconciliationSummary(user.id)

    return NextResponse.json(summary, { status: 200 })
  } catch (error) {
    console.error('Error fetching reconciliation summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reconciliation summary' },
      { status: 500 }
    )
  }
}
