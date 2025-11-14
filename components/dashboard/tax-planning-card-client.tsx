'use client'

import { TaxPlanningCard } from '@/components/dashboard/tax-planning-card'

interface TaxPlanningCardClientProps {
  grossRevenue: number
  totalExpenses: number
  practiceType: 'kassenarzt' | 'wahlarzt' | 'mixed'
  privatePatientRevenue?: number
}

export function TaxPlanningCardClient({
  grossRevenue,
  totalExpenses,
  practiceType,
  privatePatientRevenue
}: TaxPlanningCardClientProps) {
  return (
    <TaxPlanningCard
      grossRevenue={grossRevenue}
      totalExpenses={totalExpenses}
      practiceType={practiceType}
      privatePatientRevenue={privatePatientRevenue}
    />
  )
}
