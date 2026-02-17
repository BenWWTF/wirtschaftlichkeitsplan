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
      description: 'Vergleichen Sie geplante und tatsächliche Sitzungen',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Therapiearten',
      description: 'Therapiearten und Preise verwalten',
      href: '/dashboard/therapien',
      icon: 'Pill',
    },
    {
      title: 'Ausgaben',
      description: 'Fix- und variable Kosten erfassen',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
  ],
  '/dashboard/ergebnisse': [
    {
      title: 'Monatliche Planung',
      description: 'Sitzungen und Umsatzziele planen',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Ausgaben',
      description: 'Kosten und deren Auswirkungen prüfen',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Analyse',
      description: 'Detaillierte Kennzahlen und Trends',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
  ],
  '/dashboard/therapien': [
    {
      title: 'Monatliche Planung',
      description: 'Therapiearten in Ihre Planung einbeziehen',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Ausgaben',
      description: 'Kosten pro Therapieart einsehen',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Einstellungen',
      description: 'Standardpreise und Einstellungen konfigurieren',
      href: '/dashboard/einstellungen',
      icon: 'Settings',
    },
  ],
  '/dashboard/ausgaben': [
    {
      title: 'Monatliche Planung',
      description: 'Auswirkung der Kosten auf die Rentabilität',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Plan- und Ist-Kosten vergleichen',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Meine Steuerprognose',
      description: 'Steuerliche Auswirkung Ihrer Ausgaben',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
  ],
  '/dashboard/steuerprognose': [
    {
      title: 'Analyse',
      description: 'Finanzielle Trends verstehen',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
    {
      title: 'Ausgaben',
      description: 'Kosten zur Steueroptimierung anpassen',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Einstellungen',
      description: 'Steuerrelevante Einstellungen konfigurieren',
      href: '/dashboard/einstellungen',
      icon: 'Settings',
    },
  ],
  '/dashboard/analyse': [
    {
      title: 'Meine Steuerprognose',
      description: 'Ihre Steuerschätzung einsehen',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
    {
      title: 'Monatliche Planung',
      description: 'Planung basierend auf Erkenntnissen',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Ergebnisse der Umsetzung prüfen',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
  ],
  '/dashboard/berichte': [
    {
      title: 'Analyse',
      description: 'Detaillierte Analysen und Trends',
      href: '/dashboard/analyse',
      icon: 'TrendingUp',
    },
    {
      title: 'Monatliche Ergebnisse',
      description: 'Monatliche Leistung überprüfen',
      href: '/dashboard/ergebnisse',
      icon: 'BarChart3',
    },
    {
      title: 'Meine Steuerprognose',
      description: 'Ihre Steuerschätzung prüfen',
      href: '/dashboard/steuerprognose',
      icon: 'Calculator',
    },
  ],
  '/dashboard/einstellungen': [
    {
      title: 'Therapiearten',
      description: 'Therapieangebote verwalten',
      href: '/dashboard/therapien',
      icon: 'Pill',
    },
    {
      title: 'Ausgaben',
      description: 'Fix- und variable Kosten konfigurieren',
      href: '/dashboard/ausgaben',
      icon: 'Receipt',
    },
    {
      title: 'Monatliche Planung',
      description: 'Zurück zur Planung',
      href: '/dashboard/planung',
      icon: 'Calendar',
    },
  ],
}

export function getRelatedPages(currentPage: string, limit: number = 4): PageRelationship[] {
  const relationships = PAGE_RELATIONSHIPS[currentPage] || []
  return relationships.slice(0, limit)
}
