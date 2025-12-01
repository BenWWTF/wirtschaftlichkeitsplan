/**
 * CSV Export Utilities
 * Support for custom delimiters, encodings, and formatting options
 */

import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export type CSVDelimiter = ',' | ';' | '\t' | '|'
export type CSVEncoding = 'utf-8' | 'utf-8-bom' | 'iso-8859-1'
export type CSVQuoteStyle = 'double' | 'single' | 'none'
export type CSVDateFormat = 'dd.MM.yyyy' | 'yyyy-MM-dd' | 'dd/MM/yyyy'

export interface CSVExportOptions {
  filename?: string
  delimiter?: CSVDelimiter
  encoding?: CSVEncoding
  includeHeaders?: boolean
  dateFormat?: CSVDateFormat
  numberFormat?: 'comma' | 'period'
  quoteStyle?: CSVQuoteStyle
  quoteAllFields?: boolean
  lineEnding?: 'CRLF' | 'LF'
}

export interface CSVColumnMapping {
  key: string
  label: string
  type?: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  format?: string
}

/**
 * Export data to CSV with custom options
 */
export function exportToCSV(
  data: Record<string, any>[],
  options: CSVExportOptions = {}
): string {
  const {
    delimiter = ',',
    encoding = 'utf-8',
    includeHeaders = true,
    dateFormat = 'dd.MM.yyyy',
    numberFormat = 'comma',
    quoteStyle = 'double',
    quoteAllFields = false,
    lineEnding = 'CRLF'
  } = options

  if (!data || data.length === 0) {
    return ''
  }

  // Get headers from first row
  const headers = Object.keys(data[0])
  const quote = quoteStyle === 'single' ? "'" : quoteStyle === 'double' ? '"' : ''
  const eol = lineEnding === 'CRLF' ? '\r\n' : '\n'

  // Build CSV content
  let csv = ''

  // Add headers if requested
  if (includeHeaders) {
    csv += formatCSVRow(headers, quote, delimiter, quoteAllFields) + eol
  }

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header]
      return formatCSVValue(value, { dateFormat, numberFormat })
    })
    csv += formatCSVRow(values, quote, delimiter, quoteAllFields) + eol
  }

  return csv
}

/**
 * Export expenses to CSV
 */
export function exportExpensesToCSV(
  expenses: any[],
  options: CSVExportOptions = {}
): string {
  const filename = options.filename || `expenses-${format(new Date(), 'yyyy-MM-dd')}`

  const data = expenses.map(expense => ({
    'Datum': expense.expense_date || '',
    'Kategorie': expense.category || '',
    'Unterkategorie': expense.subcategory || '',
    'Beschreibung': expense.description || '',
    'Betrag': expense.amount || 0,
    'Wiederkehrend': expense.is_recurring ? 'Ja' : 'Nein',
    'Intervall': expense.recurrence_interval || '',
    'Status': expense.status || 'Aktiv'
  }))

  return exportToCSV(data, { ...options, filename })
}

/**
 * Export therapies to CSV
 */
export function exportTherapiesToCSV(
  therapies: any[],
  options: CSVExportOptions = {}
): string {
  const filename = options.filename || `therapies-${format(new Date(), 'yyyy-MM-dd')}`

  const data = therapies.map(therapy => ({
    'Therapieart': therapy.therapy_type_name || '',
    'Sitzungspreis': therapy.price_per_session || 0,
    'Deckungsbeitrag': therapy.contribution_margin || 0,
    'Deckungsbeitrag %': therapy.contribution_margin_percent || 0,
    'Auslastung %': therapy.occupancy_rate || 0,
    'Durchschn. Sitzungen/Monat': therapy.avg_sessions_per_month || 0,
    'Status': therapy.is_active ? 'Aktiv' : 'Inaktiv'
  }))

  return exportToCSV(data, { ...options, filename })
}

/**
 * Export break-even analysis to CSV
 */
export function exportBreakEvenAnalysisToCSV(
  analysis: any,
  options: CSVExportOptions = {}
): string {
  const filename = options.filename || `break-even-${format(new Date(), 'yyyy-MM-dd')}`

  // Summary data
  const summaryData = [
    {
      'Metrik': 'Monatliche Fixkosten',
      'Wert': analysis.fixed_costs || 0,
      'Einheit': 'EUR'
    },
    {
      'Metrik': 'Durchschnittlicher Deckungsbeitrag',
      'Wert': analysis.avg_contribution || 0,
      'Einheit': 'EUR'
    },
    {
      'Metrik': 'Sitzungen für Break-Even',
      'Wert': analysis.sessions_needed || 0,
      'Einheit': 'Sitzungen'
    },
    {
      'Metrik': 'Gewinn bei aktueller Auslastung',
      'Wert': analysis.profit || 0,
      'Einheit': 'EUR'
    }
  ]

  // Add therapy breakdown
  const therapyData = (analysis.therapies || []).map((therapy: any) => ({
    'Therapieart': therapy.therapy_type_name || '',
    'Sitzungspreis': therapy.price_per_session || 0,
    'Deckungsbeitrag': therapy.contribution_margin || 0,
    'Deckungsbeitrag %': therapy.contribution_margin_percent || 0
  }))

  // Combine data with section headers
  let csv = 'BREAK-EVEN ANALYSE\n'
  csv += format(new Date(), 'dd.MM.yyyy', { locale: de }) + '\n\n'

  csv += 'ZUSAMMENFASSUNG\n'
  csv += exportToCSV(summaryData, { ...options, includeHeaders: true })

  csv += '\nTHERAPIEARTEN\n'
  csv += exportToCSV(therapyData, { ...options, includeHeaders: true })

  return csv
}

/**
 * Export monthly results to CSV
 */
export function exportMonthlyResultsToCSV(
  results: any[],
  options: CSVExportOptions = {}
): string {
  const filename = options.filename || `monthly-results-${format(new Date(), 'yyyy-MM-dd')}`

  const data = results.map(result => ({
    'Monat': result.month || '',
    'Jahr': result.year || '',
    'Geplante Sitzungen': result.planned_sessions || 0,
    'Tatsächliche Sitzungen': result.actual_sessions || 0,
    'Geplanter Umsatz': result.planned_revenue || 0,
    'Tatsächlicher Umsatz': result.actual_revenue || 0,
    'Abweichung': result.variance || 0,
    'Abweichung %': result.variance_percent || 0
  }))

  return exportToCSV(data, { ...options, filename })
}

/**
 * Download CSV file
 */
export function downloadCSV(
  data: Record<string, any>[],
  options: CSVExportOptions = {}
): void {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
  } = options

  try {
    const csv = exportToCSV(data, options)
    const encodedCSV = encodeCSV(csv, options.encoding)
    // Ensure we have a proper ArrayBuffer for Blob compatibility
    const blobPart = typeof encodedCSV === 'string' ? encodedCSV : new Uint8Array(encodedCSV)
    const blob = new Blob([blobPart], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('CSV download failed:', error)
    throw error
  }
}

/**
 * Format CSV value based on type
 */
function formatCSVValue(value: any, options: { dateFormat: CSVDateFormat; numberFormat: 'comma' | 'period' }): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return format(value, options.dateFormat, { locale: de })
  }

  if (typeof value === 'number') {
    const separator = options.numberFormat === 'comma' ? ',' : '.'
    const decimalSeparator = options.numberFormat === 'comma' ? ',' : '.'
    const formatted = value.toFixed(2).replace('.', decimalSeparator)
    return formatted
  }

  if (typeof value === 'boolean') {
    return value ? 'Ja' : 'Nein'
  }

  return String(value)
}

/**
 * Format CSV row with proper quoting and escaping
 */
function formatCSVRow(
  values: any[],
  quote: string,
  delimiter: CSVDelimiter,
  quoteAllFields: boolean
): string {
  return values
    .map(value => {
      const stringValue = String(value || '')
      const needsQuote =
        quoteAllFields ||
        stringValue.includes(delimiter) ||
        stringValue.includes(quote) ||
        stringValue.includes('\n') ||
        stringValue.includes('\r')

      if (needsQuote && quote) {
        return quote + stringValue.replace(new RegExp(quote, 'g'), quote + quote) + quote
      }

      return stringValue
    })
    .join(delimiter)
}

/**
 * Encode CSV with specified encoding
 */
function encodeCSV(csv: string, encoding: CSVEncoding = 'utf-8'): string | Uint8Array {
  const encoder = new TextEncoder()

  if (encoding === 'utf-8-bom') {
    const utf8Encoded = encoder.encode(csv)
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const combined = new Uint8Array(bom.length + utf8Encoded.length)
    combined.set(bom)
    combined.set(utf8Encoded, bom.length)
    return combined
  }

  if (encoding === 'iso-8859-1') {
    // Simple ISO-8859-1 encoding (limited character set)
    let result = ''
    for (let i = 0; i < csv.length; i++) {
      const charCode = csv.charCodeAt(i)
      if (charCode <= 255) {
        result += csv[i]
      } else {
        // Replace unsupported characters
        result += '?'
      }
    }
    return result
  }

  return csv
}

/**
 * Parse CSV content back to objects
 */
export function parseCSVContent(
  content: string,
  options: Partial<CSVExportOptions> = {}
): Record<string, any>[] {
  const {
    delimiter = ',',
    includeHeaders = true
  } = options

  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const startIndex = includeHeaders ? 1 : 0
  const headers = includeHeaders ? parseCSVLine(lines[0], delimiter) : []

  const data: Record<string, any>[] = []

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    const row: Record<string, any> = {}

    if (includeHeaders) {
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
    } else {
      values.forEach((value, index) => {
        row[`Column_${index + 1}`] = value
      })
    }

    data.push(row)
  }

  return data
}

/**
 * Parse single CSV line
 */
function parseCSVLine(line: string, delimiter: CSVDelimiter): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false
  let quoteChar = ''

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (!insideQuotes && (char === '"' || char === "'")) {
      insideQuotes = true
      quoteChar = char
    } else if (insideQuotes && char === quoteChar && line[i + 1] === quoteChar) {
      // Escaped quote
      current += quoteChar
      i++
    } else if (insideQuotes && char === quoteChar) {
      insideQuotes = false
    } else if (!insideQuotes && char === delimiter) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Validate CSV data
 */
export function validateCSVData(data: Record<string, any>[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data || data.length === 0) {
    errors.push('No data provided')
    return { valid: false, errors }
  }

  // Check for empty rows
  const emptyRows = data.filter(row => Object.values(row).every(v => !v))
  if (emptyRows.length > 0) {
    errors.push(`Found ${emptyRows.length} empty rows`)
  }

  // Check for consistent column count
  const headerCount = Object.keys(data[0]).length
  for (let i = 0; i < data.length; i++) {
    if (Object.keys(data[i]).length !== headerCount) {
      errors.push(`Row ${i} has inconsistent column count`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get delimiter names for UI
 */
export const CSV_DELIMITERS = {
  ',': 'Comma (,)',
  ';': 'Semicolon (;)',
  '\t': 'Tab',
  '|': 'Pipe (|)'
} as const

/**
 * Get encoding names for UI
 */
export const CSV_ENCODINGS = {
  'utf-8': 'UTF-8',
  'utf-8-bom': 'UTF-8 with BOM',
  'iso-8859-1': 'ISO-8859-1 (Latin-1)'
} as const

/**
 * Get date format names for UI
 */
export const CSV_DATE_FORMATS = {
  'dd.MM.yyyy': 'German (DD.MM.YYYY)',
  'yyyy-MM-dd': 'ISO (YYYY-MM-DD)',
  'dd/MM/yyyy': 'UK (DD/MM/YYYY)'
} as const
