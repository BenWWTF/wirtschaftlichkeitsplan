/**
 * Server-side logger utility to prevent sensitive errors from leaking to client
 * All errors are logged server-side only
 *
 * NOTE: This is a shared utility module imported by server actions.
 * Functions here don't need 'use server' since they're called by actions.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  error?: string
  details?: Record<string, any>
}

/**
 * Log error - only visible on server, never exposed to client
 */
export function logError(context: string, message: string, error?: unknown, details?: Record<string, any>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    context,
    message,
    error: error instanceof Error ? error.message : String(error),
    details
  }

  // Log to server-side only (stdout/file)
  console.error(`[${logEntry.timestamp}] [${context}]`, message, {
    error: logEntry.error,
    ...details
  })
}

/**
 * Log warning - only visible on server
 */
export function logWarn(context: string, message: string, details?: Record<string, any>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.WARN,
    context,
    message,
    details
  }

  console.warn(`[${logEntry.timestamp}] [${context}]`, message, details)
}

/**
 * Log info - only visible on server
 */
export function logInfo(context: string, message: string, details?: Record<string, any>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    context,
    message,
    details
  }

  console.log(`[${logEntry.timestamp}] [${context}]`, message, details)
}

/**
 * Log debug info - only visible on server
 */
export function logDebug(context: string, message: string, details?: Record<string, any>): void {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    context,
    message,
    details
  }

  // Only log debug in development
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${logEntry.timestamp}] [${context}]`, message, details)
  }
}
