/// <reference types="jest" />
import { generateBreadcrumbs, formatMonthLabel, BREADCRUMB_CONFIG } from '@/lib/config/breadcrumb-config'

describe('Breadcrumb Config', () => {
  describe('formatMonthLabel', () => {
    it('should format month string to German month label', () => {
      const result = formatMonthLabel('2025-11')
      expect(result).toBe('November 2025')
    })

    it('should format January correctly', () => {
      const result = formatMonthLabel('2025-01')
      expect(result).toBe('Januar 2025')
    })

    it('should return empty string for invalid format', () => {
      expect(formatMonthLabel('invalid')).toBe('')
      expect(formatMonthLabel('2025-13')).toBe('')
      expect(formatMonthLabel('25-11')).toBe('')
    })

    it('should handle empty string', () => {
      expect(formatMonthLabel('')).toBe('')
    })
  })

  describe('generateBreadcrumbs', () => {
    it('should return only Home for dashboard root', () => {
      const result = generateBreadcrumbs('/dashboard')
      expect(result).toEqual([{ label: 'Home', href: '/dashboard' }])
    })

    it('should include page for planung route', () => {
      const result = generateBreadcrumbs('/dashboard/planung')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ label: 'Home', href: '/dashboard' })
      expect(result[1]).toEqual({ label: 'Monatliche Planung', href: '/dashboard/planung' })
    })

    it('should include month for planung with month param', () => {
      const result = generateBreadcrumbs('/dashboard/planung', '2025-11')
      expect(result).toHaveLength(3)
      expect(result[2]).toEqual({ label: 'November 2025', href: '/dashboard/planung?month=2025-11' })
    })

    it('should include month for ergebnisse with month param', () => {
      const result = generateBreadcrumbs('/dashboard/ergebnisse', '2025-11')
      expect(result).toHaveLength(3)
      expect(result[1].label).toBe('Monatliche Ergebnisse')
      expect(result[2].label).toBe('November 2025')
    })

    it('should NOT include month for therapien route even with month param', () => {
      const result = generateBreadcrumbs('/dashboard/therapien', '2025-11')
      expect(result).toHaveLength(2)
      expect(result[1].label).toBe('Therapiearten')
    })

    it('should handle all dashboard pages', () => {
      Object.keys(BREADCRUMB_CONFIG).forEach(route => {
        const result = generateBreadcrumbs(route)
        expect(result).toHaveLength(route === '/dashboard' ? 1 : 2)
        if (route !== '/dashboard') {
          expect(result[1].label).toBe(BREADCRUMB_CONFIG[route])
        }
      })
    })
  })

  describe('BREADCRUMB_CONFIG', () => {
    it('should have all required dashboard routes', () => {
      const requiredRoutes = [
        '/dashboard',
        '/dashboard/planung',
        '/dashboard/ergebnisse',
        '/dashboard/therapien',
        '/dashboard/ausgaben',
        '/dashboard/steuerprognose',
        '/dashboard/berichte',
        '/dashboard/einstellungen',
        '/dashboard/analyse',
      ]

      requiredRoutes.forEach(route => {
        expect(BREADCRUMB_CONFIG).toHaveProperty(route)
      })
    })

    it('should have German labels for all routes', () => {
      Object.values(BREADCRUMB_CONFIG).forEach(label => {
        expect(label).toBeTruthy()
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })
  })
})
