import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseLatidoExcel, processLatidoInvoices, importLatidoInvoices } from '@/lib/actions/latido-import'

export async function POST(request: NextRequest) {
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

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are supported' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxFileSize = 5 * 1024 * 1024
    if (file.size > maxFileSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse Excel file
    let parsedInvoices
    try {
      parsedInvoices = await parseLatidoExcel(buffer)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    if (parsedInvoices.length === 0) {
      return NextResponse.json({ error: 'Excel file contains no invoice data' }, { status: 400 })
    }

    // Process and validate invoices
    let processedInvoices
    try {
      processedInvoices = await processLatidoInvoices(parsedInvoices)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to process invoices: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Import invoices into database
    let importResult
    try {
      importResult = await importLatidoInvoices(user.id, processedInvoices, file.name)
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to import invoices: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(importResult, { status: 200 })
  } catch (error) {
    console.error('Error in latido import endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
