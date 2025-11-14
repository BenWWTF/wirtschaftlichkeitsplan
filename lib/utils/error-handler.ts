/**
 * Standardized error handling utility for server actions
 * Ensures consistent error response format and logging across the application
 */

import { logError } from './logger'

/**
 * Standard action response format
 */
export interface ActionResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
}

/**
 * Error categories for consistent error handling
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = 'Ein Fehler ist aufgetreten'
): string {
  if (error instanceof Error) {
    // Suppress database/internal details from user-facing messages
    if (error.message.includes('Row level security')) {
      return 'Sie haben keine Berechtigung für diese Operation'
    }
    if (error.message.includes('unique')) {
      return 'Dieser Datensatz existiert bereits'
    }
    if (error.message.includes('foreign key')) {
      return 'Abhängige Daten verhindern diese Operation'
    }
    if (error.message.includes('Dynamic server usage')) {
      return 'Die Seite konnte nicht geladen werden'
    }
    // Return generic message to prevent info leakage
    return defaultMessage
  }
  return defaultMessage
}

/**
 * Handle action errors with consistent logging and response format
 */
export function handleActionError(
  error: unknown,
  functionName: string,
  context: Record<string, any> = {},
  userMessage?: string
): ActionResponse {
  const defaultMessage = userMessage || 'Ein Fehler ist aufgetreten'

  // Log the error server-side
  logError(functionName, 'Action error occurred', error, context)

  // Return user-friendly message
  return {
    success: false,
    error: getErrorMessage(error, defaultMessage),
  }
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  functionName: string,
  fieldName: string,
  value: any
): ActionResponse {
  const error = new Error(`Validation failed: ${fieldName}`)
  logError(functionName, 'Validation error', error, {
    fieldName,
    value,
  })

  return {
    success: false,
    error: `Validierungsfehler: ${fieldName}`,
  }
}

/**
 * Handle authentication/authorization errors
 */
export function handleAuthError(
  functionName: string,
  errorType: 'NOT_AUTHENTICATED' | 'NOT_AUTHORIZED' = 'NOT_AUTHENTICATED'
): ActionResponse {
  const message = errorType === 'NOT_AUTHENTICATED'
    ? 'Benutzer konnte nicht authentifiziert werden'
    : 'Sie haben keine Berechtigung für diese Operation'

  const error = new Error(errorType)
  logError(functionName, 'Authentication error', error, { errorType })

  return {
    success: false,
    error: message,
  }
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  functionName: string,
  resourceType: string,
  id?: string
): ActionResponse {
  const error = new Error(`${resourceType} not found`)
  logError(functionName, 'Resource not found', error, {
    resourceType,
    id,
  })

  return {
    success: false,
    error: `${resourceType} nicht gefunden`,
  }
}

/**
 * Wrap try-catch with standardized error handling
 * Usage: const result = await wrapAction(() => yourAsyncFunction(), 'functionName')
 */
export async function wrapAction<T>(
  action: () => Promise<T>,
  functionName: string,
  userErrorMessage?: string
): Promise<ActionResponse<T>> {
  try {
    const data = await action()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return handleActionError(error, functionName, {}, userErrorMessage)
  }
}

/**
 * Validate required field with consistent error handling
 */
export function validateRequired(
  value: any,
  fieldName: string,
  functionName: string
): boolean {
  if (!value || (typeof value === 'string' && !value.trim())) {
    handleValidationError(functionName, fieldName, value)
    return false
  }
  return true
}

/**
 * Validate numeric field with consistent error handling
 */
export function validateNumber(
  value: any,
  fieldName: string,
  functionName: string,
  options: {
    min?: number
    max?: number
    integer?: boolean
  } = {}
): boolean {
  if (typeof value !== 'number' || !isFinite(value)) {
    handleValidationError(functionName, fieldName, value)
    return false
  }

  if (options.min !== undefined && value < options.min) {
    const error = new Error(`${fieldName} must be >= ${options.min}`)
    logError(functionName, 'Validation error', error, { fieldName, value })
    return false
  }

  if (options.max !== undefined && value > options.max) {
    const error = new Error(`${fieldName} must be <= ${options.max}`)
    logError(functionName, 'Validation error', error, { fieldName, value })
    return false
  }

  if (options.integer && !Number.isInteger(value)) {
    handleValidationError(functionName, fieldName, value)
    return false
  }

  return true
}

/**
 * Supabase error response format
 */
export interface SupabaseError {
  code?: string
  message?: string
  status?: number
  details?: string
  hint?: string
}

/**
 * Handle Supabase-specific errors
 */
export function handleSupabaseError(
  error: any,
  functionName: string,
  defaultMessage: string = 'Datenbankoperation fehlgeschlagen'
): ActionResponse {
  const supabaseError: SupabaseError = {
    code: error?.code,
    message: error?.message,
    status: error?.status,
    details: error?.details,
    hint: error?.hint,
  }

  logError(functionName, 'Supabase error', error, supabaseError)

  // Map common Supabase errors to user-friendly messages
  if (error?.code === '23505') {
    // Unique constraint violation
    return {
      success: false,
      error: 'Dieser Datensatz existiert bereits',
    }
  }

  if (error?.code === '23503') {
    // Foreign key violation
    return {
      success: false,
      error: 'Abhängige Daten verhindern diese Operation',
    }
  }

  if (error?.code === '42P01') {
    // Table not found
    return {
      success: false,
      error: defaultMessage,
    }
  }

  return {
    success: false,
    error: getErrorMessage(error, defaultMessage),
  }
}
