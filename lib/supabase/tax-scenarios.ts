/**
 * Supabase Integration for Tax Scenarios
 *
 * Handles storing, retrieving, and managing tax calculation scenarios
 * in the Supabase database.
 */

import { createClient } from '@/lib/supabase/client'
import type { TaxScenario, ComprehensiveTaxInput, ComprehensiveTaxResult } from '@/lib/types/tax-types'

// ========================================================================
// DATABASE OPERATIONS
// ========================================================================

/**
 * Save a new tax scenario to Supabase
 */
export async function saveTaxScenario(
  userId: string,
  scenarioName: string,
  input: ComprehensiveTaxInput,
  result: ComprehensiveTaxResult,
  description?: string
): Promise<TaxScenario> {
  const supabase = createClient()

  const scenario = {
    user_id: userId,
    scenario_name: scenarioName,
    description: description || null,
    input_data: input,
    result_data: result,
    tax_year: result.taxYear,
    total_gross_income: result.totalGrossIncome,
    total_net_income: result.netIncome,
    total_tax_burden: result.totalIncomeTax,
    burden_percentage: result.burdenPercentage,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('tax_scenarios').insert([scenario]).select().single()

  if (error) {
    throw new Error(`Failed to save tax scenario: ${error.message}`)
  }

  return transformDbScenario(data)
}

/**
 * Update an existing tax scenario
 */
export async function updateTaxScenario(
  scenarioId: string,
  updates: Partial<{
    scenario_name: string
    description: string
    input_data: ComprehensiveTaxInput
    result_data: ComprehensiveTaxResult
  }>
): Promise<TaxScenario> {
  const supabase = createClient()

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('tax_scenarios')
    .update(updateData)
    .eq('id', scenarioId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update tax scenario: ${error.message}`)
  }

  return transformDbScenario(data)
}

/**
 * Delete a tax scenario
 */
export async function deleteTaxScenario(scenarioId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('tax_scenarios').delete().eq('id', scenarioId)

  if (error) {
    throw new Error(`Failed to delete tax scenario: ${error.message}`)
  }
}

/**
 * Get a single tax scenario by ID
 */
export async function getTaxScenario(scenarioId: string): Promise<TaxScenario | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from('tax_scenarios').select('*').eq('id', scenarioId).single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`Failed to fetch tax scenario: ${error.message}`)
  }

  return data ? transformDbScenario(data) : null
}

/**
 * Get all tax scenarios for a user
 */
export async function getUserTaxScenarios(userId: string, limit: number = 50, offset: number = 0): Promise<TaxScenario[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tax_scenarios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch tax scenarios: ${error.message}`)
  }

  return data?.map(transformDbScenario) || []
}

/**
 * Get scenarios for a specific tax year
 */
export async function getTaxYearScenarios(userId: string, taxYear: number): Promise<TaxScenario[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tax_scenarios')
    .select('*')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tax year scenarios: ${error.message}`)
  }

  return data?.map(transformDbScenario) || []
}

/**
 * Search scenarios by name
 */
export async function searchTaxScenarios(userId: string, searchTerm: string): Promise<TaxScenario[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tax_scenarios')
    .select('*')
    .eq('user_id', userId)
    .ilike('scenario_name', `%${searchTerm}%`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to search tax scenarios: ${error.message}`)
  }

  return data?.map(transformDbScenario) || []
}

/**
 * Get scenario statistics for a user
 */
export async function getUserScenarioStats(userId: string): Promise<{
  totalScenarios: number
  totalForTaxYear: Record<number, number>
  averageNetIncome: number
  averageTaxBurden: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tax_scenarios')
    .select('id, tax_year, total_net_income, total_tax_burden')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to fetch scenario statistics: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      totalScenarios: 0,
      totalForTaxYear: {},
      averageNetIncome: 0,
      averageTaxBurden: 0,
    }
  }

  // Calculate statistics
  const totalForTaxYear: Record<number, number> = {}
  let totalNetIncome = 0
  let totalTaxBurden = 0

  data.forEach((scenario) => {
    totalForTaxYear[scenario.tax_year] = (totalForTaxYear[scenario.tax_year] || 0) + 1
    totalNetIncome += scenario.total_net_income || 0
    totalTaxBurden += scenario.total_tax_burden || 0
  })

  return {
    totalScenarios: data.length,
    totalForTaxYear,
    averageNetIncome: data.length > 0 ? totalNetIncome / data.length : 0,
    averageTaxBurden: data.length > 0 ? totalTaxBurden / data.length : 0,
  }
}

/**
 * Duplicate a scenario (for creating variations)
 */
export async function duplicateTaxScenario(
  userId: string,
  scenarioId: string,
  newName: string
): Promise<TaxScenario> {
  const supabase = createClient()

  // Get the original scenario
  const original = await getTaxScenario(scenarioId)
  if (!original || original.userId !== userId) {
    throw new Error('Scenario not found or unauthorized')
  }

  // Create new scenario with duplicated data
  return saveTaxScenario(userId, newName, original.input, original.result, `Kopie von ${original.scenarioName}`)
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Transform database record to TaxScenario type
 */
function transformDbScenario(dbRecord: any): TaxScenario {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    scenarioName: dbRecord.scenario_name,
    description: dbRecord.description,
    input: dbRecord.input_data,
    result: dbRecord.result_data,
    createdAt: new Date(dbRecord.created_at),
    updatedAt: new Date(dbRecord.updated_at),
  }
}

/**
 * Batch export scenarios to CSV format
 */
export function exportScenariesToCSV(scenarios: TaxScenario[]): string {
  const headers = ['Szenarioname', 'Steuerjahr', 'Bruttoeinkommen', 'Sozialversicherung', 'Einkommensteuer', 'Nettoeinkommen', 'Belastung', 'Erstellt']
  const rows = scenarios.map((s) => [
    s.scenarioName,
    s.result.taxYear,
    s.result.totalGrossIncome.toFixed(2),
    s.result.totalSs.toFixed(2),
    s.result.totalIncomeTax.toFixed(2),
    s.result.netIncome.toFixed(2),
    s.result.burdenPercentage.toFixed(1),
    new Date(s.createdAt).toLocaleDateString('de-AT'),
  ])

  const csv = [headers, ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n')
  return csv
}

/**
 * Import scenarios from JSON
 */
export async function importScenarios(
  userId: string,
  jsonData: string
): Promise<TaxScenario[]> {
  try {
    const scenarios = JSON.parse(jsonData)

    if (!Array.isArray(scenarios)) {
      throw new Error('Invalid format: expected array of scenarios')
    }

    const imported: TaxScenario[] = []

    for (const scenario of scenarios) {
      if (!scenario.scenarioName || !scenario.input || !scenario.result) {
        console.warn('Skipping invalid scenario:', scenario)
        continue
      }

      const saved = await saveTaxScenario(
        userId,
        scenario.scenarioName,
        scenario.input,
        scenario.result,
        scenario.description
      )

      imported.push(saved)
    }

    return imported
  } catch (error) {
    throw new Error(`Failed to import scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ========================================================================
// REAL-TIME SUBSCRIPTIONS
// ========================================================================

/**
 * Subscribe to changes in user's tax scenarios
 */
export function subscribeToUserScenarios(
  userId: string,
  callback: (scenarios: TaxScenario[]) => void
): (() => void) {
  const supabase = createClient()

  const subscription = supabase
    .channel(`tax-scenarios:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tax_scenarios',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Refetch all scenarios on any change
        const scenarios = await getUserTaxScenarios(userId)
        callback(scenarios)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}
