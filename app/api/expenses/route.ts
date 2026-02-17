import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')

    let query = supabase
      .from('expenses')
      .select('id, category, amount, expense_date')
      .eq('user_id', user.id)

    if (startMonth && endMonth) {
      // Convert YYYY-MM to date range
      const startDate = `${startMonth}-01`

      // Get last day of end month
      const [year, month] = endMonth.split('-')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const endDate = `${endMonth}-${String(lastDay).padStart(2, '0')}`

      query = query
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
    }

    const { data: expenses, error } = await query

    console.log('[expenses API] Query params:', { startMonth, endMonth })
    console.log('[expenses API] Expenses result:', { count: expenses?.length, error })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ expenses: expenses || [] })
  } catch (error) {
    console.error('Error in expenses API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
