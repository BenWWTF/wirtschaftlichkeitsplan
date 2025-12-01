/**
 * PDF Export Utilities
 * Uses jsPDF and html2canvas for native PDF generation
 *
 * NOTE: jsPDF and html2canvas dependencies commented out due to installation issues
 * This module is not currently in use - CSV and Excel exports are preferred
 */

// import { jsPDF } from 'jspdf'
// import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export interface PDFExportOptions {
  filename?: string
  title?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  quality?: number
  margin?: number
  scale?: number
  logging?: boolean
}

export interface PDFMetadata {
  title: string
  author?: string
  subject?: string
  createdAt: Date
}

/**
 * Generate PDF from HTML element
 * NOTE: PDF export is not currently available due to missing dependencies
 * Use CSV or Excel export instead
 */
export async function generatePDF(
  _element: HTMLElement,
  _options: PDFExportOptions = {}
): Promise<Blob> {
  throw new Error(
    'PDF export is not currently available. Please use CSV or Excel export instead. ' +
    'To enable PDF export, install jspdf and html2canvas dependencies.'
  )
}

/**
 * Download PDF file
 */
export async function downloadPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
  } = options

  try {
    const blob = await generatePDF(element, options)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF download failed:', error)
    throw error
  }
}

/**
 * Generate PDF for break-even analysis
 */
export async function generateBreakEvenPDF(
  containerElement: HTMLElement,
  data: {
    fixedCosts: number
    avgContribution: number
    sessionsNeeded: number
    therapyCount: number
  }
): Promise<Blob> {
  const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de })

  return generatePDF(containerElement, {
    filename: `break-even-analysis-${format(new Date(), 'yyyy-MM-dd')}`,
    title: 'Break-Even Analysis Report',
    orientation: 'portrait',
    format: 'a4'
  })
}

/**
 * Generate PDF for monthly planning
 */
export async function generateMonthlyPlanningPDF(
  containerElement: HTMLElement,
  data: {
    month: string
    year: string
    totalRevenue?: number
    totalExpenses?: number
  }
): Promise<Blob> {
  return generatePDF(containerElement, {
    filename: `monthly-planning-${data.year}-${data.month}`,
    title: `Monthly Planning - ${data.month} ${data.year}`,
    orientation: 'landscape',
    format: 'a4'
  })
}

/**
 * Generate PDF for therapy performance
 */
export async function generateTherapyPerformancePDF(
  containerElement: HTMLElement,
  data: {
    therapyType: string
    period: string
  }
): Promise<Blob> {
  return generatePDF(containerElement, {
    filename: `therapy-performance-${data.therapyType}-${data.period}`,
    title: `Therapy Performance - ${data.therapyType}`,
    orientation: 'landscape',
    format: 'a4'
  })
}

/**
 * Generate PDF for expense report
 */
export async function generateExpenseReportPDF(
  containerElement: HTMLElement,
  data: {
    period: string
    totalAmount?: number
  }
): Promise<Blob> {
  return generatePDF(containerElement, {
    filename: `expense-report-${data.period}`,
    title: `Expense Report - ${data.period}`,
    orientation: 'portrait',
    format: 'a4'
  })
}

/**
 * Generate PDF for custom report
 */
export async function generateCustomReportPDF(
  containerElement: HTMLElement,
  reportName: string
): Promise<Blob> {
  return generatePDF(containerElement, {
    filename: `${reportName}-${format(new Date(), 'yyyy-MM-dd')}`,
    title: reportName,
    orientation: 'portrait',
    format: 'a4'
  })
}

/**
 * Validate PDF generation capabilities
 * NOTE: Always returns false since PDF dependencies are not installed
 */
export function validatePDFSupport(): boolean {
  return false
}

/**
 * Get supported PDF page formats
 */
export const PDF_PAGE_FORMATS = {
  a4: { width: 210, height: 297, name: 'A4' },
  letter: { width: 216, height: 279, name: 'Letter' },
  a3: { width: 297, height: 420, name: 'A3' }
} as const

/**
 * Get default PDF options for different report types
 */
export function getDefaultPDFOptions(reportType: string): PDFExportOptions {
  const defaults: Record<string, PDFExportOptions> = {
    'break-even': {
      orientation: 'portrait',
      format: 'a4',
      title: 'Break-Even Analysis'
    },
    'monthly-planning': {
      orientation: 'landscape',
      format: 'a4',
      title: 'Monthly Planning'
    },
    'therapy-performance': {
      orientation: 'landscape',
      format: 'a4',
      title: 'Therapy Performance'
    },
    'expense-report': {
      orientation: 'portrait',
      format: 'a4',
      title: 'Expense Report'
    },
    'summary': {
      orientation: 'portrait',
      format: 'a4',
      title: 'Summary Report'
    }
  }

  return defaults[reportType] || {
    orientation: 'portrait',
    format: 'a4'
  }
}
