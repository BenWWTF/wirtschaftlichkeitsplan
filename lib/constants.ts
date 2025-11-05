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

export const APP_NAME = 'Wirtschaftlichkeitsplan'
export const APP_DESCRIPTION = 'Financial Planning Dashboard für österreichische Arztpraxen'
