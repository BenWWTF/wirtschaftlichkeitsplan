import type { AustrianExpenseCategory } from './types'

export const AUSTRIAN_EXPENSE_CATEGORIES: AustrianExpenseCategory[] = [
  {
    category: 'Räumlichkeiten',
    subcategories: ['Miete', 'Betriebskosten', 'Energie', 'Reinigung', 'Instandhaltung']
  },
  {
    category: 'Personal',
    subcategories: ['Gehälter', 'Lohnnebenkosten', 'Lohnverrechnung', 'Fortbildung', 'Sozialversicherung']
  },
  {
    category: 'Medizinischer Bedarf',
    subcategories: ['Arztbedarf', 'Verbrauchsmaterialien', 'Medikamente', 'Desinfektionsmittel']
  },
  {
    category: 'Ausstattung & Geräte',
    subcategories: ['Geräte (AfA)', 'Einrichtung (AfA)', 'EDV-Ausrüstung (AfA)', 'Leasing', 'Wartung & Reparatur']
  },
  {
    category: 'Versicherungen',
    subcategories: ['Berufshaftpflicht', 'Betriebsversicherung', 'Praxisausfall', 'Rechtsschutz']
  },
  {
    category: 'IT & Digital',
    subcategories: ['Arztsoftware', 'E-Card-System', 'IT-Support', 'Cloud-Dienste', 'Telekommunikation']
  },
  {
    category: 'Beratung & Verwaltung',
    subcategories: ['Steuerberatung', 'Buchhaltung', 'Rechtsanwalt', 'Wirtschaftsprüfung']
  },
  {
    category: 'Pflichtbeiträge',
    subcategories: ['Ärztekammer', 'Fortbildung (Ärztekammer)', 'Versicherungsbeiträge']
  },
  {
    category: 'Sonstige Betriebsausgaben',
    subcategories: ['Büromaterial', 'Marketing & Werbung', 'Bankgebühren', 'Porto & Versand', 'Sonstige']
  }
]

export const RECURRENCE_INTERVALS = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'quarterly', label: 'Vierteljährlich' },
  { value: 'yearly', label: 'Jährlich' }
] as const

export const PRACTICE_TYPES = [
  { value: 'kassenarzt', label: 'Kassenarzt' },
  { value: 'wahlarzt', label: 'Wahlarzt' },
  { value: 'mixed', label: 'Gemischt (Kasse + Privat)' }
] as const

export const APP_NAME = 'Ordi Pro'
export const APP_DESCRIPTION = 'Financial Planning Dashboard für österreichische Arztpraxen'

/**
 * Common recurring expenses for Austrian medical practices
 * Pre-configured templates to speed up data entry
 */
export interface ExpenseTemplate {
  name: string
  category: string
  subcategory: string
  typical_amount: number
  recurrence_interval: 'monthly' | 'quarterly' | 'yearly'
  description: string
}

export const AUSTRIAN_EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  // Monthly recurring
  {
    name: 'Praxismiete',
    category: 'Räumlichkeiten',
    subcategory: 'Miete',
    typical_amount: 1500,
    recurrence_interval: 'monthly',
    description: 'Monatliche Miete für Ordinationsräume'
  },
  {
    name: 'Betriebskosten',
    category: 'Räumlichkeiten',
    subcategory: 'Betriebskosten',
    typical_amount: 300,
    recurrence_interval: 'monthly',
    description: 'Heizung, Wasser, Müll, Hausbetreuung'
  },
  {
    name: 'Strom & Gas',
    category: 'Räumlichkeiten',
    subcategory: 'Energie',
    typical_amount: 200,
    recurrence_interval: 'monthly',
    description: 'Energiekosten für die Praxis'
  },
  {
    name: 'E-Card System',
    category: 'IT & Digital',
    subcategory: 'E-Card-System',
    typical_amount: 50,
    recurrence_interval: 'monthly',
    description: 'Monatliche Gebühr für E-Card Terminal'
  },
  {
    name: 'Arztsoftware Lizenz',
    category: 'IT & Digital',
    subcategory: 'Arztsoftware',
    typical_amount: 150,
    recurrence_interval: 'monthly',
    description: 'Praxisverwaltungssoftware (z.B. Medatixx, CGM)'
  },
  {
    name: 'Internet & Telefon',
    category: 'IT & Digital',
    subcategory: 'Telekommunikation',
    typical_amount: 80,
    recurrence_interval: 'monthly',
    description: 'Geschäftlicher Internetanschluss und Telefonie'
  },
  {
    name: 'Reinigung Praxis',
    category: 'Räumlichkeiten',
    subcategory: 'Reinigung',
    typical_amount: 400,
    recurrence_interval: 'monthly',
    description: 'Professionelle Reinigung der Praxisräume'
  },
  {
    name: 'Buchh altungsservice',
    category: 'Beratung & Verwaltung',
    subcategory: 'Buchhaltung',
    typical_amount: 250,
    recurrence_interval: 'monthly',
    description: 'Laufende Buchhaltung und Belegerfassung'
  },
  {
    name: 'Sozialversicherung (SVS)',
    category: 'Pflichtbeiträge',
    subcategory: 'Versicherungsbeiträge',
    typical_amount: 800,
    recurrence_interval: 'monthly',
    description: 'SVS-Beiträge für Selbständige (geschätzt)'
  },

  // Quarterly recurring
  {
    name: 'Ärztekammer Beitrag',
    category: 'Pflichtbeiträge',
    subcategory: 'Ärztekammer',
    typical_amount: 600,
    recurrence_interval: 'quarterly',
    description: 'Vierteljährlicher Pflichtbeitrag zur Ärztekammer'
  },
  {
    name: 'Steuerberatung',
    category: 'Beratung & Verwaltung',
    subcategory: 'Steuerberatung',
    typical_amount: 800,
    recurrence_interval: 'quarterly',
    description: 'Quartalsberatung und Steuererklärung'
  },

  // Yearly recurring
  {
    name: 'Berufshaftpflichtversicherung',
    category: 'Versicherungen',
    subcategory: 'Berufshaftpflicht',
    typical_amount: 1200,
    recurrence_interval: 'yearly',
    description: 'Jährliche Prämie für Haftpflichtversicherung'
  },
  {
    name: 'Betriebshaftpflicht',
    category: 'Versicherungen',
    subcategory: 'Betriebsversicherung',
    typical_amount: 600,
    recurrence_interval: 'yearly',
    description: 'Versicherung für Praxisräume und Ausstattung'
  },
  {
    name: 'Rechtsschutzversicherung',
    category: 'Versicherungen',
    subcategory: 'Rechtsschutz',
    typical_amount: 400,
    recurrence_interval: 'yearly',
    description: 'Beruflicher Rechtsschutz'
  },
  {
    name: 'Fortbildung Ärztekammer',
    category: 'Pflichtbeiträge',
    subcategory: 'Fortbildung (Ärztekammer)',
    typical_amount: 500,
    recurrence_interval: 'yearly',
    description: 'DFP-Punkte und Fortbildungsveranstaltungen'
  },
  {
    name: 'Medizinische Fachzeitschriften',
    category: 'Sonstige Betriebsausgaben',
    subcategory: 'Sonstige',
    typical_amount: 300,
    recurrence_interval: 'yearly',
    description: 'Abonnements für Fachliteratur'
  },
  {
    name: 'IT-Support & Wartung',
    category: 'IT & Digital',
    subcategory: 'IT-Support',
    typical_amount: 800,
    recurrence_interval: 'yearly',
    description: 'Jährliche IT-Wartungsverträge'
  }
]
