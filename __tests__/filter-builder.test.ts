import {
  buildFilterQuery,
  validateFilters,
  filtersToString,
  parseFiltersFromQuery,
  serializeFiltersToQuery,
  calculateFilterComplexity,
} from '@/lib/utils/filter-builder'
import type { FilterRule } from '@/components/dashboard/advanced-filter'

describe('filter-builder', () => {
  const mockFilters: FilterRule[] = [
    {
      id: 'filter-1',
      field: 'category',
      operator: 'eq',
      value: 'Büroausstattung',
      logic: 'AND',
    },
    {
      id: 'filter-2',
      field: 'amount',
      operator: 'between',
      value: '100',
      valueEnd: '500',
      logic: 'AND',
    },
  ]

  describe('validateFilters', () => {
    it('should validate valid filters', () => {
      const result = validateFilters(mockFilters)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty filters array', () => {
      const result = validateFilters([])
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing filter values', () => {
      const invalidFilters: FilterRule[] = [
        {
          id: 'filter-1',
          field: 'category',
          operator: 'eq',
          value: '',
          logic: 'AND',
        },
      ]
      const result = validateFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Wert'))).toBe(true)
    })

    it('should validate numeric fields', () => {
      const invalidFilters: FilterRule[] = [
        {
          id: 'filter-1',
          field: 'amount',
          operator: 'gt',
          value: 'not-a-number',
          logic: 'AND',
        },
      ]
      const result = validateFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Zahl'))).toBe(true)
    })

    it('should validate date fields', () => {
      const invalidFilters: FilterRule[] = [
        {
          id: 'filter-1',
          field: 'date',
          operator: 'eq',
          value: '2025/01/15', // Wrong format
          logic: 'AND',
        },
      ]
      const result = validateFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Datumsformat'))).toBe(true)
    })

    it('should validate between operator has both values', () => {
      const invalidFilters: FilterRule[] = [
        {
          id: 'filter-1',
          field: 'amount',
          operator: 'between',
          value: '100',
          logic: 'AND',
        },
      ]
      const result = validateFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Endwert'))).toBe(true)
    })

    it('should validate date range order', () => {
      const invalidFilters: FilterRule[] = [
        {
          id: 'filter-1',
          field: 'date',
          operator: 'between',
          value: '2025-12-31',
          valueEnd: '2025-01-01',
          logic: 'AND',
        },
      ]
      const result = validateFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('Startdatum'))).toBe(true)
    })
  })

  describe('filtersToString', () => {
    it('should convert filters to readable string', () => {
      const result = filtersToString(mockFilters)
      expect(result).toContain('category')
      expect(result).toContain('amount')
      expect(result).toContain('UND')
    })

    it('should handle empty filters', () => {
      const result = filtersToString([])
      expect(result).toBe('Keine Filter')
    })

    it('should display OR logic', () => {
      const orFilters: FilterRule[] = [
        { id: '1', field: 'category', operator: 'eq', value: 'A', logic: 'AND' },
        { id: '2', field: 'category', operator: 'eq', value: 'B', logic: 'OR' },
      ]
      const result = filtersToString(orFilters)
      expect(result).toContain('ODER')
    })
  })

  describe('serializeAndParseFilters', () => {
    it('should serialize and parse filters correctly', () => {
      const serialized = serializeFiltersToQuery(mockFilters)
      expect(serialized).toBeTruthy()

      const parsed = parseFiltersFromQuery(serialized)
      expect(parsed).toHaveLength(mockFilters.length)
      expect(parsed[0].field).toBe('category')
      expect(parsed[1].field).toBe('amount')
    })

    it('should handle empty query string', () => {
      const parsed = parseFiltersFromQuery('')
      expect(parsed).toEqual([])
    })

    it('should handle invalid JSON', () => {
      const parsed = parseFiltersFromQuery('not-valid-json')
      expect(parsed).toEqual([])
    })
  })

  describe('calculateFilterComplexity', () => {
    it('should calculate complexity score', () => {
      const score = calculateFilterComplexity(mockFilters)
      expect(score).toBeGreaterThan(0)
      expect(typeof score).toBe('number')
    })

    it('should give higher score for complex filters', () => {
      const simpleFilter: FilterRule[] = [
        { id: '1', field: 'category', operator: 'eq', value: 'Test', logic: 'AND' },
      ]
      const simpleScore = calculateFilterComplexity(simpleFilter)

      const complexFilters: FilterRule[] = [
        { id: '1', field: 'category', operator: 'eq', value: 'A', logic: 'AND' },
        { id: '2', field: 'amount', operator: 'between', value: '100', valueEnd: '500', logic: 'OR' },
        { id: '3', field: 'date', operator: 'between', value: '2025-01-01', valueEnd: '2025-12-31', logic: 'OR' },
      ]
      const complexScore = calculateFilterComplexity(complexFilters)

      expect(complexScore).toBeGreaterThan(simpleScore)
    })

    it('should handle empty filters', () => {
      const score = calculateFilterComplexity([])
      expect(score).toBe(0)
    })
  })
})
