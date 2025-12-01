import type { FilterRule } from '@/components/dashboard/advanced-filter'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Build a Supabase query from filter rules
 */
export function buildFilterQuery(
  query: any,
  filters: FilterRule[],
  userId: string
) {
  // Start with user_id filter (security)
  let result = query.eq('user_id', userId)

  if (filters.length === 0) {
    return result
  }

  // Group filters by logic type
  const andFilters = filters.filter(f => f.logic === 'AND' || filters.indexOf(f) === 0)
  const orFilters = filters.filter(f => f.logic === 'OR')

  // Apply AND filters
  andFilters.forEach(filter => {
    result = applyFilterRule(result, filter)
  })

  // Apply OR filters if any
  if (orFilters.length > 0) {
    const orConditions = orFilters
      .map(filter => buildFilterCondition(filter))
      .filter(Boolean)
      .join(',')

    if (orConditions) {
      result = result.or(orConditions)
    }
  }

  return result
}

/**
 * Apply a single filter rule to a query
 */
function applyFilterRule(
  query: any,
  filter: FilterRule
) {
  const { field, operator, value, valueEnd } = filter

  switch (operator) {
    case 'eq':
      return query.eq(field, value)

    case 'gt':
      return query.gt(field, parseFloat(value))

    case 'lt':
      return query.lt(field, parseFloat(value))

    case 'gte':
      return query.gte(field, parseFloat(value))

    case 'lte':
      return query.lte(field, parseFloat(value))

    case 'between':
      return query
        .gte(field, parseFloat(value))
        .lte(field, parseFloat(valueEnd))

    case 'contains':
      return query.ilike(field, `%${value}%`)

    default:
      return query
  }
}

/**
 * Build a filter condition string for OR operations
 */
function buildFilterCondition(filter: FilterRule): string {
  const { field, operator, value, valueEnd } = filter

  switch (operator) {
    case 'eq':
      return `${field}.eq.${value}`

    case 'gt':
      return `${field}.gt.${value}`

    case 'lt':
      return `${field}.lt.${value}`

    case 'gte':
      return `${field}.gte.${value}`

    case 'lte':
      return `${field}.lte.${value}`

    case 'between':
      // For OR filters with between, we need to handle this specially
      return `and(${field}.gte.${value},${field}.lte.${valueEnd})`

    case 'contains':
      return `${field}.ilike.%${value}%`

    default:
      return ''
  }
}

/**
 * Validate filter rules before applying
 */
export function validateFilters(filters: FilterRule[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (filters.length === 0) {
    errors.push('Bitte fügen Sie mindestens einen Filter hinzu')
    return { isValid: false, errors }
  }

  filters.forEach((filter, index) => {
    // Check if value is empty
    if (!filter.value && filter.value !== 0 && filter.value !== false) {
      errors.push(`Filter ${index + 1}: Bitte geben Sie einen Wert ein`)
    }

    // Check between operator has both values
    if (filter.operator === 'between' && (!filter.valueEnd && filter.valueEnd !== 0)) {
      errors.push(`Filter ${index + 1}: Bitte geben Sie einen Endwert ein`)
    }

    // Validate numeric fields
    if (
      (filter.field === 'amount' || filter.field === 'price_range') &&
      filter.operator !== 'eq'
    ) {
      if (isNaN(parseFloat(filter.value))) {
        errors.push(`Filter ${index + 1}: Der Wert muss eine Zahl sein`)
      }
      if (filter.operator === 'between' && isNaN(parseFloat(filter.valueEnd || ''))) {
        errors.push(`Filter ${index + 1}: Der Endwert muss eine Zahl sein`)
      }
    }

    // Validate date fields
    if (filter.field === 'date' && filter.operator !== 'eq') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.value)) {
        errors.push(`Filter ${index + 1}: Ungültiges Datumsformat`)
      }
      if (filter.operator === 'between') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.valueEnd || '')) {
          errors.push(`Filter ${index + 1}: Ungültiges Datumsformat für Enddatum`)
        }
        // Validate start <= end
        if (new Date(filter.value) > new Date(filter.valueEnd || '')) {
          errors.push(`Filter ${index + 1}: Startdatum muss vor Enddatum liegen`)
        }
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Convert filters to a human-readable string
 */
export function filtersToString(filters: FilterRule[]): string {
  if (filters.length === 0) return 'Keine Filter'

  const OPERATOR_LABELS: Record<string, string> = {
    eq: 'gleich',
    gt: 'größer als',
    lt: 'kleiner als',
    gte: 'größer oder gleich',
    lte: 'kleiner oder gleich',
    between: 'zwischen',
    contains: 'enthält',
  }

  const parts = filters.map((filter, index) => {
    const operator = OPERATOR_LABELS[filter.operator] || filter.operator
    const value = filter.operator === 'between'
      ? `${filter.value} und ${filter.valueEnd}`
      : filter.value

    const prefix = index === 0 ? '' : ` ${filter.logic} `
    return `${prefix}${filter.field} ${operator} ${value}`
  })

  return parts.join('')
}

/**
 * Parse filters from URL query params
 */
export function parseFiltersFromQuery(queryString: string): FilterRule[] {
  try {
    const decoded = decodeURIComponent(queryString)
    const parsed = JSON.parse(decoded)

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch (error) {
    console.error('Error parsing filters from query:', error)
  }

  return []
}

/**
 * Serialize filters to URL query param
 */
export function serializeFiltersToQuery(filters: FilterRule[]): string {
  if (filters.length === 0) return ''

  const serialized = JSON.stringify(filters)
  return encodeURIComponent(serialized)
}

/**
 * Calculate filter complexity score (for analytics)
 */
export function calculateFilterComplexity(filters: FilterRule[]): number {
  let score = 0

  filters.forEach(filter => {
    // Base score per filter
    score += 1

    // Additional score for complex operators
    if (filter.operator === 'between') score += 1
    if (filter.operator === 'contains') score += 0.5

    // Additional score for OR logic
    if (filter.logic === 'OR') score += 0.5
  })

  return Math.round(score * 10) / 10
}
