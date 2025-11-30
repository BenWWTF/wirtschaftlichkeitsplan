/**
 * Breadcrumb configuration mapping routes to human-readable labels
 */

export interface BreadcrumbItem {
  label: string
  href: string
}

export interface RouteBreadcrumbs {
  segments: string[] // route segments
  generateLabel: (segment: string, params?: Record<string, string>) => string
}

/**
 * Maps dashboard routes to breadcrumb configurations
 * Each route shows: Home > [Page] > [Optional Month]
 */
export const BREADCRUMB_CONFIG: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/planung': 'Monatliche Planung',
  '/dashboard/ergebnisse': 'Monatliche Ergebnisse',
  '/dashboard/therapien': 'Therapiearten',
  '/dashboard/ausgaben': 'Ausgaben',
  '/dashboard/steuerprognose': 'Meine Steuerprognose',
  '/dashboard/berichte': 'Geschäftsberichte',
  '/dashboard/einstellungen': 'Einstellungen',
  '/dashboard/analyse': 'Analyse',
}

/**
 * Generate month label from YYYY-MM format
 */
export function formatMonthLabel(monthString: string): string {
  if (!monthString || !monthString.match(/^\d{4}-\d{2}$/)) {
    return ''
  }

  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)

  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

/**
 * Generate breadcrumb items for a given pathname and search params
 */
export function generateBreadcrumbs(
  pathname: string,
  month?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' }
  ]

  // Get the page-specific label
  const pageLabel = BREADCRUMB_CONFIG[pathname]
  if (pageLabel && pathname !== '/dashboard') {
    items.push({
      label: pageLabel,
      href: pathname
    })

    // Add month segment if provided and page supports it
    if (month && ['planung', 'ergebnisse'].some(p => pathname.includes(p))) {
      const monthLabel = formatMonthLabel(month)
      if (monthLabel) {
        items.push({
          label: monthLabel,
          href: `${pathname}?month=${month}`
        })
      }
    }
  }

  return items
}
