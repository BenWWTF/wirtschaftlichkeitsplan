/**
 * Data Import Types
 * Supports importing session and revenue data from practice management software
 * like LATIDO, CGM, Medatixx, etc.
 */

export interface SessionImportRow {
  date: string // ISO date format YYYY-MM-DD
  therapy_type: string // Name of therapy type (e.g., "Psychotherapie", "Gruppentherapie")
  sessions: number // Number of sessions performed
  revenue?: number // Optional: revenue generated (if not provided, calculated from therapy type price)
  patient_type?: 'kasse' | 'privat' // Optional: patient type
  notes?: string // Optional: additional notes
  invoice_number?: string // Latido: Rechnungsnummer for duplicate detection
}

export interface RevenueImportRow {
  month: string // YYYY-MM format
  therapy_type: string
  planned_sessions: number
  actual_sessions: number
  planned_revenue: number
  actual_revenue: number
}

export interface ExpenseImportRow {
  date: string // YYYY-MM-DD
  category: string
  subcategory?: string
  amount: number
  description?: string
  is_recurring?: boolean
  recurrence_interval?: 'monthly' | 'quarterly' | 'yearly'
}

export interface ImportResult {
  success: boolean
  imported_count: number
  skipped_count: number
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface ImportError {
  row: number
  field?: string
  message: string
  data?: any
}

export interface ImportWarning {
  row: number
  message: string
  data?: any
}

export interface ImportPreview {
  valid_rows: number
  invalid_rows: number
  therapy_types_found: string[]
  date_range: {
    start: string
    end: string
  }
  total_sessions: number
  total_revenue: number
  sample_rows: SessionImportRow[]
}

/**
 * CSV Import Configuration
 */
export interface CSVImportConfig {
  has_header: boolean
  delimiter: ',' | ';' | '\t'
  encoding: 'utf-8' | 'latin1'
  date_format: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
}

export const DEFAULT_CSV_CONFIG: CSVImportConfig = {
  has_header: true,
  delimiter: ',',
  encoding: 'utf-8',
  date_format: 'YYYY-MM-DD'
}

/**
 * Import mapping for flexible CSV column matching
 */
export interface ImportColumnMapping {
  date_column: string
  therapy_type_column: string
  sessions_column: string
  revenue_column?: string
  patient_type_column?: string
  notes_column?: string
}

export const LATIDO_COLUMN_MAPPING: ImportColumnMapping = {
  date_column: 'Datum',
  therapy_type_column: 'Leistung',
  sessions_column: 'Anzahl',
  revenue_column: 'Betrag',
  patient_type_column: 'Patientenart'
}

export const STANDARD_COLUMN_MAPPING: ImportColumnMapping = {
  date_column: 'Date',
  therapy_type_column: 'Therapy Type',
  sessions_column: 'Sessions',
  revenue_column: 'Revenue',
  patient_type_column: 'Patient Type',
  notes_column: 'Notes'
}
