/**
 * Validate YYYY-MM format for month strings
 */
export function validateMonthFormat(month: string): boolean {
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(month)) {
    return false
  }

  const [year, monthNum] = month.split('-').map(Number)
  return monthNum >= 1 && monthNum <= 12
}

/**
 * Validate YYYY-MM-DD format for date strings
 */
export function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }

  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString().startsWith(date)
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Safe date string parsing with validation
 */
export function parseAndValidateDate(dateStr: string, separator: string = '-'): Date | null {
  try {
    if (separator === '.') {
      // German format: DD.MM.YYYY
      const parts = dateStr.split('.')
      if (parts.length !== 3) {
        return null
      }

      const [day, month, year] = parts.map(p => p.trim())
      if (!day || !month || !year) {
        return null
      }

      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      if (!validateDateFormat(isoDate)) {
        return null
      }

      return new Date(isoDate)
    } else {
      // ISO format: YYYY-MM-DD
      if (!validateDateFormat(dateStr)) {
        return null
      }
      return new Date(dateStr)
    }
  } catch (error) {
    return null
  }
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: number, fieldName: string = 'value'): boolean {
  if (!Number.isFinite(value)) {
    return false
  }

  if (value <= 0) {
    return false
  }

  return true
}

/**
 * Validate non-negative number
 */
export function validateNonNegativeNumber(value: number, fieldName: string = 'value'): boolean {
  if (!Number.isFinite(value)) {
    return false
  }

  if (value < 0) {
    return false
  }

  return true
}

/**
 * Validate string is not empty after trimming
 */
export function validateNonEmptyString(value: string | null | undefined, fieldName: string = 'value'): boolean {
  if (!value || !value.trim()) {
    return false
  }

  return true
}
