'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@/utils/supabase/service-client'
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
  warnings: LatidoParseError[]
  rowsProcessed: number
  sessionCount: number
  summary: {
    totalInvoices: number
    validInvoices: number
    cancelledInvoices: number
    monthlyBreakdown: Record<string, { sessions: number; revenue: number }>
  }
}

/**
 * Parse Latido Excel export (Honorarnoten)
 *
 * Latido exports invoices with columns:
 * - Rechnungsdatum: Invoice date (DD.MM.YYYY)
 * - Rechnungsnummer: Invoice number
 * - Zahlungsart: Payment method (Bar, Bankomat, Kreditkarte)
 * - Gesamtbetrag (Netto): Net amount
 * - Gesamtbetrag (Brutto): Gross amount
 * - Zahlungsstatus: Payment status (Bezahlt, Storniert, Storno)
 * - Ordinationsdaten: Practice info
 *
 * Each row = 1 invoice = 1 session
 * Negative amounts or status "Storno" = cancellation (excluded)
 * Therapy type is matched by price against user's therapy_types
 */
export async function parseLatidoExcel(fileBase64: string): Promise<LatidoImportResult> {
  const errors: LatidoParseError[] = []
  const warnings: LatidoParseError[] = []
  const sessions: SessionImportRow[] = []

  try {
    const fileBuffer = Buffer.from(fileBase64, 'base64')
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!worksheet) {
      throw new Error('Kein Arbeitsblatt in der Excel-Datei gefunden')
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: '',
    }) as any[][]

    if (rows.length < 2) {
      throw new Error('Die Excel-Datei muss eine Kopfzeile und mindestens eine Datenzeile enthalten')
    }

    // Parse header row
    const headerRow = rows[0]
    const normalizedHeaders = headerRow.map((h: any) =>
      String(h ?? '').toLowerCase().trim()
    )

    // Find column indices for Latido format
    const dateColIndex = normalizedHeaders.findIndex((h: string) =>
      h.includes('rechnungsdatum') || h === 'datum' || h === 'date'
    )
    const netAmountColIndex = normalizedHeaders.findIndex((h: string) =>
      h.includes('gesamtbetrag (netto)') || h.includes('netto')
    )
    const grossAmountColIndex = normalizedHeaders.findIndex((h: string) =>
      h.includes('gesamtbetrag (brutto)') || h.includes('brutto')
    )
    const statusColIndex = normalizedHeaders.findIndex((h: string) =>
      h.includes('zahlungsstatus') || h.includes('status')
    )
    const invoiceNumColIndex = normalizedHeaders.findIndex((h: string) =>
      h.includes('rechnungsnummer') || h.includes('invoice')
    )

    if (dateColIndex === -1) {
      throw new Error('Spalte "Rechnungsdatum" nicht gefunden')
    }

    // Use net amount if available, otherwise gross
    const amountColIndex = netAmountColIndex !== -1 ? netAmountColIndex : grossAmountColIndex
    if (amountColIndex === -1) {
      throw new Error('Spalte "Gesamtbetrag (Netto)" oder "Gesamtbetrag (Brutto)" nicht gefunden')
    }

    if (invoiceNumColIndex === -1) {
      warnings.push({ row: 0, message: 'Spalte "Rechnungsnummer" nicht gefunden. Duplikaterkennung nicht möglich.' })
    }

    let totalInvoices = 0
    let cancelledInvoices = 0
    const monthlyBreakdown: Record<string, { sessions: number; revenue: number }> = {}

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!Array.isArray(row) || row.length === 0) continue

      totalInvoices++

      try {
        const dateValue = row[dateColIndex]
        const amountValue = row[amountColIndex]
        const statusValue = statusColIndex !== -1 ? String(row[statusColIndex] ?? '').trim() : ''
        const invoiceNum = invoiceNumColIndex !== -1 ? String(row[invoiceNumColIndex] ?? '').trim() : ''

        // Skip empty rows
        if (!dateValue && !amountValue) continue

        // Parse amount
        const amount = typeof amountValue === 'number'
          ? amountValue
          : parseFloat(String(amountValue).replace(',', '.').replace(/[^\d.-]/g, ''))

        if (isNaN(amount)) {
          errors.push({ row: i + 1, message: `Ungültiger Betrag: ${amountValue}` })
          continue
        }

        // Skip cancellations (negative amounts or Storno status)
        const isCancellation = amount < 0
          || statusValue.toLowerCase() === 'storno'
          || statusValue.toLowerCase() === 'storniert'

        if (isCancellation) {
          cancelledInvoices++
          continue
        }

        // Parse date
        const dateStr = String(dateValue).trim()
        let date: Date | null = null

        if (dateStr.includes('.')) {
          const [day, month, year] = dateStr.split('.')
          if (day && month && year) {
            date = new Date(Number(year), Number(month) - 1, Number(day))
          }
        } else if (dateStr.includes('-')) {
          date = new Date(dateStr + 'T00:00:00')
        } else if (!isNaN(Number(dateValue))) {
          // Excel serial date
          date = new Date((Number(dateValue) - 25569) * 86400 * 1000)
        }

        if (!date || isNaN(date.getTime())) {
          errors.push({ row: i + 1, message: `Ungültiges Datum: ${dateStr}` })
          continue
        }

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateISO = `${year}-${month}-${day}`
        const monthKey = `${year}-${month}`

        // Each valid invoice = 1 session
        sessions.push({
          date: dateISO,
          therapy_type: `__price:${amount}`,
          sessions: 1,
          revenue: amount,
          invoice_number: invoiceNum || undefined,
        })

        // Track monthly breakdown
        if (!monthlyBreakdown[monthKey]) {
          monthlyBreakdown[monthKey] = { sessions: 0, revenue: 0 }
        }
        monthlyBreakdown[monthKey].sessions++
        monthlyBreakdown[monthKey].revenue += amount

      } catch (err) {
        errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : 'Fehler beim Verarbeiten der Zeile',
        })
      }
    }

    return {
      success: errors.length === 0 || sessions.length > 0,
      sessions,
      errors,
      warnings,
      rowsProcessed: rows.length - 1,
      sessionCount: sessions.length,
      summary: {
        totalInvoices,
        validInvoices: sessions.length,
        cancelledInvoices,
        monthlyBreakdown,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    throw new Error(`Fehler beim Lesen der Latido-Datei: ${message}`)
  }
}

/**
 * Process parsed Latido sessions and update monthly_plans
 * Matches invoices to therapy types by price
 * Tracks imported invoices by Rechnungsnummer to prevent duplicates
 */
export async function processLatidoSessions(sessions: SessionImportRow[]) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      success: false,
      imported_count: 0,
      skipped_count: sessions.length,
      duplicate_count: 0,
      imported_months: [] as string[],
      errors: [{ row: 0, message: 'Authentifizierung erforderlich' }],
      warnings: []
    }
  }

  const errors: any[] = []
  const warnings: any[] = []
  let imported_count = 0
  let skipped_count = 0
  let duplicate_count = 0
  const importedMonths = new Set<string>()

  try {
    // Get service client for imported_invoices operations (bypasses PostgREST schema cache)
    const serviceSupabase = await createServiceClient()

    // Check for already-imported invoices (duplicate detection)
    const invoiceNumbers = sessions
      .map(s => s.invoice_number)
      .filter((n): n is string => !!n && n.length > 0)

    let alreadyImported = new Set<string>()

    if (invoiceNumbers.length > 0) {
      try {
        // Try RPC first
        const { data: existing } = await serviceSupabase.rpc('check_imported_invoices', {
          p_user_id: user.id,
          p_invoice_numbers: invoiceNumbers,
        })
        if (existing) {
          alreadyImported = new Set(existing.map((e: any) => e.invoice_number))
        }
      } catch {
        // Fallback: direct table query with service client
        const { data: existing } = await serviceSupabase
          .from('imported_invoices')
          .select('invoice_number')
          .eq('user_id', user.id)
          .in('invoice_number', invoiceNumbers)
        if (existing) {
          alreadyImported = new Set(existing.map(e => e.invoice_number))
        }
      }
    }

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
        duplicate_count: 0,
        imported_months: [],
        errors: [{ row: 0, message: `Datenbankfehler: ${therapyError.message}` }],
        warnings: []
      }
    }

    // Create price-to-therapy map
    const priceMap = new Map<number, typeof therapyTypes[0][]>()
    for (const t of therapyTypes || []) {
      const price = t.price_per_session
      if (!priceMap.has(price)) priceMap.set(price, [])
      priceMap.get(price)!.push(t)
    }

    // Also create name map for direct name matching
    const nameMap = new Map(
      therapyTypes?.map(t => [t.name.toLowerCase(), t]) || []
    )

    // Group sessions by month and therapy type, skipping duplicates
    const monthlyData = new Map<string, Map<string, { actual: number; revenue: number }>>()
    const newInvoices: Array<{ invoice_number: string; date: string; amount: number; therapy_type_id: string }> = []

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]

      // Skip already-imported invoices
      if (session.invoice_number && alreadyImported.has(session.invoice_number)) {
        duplicate_count++
        continue
      }

      const month = session.date.slice(0, 7) + '-01'

      let therapyId: string = ''

      // Check if therapy_type is a price marker
      if (session.therapy_type.startsWith('__price:')) {
        const price = parseFloat(session.therapy_type.replace('__price:', ''))
        let matches = priceMap.get(price)
        if (!matches) {
          for (const [mapPrice, therapies] of priceMap.entries()) {
            if (Math.abs(mapPrice - price) < 0.01) {
              matches = therapies
              break
            }
          }
        }

        if (!matches || matches.length === 0) {
          warnings.push({
            row: i + 1,
            message: `Kein Therapietyp mit Preis ${price}€ gefunden. Bitte erstellen Sie zuerst den passenden Therapietyp.`,
          })
          skipped_count++
          continue
        }

        if (matches.length > 1) {
          warnings.push({
            row: i + 1,
            message: `Mehrere Therapietypen mit Preis ${price}€: ${matches.map(m => m.name).join(', ')}. Erste Übereinstimmung "${matches[0].name}" wird verwendet.`,
          })
        }

        therapyId = matches[0].id
      } else {
        const therapy = nameMap.get(session.therapy_type.toLowerCase())
        if (!therapy) {
          warnings.push({
            row: i + 1,
            message: `Therapietyp "${session.therapy_type}" nicht gefunden.`,
          })
          skipped_count++
          continue
        }
        therapyId = therapy.id
      }

      // Track this invoice for duplicate detection
      if (session.invoice_number) {
        newInvoices.push({
          invoice_number: session.invoice_number,
          date: session.date,
          amount: session.revenue || 0,
          therapy_type_id: therapyId,
        })
      }

      // Initialize month data
      if (!monthlyData.has(month)) {
        monthlyData.set(month, new Map())
      }

      const monthMap = monthlyData.get(month)!
      if (!monthMap.has(therapyId)) {
        monthMap.set(therapyId, { actual: 0, revenue: 0 })
      }

      const data = monthMap.get(therapyId)!
      data.actual += session.sessions
      data.revenue += session.revenue || 0

      importedMonths.add(session.date.slice(0, 7))
      imported_count++
    }

    // Update or create monthly_plans entries
    for (const [month, therapyData] of monthlyData.entries()) {
      for (const [therapyId, data] of therapyData.entries()) {
        const { data: existingPlan, error: planError } = await supabase
          .from('monthly_plans')
          .select('id, planned_sessions, actual_sessions')
          .eq('user_id', user.id)
          .eq('therapy_type_id', therapyId)
          .eq('month', month)
          .maybeSingle()

        if (planError) {
          errors.push({
            row: 0,
            message: `Datenbankfehler: ${planError.message}`,
          })
          continue
        }

        if (existingPlan) {
          // Add to existing actual_sessions (don't replace, to support incremental imports)
          const newActual = (existingPlan.actual_sessions || 0) + data.actual
          const { error: updateError } = await supabase
            .from('monthly_plans')
            .update({ actual_sessions: newActual })
            .eq('id', existingPlan.id)

          if (updateError) {
            errors.push({
              row: 0,
              message: `Fehler beim Aktualisieren: ${updateError.message}`,
            })
          }
        } else {
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
              message: `Fehler beim Erstellen: ${insertError.message}`,
            })
          }
        }
      }
    }

    // Record imported invoices for duplicate tracking
    for (const inv of newInvoices) {
      try {
        await serviceSupabase.rpc('insert_imported_invoice', {
          p_user_id: user.id,
          p_invoice_number: inv.invoice_number,
          p_invoice_date: inv.date,
          p_amount: inv.amount,
          p_therapy_type_id: inv.therapy_type_id,
        })
      } catch {
        // Fallback: direct insert with service client
        await serviceSupabase
          .from('imported_invoices')
          .insert({
            user_id: user.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.date,
            amount: inv.amount,
            therapy_type_id: inv.therapy_type_id,
          })
          .select()
          .maybeSingle()
      }
    }

    return {
      success: errors.length === 0,
      imported_count,
      skipped_count,
      duplicate_count,
      imported_months: [...importedMonths].sort(),
      errors,
      warnings
    }
  } catch (err) {
    return {
      success: false,
      imported_count,
      skipped_count,
      duplicate_count,
      imported_months: [...importedMonths].sort(),
      errors: [...errors, { row: 0, message: err instanceof Error ? err.message : 'Unbekannter Fehler' }],
      warnings
    }
  }
}
