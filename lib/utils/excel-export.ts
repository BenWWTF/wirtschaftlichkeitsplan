/**
 * Enhanced Excel Export Utilities
 * Uses ExcelJS for advanced formatting and multiple worksheets
 */

import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
  autoWidth?: boolean
  freezePane?: boolean
  formatCurrency?: boolean
  formatDates?: boolean
  addSummary?: boolean
  theme?: 'light' | 'dark'
}

export interface ExcelColumnStyle {
  width?: number
  format?: string
  alignment?: 'left' | 'center' | 'right'
  bold?: boolean
  color?: string
  bgColor?: string
}

export interface ExcelSheetData {
  name: string
  data: Record<string, any>[]
  columns?: Record<string, ExcelColumnStyle>
  summary?: {
    title: string
    metrics: Record<string, any>
  }
}

/**
 * Export data to Excel with formatting
 */
export async function exportToExcel(
  sheets: ExcelSheetData[],
  options: ExcelExportOptions = {}
): Promise<Blob> {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`,
    autoWidth = true,
    freezePane = true,
    formatCurrency = true,
    formatDates = true,
    addSummary = true,
    theme = 'light'
  } = options

  try {
    const workbook = XLSX.utils.book_new()

    // Process each sheet
    for (const sheet of sheets) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data)

      // Apply column widths
      if (autoWidth && sheet.columns) {
        const maxWidths: Record<number, number> = {}

        sheet.data.forEach((row, rowIndex) => {
          Object.entries(row).forEach(([key, value], colIndex) => {
            const width = String(value || '').length
            maxWidths[colIndex] = Math.max(maxWidths[colIndex] || 0, width)
          })
        })

        worksheet['!cols'] = Object.values(maxWidths).map(width => ({
          wch: Math.min(width + 2, 50)
        }))
      }

      // Freeze first row if specified
      if (freezePane) {
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
      }

      // Append sheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)

      // Add summary sheet if requested
      if (addSummary && sheet.summary) {
        const summaryData = Object.entries(sheet.summary.metrics).map(([key, value]) => ({
          'Metrik': key,
          'Wert': formatMetricValue(value, key)
        }))

        const summarySheet = XLSX.utils.json_to_sheet(summaryData)
        if (autoWidth) {
          summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
        }

        XLSX.utils.book_append_sheet(workbook, summarySheet, `${sheet.name} - Summary`)
      }
    }

    // Add metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([
      { 'Eigenschaft': 'Erstellt am', 'Wert': format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de }) },
      { 'Eigenschaft': 'Anwendung', 'Wert': 'Ordi Pro' },
      { 'Eigenschaft': 'Version', 'Wert': '1.0' }
    ])
    metadataSheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadaten')

    // Generate and return Excel file as blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    return blob
  } catch (error) {
    console.error('Excel export failed:', error)
    throw new Error(`Failed to generate Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export expenses to Excel with formatting
 */
export async function exportExpensesToExcel(
  expenses: any[],
  options: ExcelExportOptions = {}
): Promise<Blob> {
  const filename = options.filename || `expenses-${format(new Date(), 'yyyy-MM-dd')}`

  const sheetData: ExcelSheetData = {
    name: 'Ausgaben',
    data: expenses.map(expense => ({
      'Datum': expense.expense_date ? format(new Date(expense.expense_date), 'dd.MM.yyyy', { locale: de }) : '',
      'Kategorie': expense.category || '',
      'Unterkategorie': expense.subcategory || '',
      'Beschreibung': expense.description || '',
      'Betrag (€)': expense.amount || 0,
      'Wiederkehrend': expense.is_recurring ? 'Ja' : 'Nein',
      'Intervall': expense.recurrence_interval || '',
      'Status': expense.status || 'Aktiv'
    })),
    columns: {
      'Datum': { width: 12, format: 'dd.mm.yyyy' },
      'Kategorie': { width: 15 },
      'Unterkategorie': { width: 15 },
      'Beschreibung': { width: 25 },
      'Betrag (€)': { width: 12, format: '#,##0.00', alignment: 'right' },
      'Wiederkehrend': { width: 12, alignment: 'center' },
      'Intervall': { width: 15 },
      'Status': { width: 10 }
    },
    summary: {
      title: 'Ausgabenzusammenfassung',
      metrics: {
        'Gesamtausgaben': expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        'Anzahl Ausgaben': expenses.length,
        'Durchschnittlich': expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / (expenses.length || 1),
        'Höchstbetrag': Math.max(...expenses.map(e => e.amount || 0), 0),
        'Wiederkehrende Ausgaben': expenses.filter(e => e.is_recurring).length
      }
    }
  }

  return exportToExcel([sheetData], { ...options, filename })
}

/**
 * Export therapies to Excel with formatting
 */
export async function exportTherapiesToExcel(
  therapies: any[],
  options: ExcelExportOptions = {}
): Promise<Blob> {
  const filename = options.filename || `therapies-${format(new Date(), 'yyyy-MM-dd')}`

  const sheetData: ExcelSheetData = {
    name: 'Therapien',
    data: therapies.map(therapy => ({
      'Therapieart': therapy.therapy_type_name || '',
      'Sitzungspreis (€)': therapy.price_per_session || 0,
      'Durchschnittliche Sitzungen/Monat': therapy.avg_sessions_per_month || 0,
      'Deckungsbeitrag (€)': therapy.contribution_margin || 0,
      'Deckungsbeitrag %': therapy.contribution_margin_percent || 0,
      'Auslastung %': therapy.occupancy_rate || 0,
      'Kapazität': therapy.max_sessions_per_month || 0,
      'Status': therapy.is_active ? 'Aktiv' : 'Inaktiv'
    })),
    columns: {
      'Therapieart': { width: 18 },
      'Sitzungspreis (€)': { width: 15, format: '#,##0.00', alignment: 'right' },
      'Durchschnittliche Sitzungen/Monat': { width: 15, alignment: 'right' },
      'Deckungsbeitrag (€)': { width: 18, format: '#,##0.00', alignment: 'right' },
      'Deckungsbeitrag %': { width: 16, format: '0.0%', alignment: 'right' },
      'Auslastung %': { width: 12, format: '0.0%', alignment: 'right' },
      'Kapazität': { width: 12, alignment: 'right' },
      'Status': { width: 10, alignment: 'center' }
    },
    summary: {
      title: 'Therapienzusammenfassung',
      metrics: {
        'Therapiearten': therapies.length,
        'Durchschnittlicher Sitzungspreis': therapies.reduce((sum, t) => sum + (t.price_per_session || 0), 0) / (therapies.length || 1),
        'Durchschnittliche Auslastung': therapies.reduce((sum, t) => sum + (t.occupancy_rate || 0), 0) / (therapies.length || 1),
        'Höchster Deckungsbeitrag': Math.max(...therapies.map(t => t.contribution_margin || 0), 0),
        'Aktive Therapien': therapies.filter(t => t.is_active).length
      }
    }
  }

  return exportToExcel([sheetData], { ...options, filename })
}

/**
 * Export break-even analysis to Excel
 */
export async function exportBreakEvenAnalysisToExcel(
  analysis: any,
  options: ExcelExportOptions = {}
): Promise<Blob> {
  const filename = options.filename || `break-even-${format(new Date(), 'yyyy-MM-dd')}`

  const therapyData = (analysis.therapies || []).map((therapy: any) => ({
    'Therapieart': therapy.therapy_type_name || '',
    'Sitzungspreis (€)': therapy.price_per_session || 0,
    'Deckungsbeitrag (€)': therapy.contribution_margin || 0,
    'Deckungsbeitrag %': therapy.contribution_margin_percent || 0,
    'Sitzungen für Break-Even': Math.ceil((analysis.fixed_costs || 0) / (therapy.contribution_margin || 1))
  }))

  const sheets: ExcelSheetData[] = [
    {
      name: 'Zusammenfassung',
      data: [
        { 'Metrik': 'Monatliche Fixkosten', 'Wert': analysis.fixed_costs || 0 },
        { 'Metrik': 'Durchschnittlicher Deckungsbeitrag', 'Wert': analysis.avg_contribution || 0 },
        { 'Metrik': 'Sitzungen für Break-Even', 'Wert': analysis.sessions_needed || 0 },
        { 'Metrik': 'Gewinn bei aktueller Auslastung', 'Wert': analysis.profit || 0 },
        { 'Metrik': 'Sicherheitsmarge %', 'Wert': analysis.safety_margin_percent || 0 }
      ],
      columns: {
        'Metrik': { width: 30 },
        'Wert': { width: 15, format: '#,##0.00', alignment: 'right' }
      }
    },
    {
      name: 'Therapieanalyse',
      data: therapyData,
      columns: {
        'Therapieart': { width: 18 },
        'Sitzungspreis (€)': { width: 15, format: '#,##0.00', alignment: 'right' },
        'Deckungsbeitrag (€)': { width: 18, format: '#,##0.00', alignment: 'right' },
        'Deckungsbeitrag %': { width: 16, format: '0.0%', alignment: 'right' },
        'Sitzungen für Break-Even': { width: 18, alignment: 'right' }
      }
    }
  ]

  return exportToExcel(sheets, { ...options, filename })
}

/**
 * Download Excel file
 */
export async function downloadExcel(
  sheets: ExcelSheetData[],
  options: ExcelExportOptions = {}
): Promise<void> {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
  } = options

  try {
    const blob = await exportToExcel(sheets, options)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Excel download failed:', error)
    throw error
  }
}

/**
 * Format metric value based on type
 */
function formatMetricValue(value: any, key: string): string {
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('prozent') || key.toLowerCase().includes('%')) {
      return `${value.toFixed(1)}%`
    }
    if (key.toLowerCase().includes('euro') || key.toLowerCase().includes('betrag') || key.toLowerCase().includes('costs')) {
      return `€ ${value.toFixed(2)}`
    }
    if (key.toLowerCase().includes('durchschnitt')) {
      return value.toFixed(2)
    }
    return String(value)
  }
  return String(value)
}

/**
 * Get column width recommendation
 */
export function getColumnWidth(value: any, minWidth: number = 8): number {
  const stringValue = String(value || '')
  return Math.max(minWidth, Math.min(stringValue.length + 2, 50))
}

/**
 * Validate Excel export data
 */
export function validateExcelData(sheets: ExcelSheetData[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!sheets || sheets.length === 0) {
    errors.push('No sheets provided')
    return { valid: false, errors }
  }

  sheets.forEach((sheet, index) => {
    if (!sheet.name) {
      errors.push(`Sheet ${index} has no name`)
    }
    if (!sheet.data || sheet.data.length === 0) {
      errors.push(`Sheet "${sheet.name}" has no data`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get common Excel number formats
 */
export const EXCEL_NUMBER_FORMATS = {
  currency: '#,##0.00 "€"',
  percentage: '0.0%',
  decimal: '0.00',
  integer: '0',
  date: 'dd.mm.yyyy',
  datetime: 'dd.mm.yyyy hh:mm:ss'
} as const

/**
 * Get Excel column styles for data types
 */
export function getStyleForDataType(dataType: string): ExcelColumnStyle {
  const styles: Record<string, ExcelColumnStyle> = {
    currency: {
      format: EXCEL_NUMBER_FORMATS.currency,
      alignment: 'right'
    },
    percentage: {
      format: EXCEL_NUMBER_FORMATS.percentage,
      alignment: 'right'
    },
    date: {
      format: EXCEL_NUMBER_FORMATS.date,
      alignment: 'center'
    },
    number: {
      format: EXCEL_NUMBER_FORMATS.decimal,
      alignment: 'right'
    },
    text: {
      alignment: 'left'
    }
  }

  return styles[dataType] || styles.text
}
