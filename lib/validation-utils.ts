'use client'

import { ZodSchema } from 'zod'

/**
 * Real-time validation result
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
  isDirty: boolean
  isTouched: boolean
}

/**
 * Validates a single field in real-time using a Zod schema
 * Returns validation result with error message if validation fails
 */
export async function validateFieldRealtime(
  schema: ZodSchema,
  value: unknown,
  fieldName: string
): Promise<ValidationResult> {
  try {
    // Create a partial object to validate just this field
    const partialData = { [fieldName]: value }

    // Try to parse the entire schema, but we'll catch partial validation error
    const result = schema.safeParse(partialData)

    if (!result.success) {
      // Extract the first error message from the field
      const fieldIssues = result.error.issues.filter((issue) =>
        issue.path.includes(fieldName)
      )
      const errorMessage = fieldIssues.length > 0
        ? fieldIssues[0].message
        : 'Invalid input'
      return {
        isValid: false,
        error: errorMessage,
        isDirty: true,
        isTouched: true
      }
    }

    return {
      isValid: true,
      isDirty: true,
      isTouched: true
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Validation error',
      isDirty: true,
      isTouched: true
    }
  }
}

/**
 * Debounce validation to avoid excessive re-renders
 * Waits for user to stop typing before validating
 */
export function createDebouncedValidator(
  validatorFn: (value: unknown) => Promise<ValidationResult>,
  delayMs = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  return async (value: unknown): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        const result = await validatorFn(value)
        resolve(result)
      }, delayMs)
    })
  }
}

/**
 * Get validation state classes for visual feedback
 */
export function getValidationClasses(
  isValid: boolean | undefined,
  isTouched: boolean,
  isDirty: boolean
) {
  if (!isDirty || !isTouched) {
    return {
      borderColor: '',
      textColor: '',
      icon: ''
    }
  }

  if (isValid) {
    return {
      borderColor: 'border-green-500 focus-visible:ring-green-500',
      textColor: 'text-green-600',
      icon: '✓'
    }
  }

  return {
    borderColor: 'border-red-600 focus-visible:ring-red-600',
    textColor: 'text-red-600',
    icon: '✗'
  }
}

/**
 * Sanitize numeric input to prevent invalid values
 */
export function sanitizeNumber(value: string): string {
  // Remove any non-numeric characters except decimal point and minus
  return value.replace(/[^\d.%-]/g, '')
}

/**
 * Validate number is within bounds
 */
export function validateNumberBounds(
  value: number,
  min?: number,
  max?: number
): string | null {
  if (min !== undefined && value < min) {
    return `Muss mindestens ${min} sein`
  }
  if (max !== undefined && value > max) {
    return `Darf höchstens ${max} sein`
  }
  return null
}

/**
 * Check if a string meets minimum length requirement
 */
export function validateMinLength(value: string, min: number): string | null {
  if (value.length < min) {
    return `Muss mindestens ${min} Zeichen lang sein`
  }
  return null
}

/**
 * Check if a string is within maximum length requirement
 */
export function validateMaxLength(value: string, max: number): string | null {
  if (value.length > max) {
    return `Darf höchstens ${max} Zeichen lang sein`
  }
  return null
}

/**
 * Validate email format
 */
export function validateEmail(value: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Ungültige E-Mail-Adresse'
  }
  return null
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return 'Dieses Feld ist erforderlich'
  }
  return null
}

/**
 * Combine multiple validation functions
 */
export function composeValidators(
  ...validators: Array<(value: unknown) => string | null>
) {
  return (value: unknown): string | null => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) {
        return error
      }
    }
    return null
  }
}
