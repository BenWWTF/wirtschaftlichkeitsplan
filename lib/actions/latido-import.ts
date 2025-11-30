'use server'

import { createClient } from '@/utils/supabase/server'
import * as XLSX from 'xlsx'
import type { SessionImportRow } from '@/lib/types/import'

export interface LatidoParseError {
  row: number
  message: string
}

export interface LatidoImportResult {
  success: boolean
  sessions: SessionImportRow[]
  errors: LatidoParseError[]
  rowsProcessed: number
  sessionCount: number
}

/**
 * Parse Latido Excel file and extract session data
 * Expected columns: Rechnungsdatum (or Date), Therapieart (or Therapy Type), Anzahl Sitzungen (or Sessions)
 * Supports German and English column names
 */
export async function parseLatidoExcel(fileBuffer: Buffer): Promise<LatidoImportResult> {
  const errors: LatidoParseError[] = []
  const sessions: SessionImportRow[] = []

  try {
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!worksheet) {
      throw new Error('No worksheet found in Excel file')
    }

    // Convert to array of arrays
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as any[][]

    if (rows.length < 2) {
      throw new Error('Excel file must contain header row and at least one data row')
    }

    // Parse header row
    const headerRow = rows[0]
    if (!Array.isArray(headerRow) || headerRow.length === 0) {
      throw new Error('Excel file header row is invalid')
    }

    // Normalize headers: find columns by German/English names
    const normalizedHeaders = headerRow.map((h) =>
      String(h ?? '')
        .toLowerCase()
        .trim()
    )

    // Find column indices (German or English)
    const dateColIndex = normalizedHeaders.findIndex(h =>
      ['rechnungsdatum', 'date', 'datum', 'invoice date', 'rechnungsdatum'].includes(h)
    )
    const therapyColIndex = normalizedHeaders.findIndex(h =>
      ['therapieart', 'therapy type', 'therapy', 'therapie', 'treatment'].includes(h)
    )
    const sessionsColIndex = normalizedHeaders.findIndex(h =>
      ['anzahl sitzungen', 'sessions', 'sitzungen', 'number of sessions', 'count'].includes(h)
    )

    if (dateColIndex === -1) {
      throw new Error('Could not find date column (expected "Rechnungsdatum" or "Date")')
    }
    if (therapyColIndex === -1) {
      throw new Error('Could not find therapy type column (expected "Therapieart" or "Therapy Type")')
    }
    if (sessionsColIndex === -1) {
      throw new Error('Could not find sessions column (expected "Anzahl Sitzungen" or "Sessions")')
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]

      if (!Array.isArray(row) || row.length === 0) {
        continue // Skip empty rows
      }

      try {
        const dateValue = row[dateColIndex]
        const therapyValue = row[therapyColIndex]
        const sessionsValue = row[sessionsColIndex]

        // Validate data
        if (!dateValue || !therapyValue || sessionsValue === null || sessionsValue === undefined || sessionsValue === '') {
          errors.push({
            row: i + 1,
            message: 'Missing required data (date, therapy type, or session count)',
          })
          continue
        }

        // Parse date - support DD.MM.YYYY and YYYY-MM-DD formats
        const dateStr = String(dateValue).trim()
        let date: Date | null = null

        // Try DD.MM.YYYY format first (German)
        if (dateStr.includes('.')) {
          const [day, month, year] = dateStr.split('.')
          if (day && month && year) {
            date = new Date(Number(year), Number(month) - 1, Number(day))
          }
        }
        // Try YYYY-MM-DD format
        else if (dateStr.includes('-')) {
          date = new Date(dateStr + 'T00:00:00')
        }
        // Try parsing as Excel serial number (date might be numeric)
        else if (!isNaN(Number(dateValue))) {
          const excelDate = Number(dateValue)
          date = new Date((excelDate - 25569) * 86400 * 1000)
        }

        if (!date || isNaN(date.getTime())) {
          errors.push({
            row: i + 1,
            message: `Invalid date format: ${dateStr}. Expected DD.MM.YYYY or YYYY-MM-DD.`,
          })
          continue
        }

        // Convert to YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateISO = `${year}-${month}-${day}`

        // Parse therapy type
        const therapy = String(therapyValue).trim()
        if (therapy.length === 0) {
          errors.push({
            row: i + 1,
            message: 'Therapy type is empty',
          })
          continue
        }

        // Parse session count
        const sessionCount = Number(String(sessionsValue).replace(',', '.'))
        if (isNaN(sessionCount) || sessionCount < 0) {
          errors.push({
            row: i + 1,
            message: `Invalid session count: ${sessionsValue}. Must be a positive number.`,
          })
          continue
        }

        // Add to sessions (revenue is optional)
        sessions.push({
          date: dateISO,
          therapy_type: therapy,
          sessions: Math.round(sessionCount),
          // revenue is optional and will be calculated from price_per_session
        })
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : 'Unknown error processing row',
        })
      }
    }

    return {
      success: errors.length === 0 || sessions.length > 0,
      sessions,
      errors,
      rowsProcessed: rows.length - 1,
      sessionCount: sessions.reduce((sum, s) => sum + s.sessions, 0),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error parsing Excel file'
    throw new Error(`Failed to parse Latido Excel file: ${message}`)
  }
}

/**
 * Process parsed Latido sessions and update monthly_plans
 * This is the same workflow as CSV import but specialized for Latido format
 */
export async function processLatidoSessions(sessions: SessionImportRow[]) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      success: false,
      imported_count: 0,
      skipped_count: sessions.length,
      errors: [{ row: 0, message: 'Authentication required' }],
      warnings: []
    }
  }

  const errors: any[] = []
  const warnings: any[] = []
  let imported_count = 0
  let skipped_count = 0

  try {
    // Get all therapy types for the user
    const { data: therapyTypes, error: therapyError } = await supabase
      .from('therapy_types')
      .select('id, name, price_per_session')
      .eq('user_id', user.id)

    if (therapyError) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: sessions.length,
        errors: [{ row: 0, message: `Database error: ${therapyError.message}` }],
        warnings: []
      }
    }

    // Create therapy map (case-insensitive lookup)
    const therapyMap = new Map(
      therapyTypes?.map(t => [t.name.toLowerCase(), t]) || []
    )

    // Group sessions by month and therapy type
    const monthlyData = new Map<string, Map<string, { actual: number; revenue: number }>>()

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]
      const month = session.date.slice(0, 7) // Extract YYYY-MM
      const therapyName = session.therapy_type.toLowerCase()

      // Check if therapy type exists
      const therapy = therapyMap.get(therapyName)
      if (!therapy) {
        warnings.push({
          row: i + 1,
          message: `Therapy type "${session.therapy_type}" not found. Please create it first in therapy management.`,
          data: { therapy_type: session.therapy_type }
        })
        skipped_count++
        continue
      }

      // Initialize month data if needed
      if (!monthlyData.has(month)) {
        monthlyData.set(month, new Map())
      }

      const monthMap = monthlyData.get(month)!
      const therapyId = therapy.id

      // Initialize therapy data for this month
      if (!monthMap.has(therapyId)) {
        monthMap.set(therapyId, { actual: 0, revenue: 0 })
      }

      const data = monthMap.get(therapyId)!
      data.actual += session.sessions
      data.revenue += session.revenue || (session.sessions * therapy.price_per_session)

      imported_count++
    }

    // Update or create monthly_plans entries
    for (const [month, therapyData] of monthlyData.entries()) {
      for (const [therapyId, data] of therapyData.entries()) {
        // Check if monthly plan exists
        const { data: existingPlan, error: planError } = await supabase
          .from('monthly_plans')
          .select('id, planned_sessions')
          .eq('user_id', user.id)
          .eq('therapy_type_id', therapyId)
          .eq('month', month)
          .maybeSingle()

        if (planError) {
          errors.push({
            row: 0,
            message: `Error checking monthly plan: ${planError.message}`,
            data: { month, therapyId }
          })
          continue
        }

        if (existingPlan) {
          // Update existing plan with actual sessions
          const { error: updateError } = await supabase
            .from('monthly_plans')
            .update({ actual_sessions: data.actual })
            .eq('id', existingPlan.id)

          if (updateError) {
            errors.push({
              row: 0,
              message: `Error updating monthly plan: ${updateError.message}`,
              data: { month, therapyId }
            })
          }
        } else {
          // Create new plan with actual sessions (planned_sessions defaults to 0)
          const { error: insertError } = await supabase
            .from('monthly_plans')
            .insert({
              user_id: user.id,
              therapy_type_id: therapyId,
              month,
              planned_sessions: 0,
              actual_sessions: data.actual
            })

          if (insertError) {
            errors.push({
              row: 0,
              message: `Error creating monthly plan: ${insertError.message}`,
              data: { month, therapyId }
            })
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      imported_count,
      skipped_count,
      errors,
      warnings
    }
  } catch (err) {
    return {
      success: false,
      imported_count,
      skipped_count,
      errors: [...errors, { row: 0, message: err instanceof Error ? err.message : 'Unknown error' }],
      warnings
    }
  }
}
