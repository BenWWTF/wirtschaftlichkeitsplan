export type IconName = 'Home' | 'Calendar' | 'BarChart3' | 'Pill' | 'Receipt' | 'Calculator' | 'FileText' | 'Settings' | 'TrendingUp'

export interface PageRelationship {
  title: string
  description: string
  href: string
  icon: IconName
}

export interface PageRelationships {
  [page: string]: PageRelationship[]
}

// Icon map for pages
const PAGE_ICONS: Record<string, IconName> = {
  '/dashboard': 'Home',
  '/dashboard/planung': 'Calendar',
  '/dashboard/ergebnisse': 'BarChart3',
  '/dashboard/therapien': 'Pill',
  '/dashboard/ausgaben': 'Receipt',
  '/dashboard/steuerprognose': 'Calculator',
  '/dashboard/berichte': 'FileText',
  '/dashboard/einstellungen': 'Settings',
  '/dashboard/analyse': 'TrendingUp',
}

export const PAGE_RELATIONSHIPS: PageRelationships = {
  '/dashboard/planung': [
    {
      title: 'Monatliche Ergebnisse',
      description: 'See actual vs planned sessions for this month',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Therapiearten',
      description: 'Manage therapy types and pricing',
      href: '/dashboard/therapien',
      icon: 'Pill',
    },
    {
      title: 'Ausgaben',
      description: 'Track fixed and variable costs',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
  ],
  '/dashboard/ergebnisse': [
    {
      title: 'Monatliche Planung',
      description: 'Plan sessions and revenue targets',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Ausgaben',
      description: 'Review costs and their impact',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Analyse',
      description: 'Deep dive into metrics and trends',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
  ],
  '/dashboard/therapien': [
    {
      title: 'Monatliche Planung',
      description: 'Use these therapy types in your plan',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Ausgaben',
      description: 'View costs associated with each type',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Einstellungen',
      description: 'Configure default pricing and settings',
      href: '/dashboard/einstellungen',
      icon: 'Settings',
    },
  ],
  '/dashboard/ausgaben': [
    {
      title: 'Monatliche Planung',
      description: 'See impact of costs on profitability',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Compare planned vs actual costs',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Meine Steuerprognose',
      description: 'See tax impact of your expenses',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
  ],
  '/dashboard/steuerprognose': [
    {
      title: 'Analyse',
      description: 'Understand your financial trends',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
    {
      title: 'Ausgaben',
      description: 'Adjust costs to optimize taxes',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Einstellungen',
      description: 'Configure tax-related settings',
      href: '/dashboard/einstellungen',
      icon: 'Settings',
    },
  ],
  '/dashboard/analyse': [
    {
      title: 'Meine Steuerprognose',
      description: 'See your tax forecast',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
    {
      title: 'Monatliche Planung',
      description: 'Plan based on insights',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Review execution results',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
  ],
  '/dashboard/berichte': [
    {
      title: 'Analyse',
      description: 'See detailed analytics and trends',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Review monthly performance',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Meine Steuerprognose',
      description: 'Check your tax forecast',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
  ],
  '/dashboard/einstellungen': [
    {
      title: 'Therapiearten',
      description: 'Manage therapy offerings',
      href: '/dashboard/therapien',
      icon: 'Pill',
    },
    {
      title: 'Ausgaben',
      description: 'Configure fixed and variable costs',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Monatliche Planung',
      description: 'Return to planning',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
  ],
}

export function getRelatedPages(currentPage: string, limit: number = 4): PageRelationship[] {
  const relationships = PAGE_RELATIONSHIPS[currentPage] || []
  return relationships.slice(0, limit)
}
