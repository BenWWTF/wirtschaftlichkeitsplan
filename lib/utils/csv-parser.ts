/**
 * CSV Parser for Practice Data Imports
 * Handles various CSV formats from Austrian practice management software
 */

import type {
  SessionImportRow,
  ImportResult,
  ImportError,
  ImportWarning,
  ImportPreview,
  CSVImportConfig,
  ImportColumnMapping
} from '@/lib/types/import'
import { DEFAULT_CSV_CONFIG } from '@/lib/types/import'

/**
 * Parse CSV content into structured data
 */
export function parseCSV(
  content: string,
  config: CSVImportConfig = DEFAULT_CSV_CONFIG
): string[][] {
  const lines = content.split('\n').filter(line => line.trim())
  const rows: string[][] = []

  for (const line of lines) {
    // Handle different delimiters
    const cells = line.split(config.delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
    rows.push(cells)
  }

  return config.has_header ? rows.slice(1) : rows
}

/**
 * Get header row from CSV
 */
export function getCSVHeaders(content: string, delimiter: string = ','): string[] {
  const firstLine = content.split('\n')[0]
  return firstLine.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
}

/**
 * Auto-detect column mapping from CSV headers
 */
export function detectColumnMapping(headers: string[]): Partial<ImportColumnMapping> {
  const mapping: Partial<ImportColumnMapping> = {}

  // German column names (LATIDO, Austrian software)
  const datePatterns = ['datum', 'date', 'termin']
  const therapyPatterns = ['leistung', 'therapie', 'therapy', 'behandlung', 'type']
  const sessionsPatterns = ['anzahl', 'sessions', 'sitzungen', 'count']
  const revenuePatterns = ['betrag', 'revenue', 'umsatz', 'honorar', 'amount']
  const patientTypePatterns = ['patientenart', 'patient type', 'kasse/privat']

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase()

    if (datePatterns.some(p => header.includes(p))) {
      mapping.date_column = headers[i]
    }
    if (therapyPatterns.some(p => header.includes(p))) {
      mapping.therapy_type_column = headers[i]
    }
    if (sessionsPatterns.some(p => header.includes(p))) {
      mapping.sessions_column = headers[i]
    }
    if (revenuePatterns.some(p => header.includes(p))) {
      mapping.revenue_column = headers[i]
    }
    if (patientTypePatterns.some(p => header.includes(p))) {
      mapping.patient_type_column = headers[i]
    }
  }

  return mapping
}

/**
 * Parse date in various Austrian formats
 */
export function parseDate(dateStr: string): string | null {
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Try Austrian format (DD.MM.YYYY)
  const austrianMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (austrianMatch) {
    const [, day, month, year] = austrianMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Try US format (MM/DD/YYYY)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

/**
 * Parse sessions from CSV data
 */
export function parseSessionImport(
  csvContent: string,
  config: CSVImportConfig,
  mapping: ImportColumnMapping
): { rows: SessionImportRow[]; errors: ImportError[]; warnings: ImportWarning[] } {
  const headers = getCSVHeaders(csvContent, config.delimiter)
  const rows = parseCSV(csvContent, config)

  const sessionRows: SessionImportRow[] = []
  const errors: ImportError[] = []
  const warnings: ImportWarning[] = []

  // Find column indices
  const dateIndex = headers.indexOf(mapping.date_column)
  const therapyIndex = headers.indexOf(mapping.therapy_type_column)
  const sessionsIndex = headers.indexOf(mapping.sessions_column)
  const revenueIndex = mapping.revenue_column ? headers.indexOf(mapping.revenue_column) : -1
  const patientTypeIndex = mapping.patient_type_column ? headers.indexOf(mapping.patient_type_column) : -1
  const notesIndex = mapping.notes_column ? headers.indexOf(mapping.notes_column) : -1

  // Validate required columns exist
  if (dateIndex === -1) {
    errors.push({
      row: 0,
      field: 'date_column',
      message: `Date column "${mapping.date_column}" not found in CSV`
    })
    return { rows: [], errors, warnings }
  }
  if (therapyIndex === -1) {
    errors.push({
      row: 0,
      field: 'therapy_type_column',
      message: `Therapy type column "${mapping.therapy_type_column}" not found in CSV`
    })
    return { rows: [], errors, warnings }
  }
  if (sessionsIndex === -1) {
    errors.push({
      row: 0,
      field: 'sessions_column',
      message: `Sessions column "${mapping.sessions_column}" not found in CSV`
    })
    return { rows: [], errors, warnings }
  }

  // Parse each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // +2 because 1-indexed and we skip header

    try {
      // Parse date
      const dateStr = row[dateIndex]
      const date = parseDate(dateStr)
      if (!date) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: `Invalid date format: "${dateStr}"`,
          data: { raw: dateStr }
        })
        continue
      }

      // Parse therapy type
      const therapy_type = row[therapyIndex]?.trim()
      if (!therapy_type) {
        errors.push({
          row: rowNumber,
          field: 'therapy_type',
          message: 'Therapy type is required'
        })
        continue
      }

      // Parse sessions
      const sessionsStr = row[sessionsIndex]?.replace(',', '.')
      const sessions = parseFloat(sessionsStr)
      if (isNaN(sessions) || sessions < 0) {
        errors.push({
          row: rowNumber,
          field: 'sessions',
          message: `Invalid sessions count: "${sessionsStr}"`,
          data: { raw: sessionsStr }
        })
        continue
      }

      // Parse optional revenue
      let revenue: number | undefined
      if (revenueIndex >= 0 && row[revenueIndex]) {
        const revenueStr = row[revenueIndex].replace(',', '.').replace(/[€\s]/g, '')
        revenue = parseFloat(revenueStr)
        if (isNaN(revenue)) {
          warnings.push({
            row: rowNumber,
            message: `Invalid revenue format, will be calculated: "${row[revenueIndex]}"`,
            data: { raw: row[revenueIndex] }
          })
          revenue = undefined
        }
      }

      // Parse optional patient type
      let patient_type: 'kasse' | 'privat' | undefined
      if (patientTypeIndex >= 0 && row[patientTypeIndex]) {
        const typeStr = row[patientTypeIndex].toLowerCase()
        if (typeStr.includes('kasse') || typeStr.includes('gkk') || typeStr.includes('ögk')) {
          patient_type = 'kasse'
        } else if (typeStr.includes('privat') || typeStr.includes('wahl')) {
          patient_type = 'privat'
        }
      }

      // Parse optional notes
      const notes = notesIndex >= 0 ? row[notesIndex] : undefined

      sessionRows.push({
        date,
        therapy_type,
        sessions,
        revenue,
        patient_type,
        notes
      })
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        data: { row }
      })
    }
  }

  return { rows: sessionRows, errors, warnings }
}

/**
 * Generate preview of import data
 */
export function generateImportPreview(rows: SessionImportRow[]): ImportPreview {
  const therapy_types = [...new Set(rows.map(r => r.therapy_type))]
  const dates = rows.map(r => r.date).sort()

  return {
    valid_rows: rows.length,
    invalid_rows: 0,
    therapy_types_found: therapy_types,
    date_range: {
      start: dates[0] || '',
      end: dates[dates.length - 1] || ''
    },
    total_sessions: rows.reduce((sum, r) => sum + r.sessions, 0),
    total_revenue: rows.reduce((sum, r) => sum + (r.revenue || 0), 0),
    sample_rows: rows.slice(0, 5)
  }
}

/**
 * Generate CSV template for manual data entry
 */
export function generateSessionImportTemplate(): string {
  const header = 'Date,Therapy Type,Sessions,Revenue,Patient Type,Notes'
  const example1 = '2025-01-15,Psychotherapie,3,240,privat,Einzelsitzungen'
  const example2 = '2025-01-16,Gruppentherapie,1,120,kasse,Gruppe 5 Personen'
  const example3 = '2025-01-17,Paartherapie,2,200,privat,'

  return [header, example1, example2, example3].join('\n')
}

/**
 * Generate German/Austrian CSV template (LATIDO format)
 */
export function generateLATIDOTemplate(): string {
  const header = 'Datum,Leistung,Anzahl,Betrag,Patientenart,Notizen'
  const example1 = '15.01.2025,Psychotherapie,3,240.00,Privat,Einzelsitzungen'
  const example2 = '16.01.2025,Gruppentherapie,1,120.00,Kasse,Gruppe 5 Personen'
  const example3 = '17.01.2025,Paartherapie,2,200.00,Privat,'

  return [header, example1, example2, example3].join('\n')
}
