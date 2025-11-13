/**
 * Capacity Planning Utilities for Medical Practices
 *
 * Helps practice owners understand:
 * - Maximum session capacity
 * - Current utilization rates
 * - Revenue optimization opportunities
 * - Overbooking warnings
 */

export interface CapacitySettings {
  weeklyHoursAvailable: number
  vacationWeeksPerYear: number
  treatmentRooms: number
  publicHolidays: number // Austrian public holidays: typically 13 days
}

export interface TherapyCapacity {
  therapyTypeId: string
  therapyTypeName: string
  averageDurationMinutes: number
  plannedSessions: number
  actualSessions?: number
}

export interface CapacityAnalysis {
  // Time availability
  annualWorkingWeeks: number
  weeklyAvailableMinutes: number
  annualAvailableMinutes: number

  // Current usage
  totalPlannedSessions: number
  totalActualSessions: number
  totalPlannedMinutes: number
  totalActualMinutes: number

  // Utilization
  plannedUtilizationRate: number // %
  actualUtilizationRate: number // %
  availableCapacity: number // minutes left

  // Alerts
  isOverbooked: boolean
  utilizationStatus: 'low' | 'optimal' | 'high' | 'overbooked'
  recommendations: string[]
}

/**
 * Austrian public holidays (2025)
 * These are days when most practices are closed
 */
export const AUSTRIAN_PUBLIC_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'Neujahr' },
  { date: '2025-01-06', name: 'Heilige Drei Könige' },
  { date: '2025-04-21', name: 'Ostermontag' },
  { date: '2025-05-01', name: 'Staatsfeiertag' },
  { date: '2025-05-29', name: 'Christi Himmelfahrt' },
  { date: '2025-06-09', name: 'Pfingstmontag' },
  { date: '2025-06-19', name: 'Fronleichnam' },
  { date: '2025-08-15', name: 'Mariä Himmelfahrt' },
  { date: '2025-10-26', name: 'Nationalfeiertag' },
  { date: '2025-11-01', name: 'Allerheiligen' },
  { date: '2025-12-08', name: 'Mariä Empfängnis' },
  { date: '2025-12-25', name: 'Weihnachten' },
  { date: '2025-12-26', name: 'Stephanitag' }
]

/**
 * Calculate available working time considering vacations and holidays
 */
export function calculateAvailableTime(settings: CapacitySettings): {
  annualWorkingWeeks: number
  weeklyAvailableMinutes: number
  annualAvailableMinutes: number
} {
  const WEEKS_PER_YEAR = 52
  const publicHolidayWeeks = settings.publicHolidays / 5 // Assume 5 working days per week

  const annualWorkingWeeks = WEEKS_PER_YEAR - settings.vacationWeeksPerYear - publicHolidayWeeks
  const weeklyAvailableMinutes = settings.weeklyHoursAvailable * 60
  const annualAvailableMinutes = weeklyAvailableMinutes * annualWorkingWeeks

  return {
    annualWorkingWeeks,
    weeklyAvailableMinutes,
    annualAvailableMinutes
  }
}

/**
 * Analyze practice capacity and utilization
 */
export function analyzeCapacity(
  settings: CapacitySettings,
  therapies: TherapyCapacity[]
): CapacityAnalysis {
  const timeAvailable = calculateAvailableTime(settings)

  // Calculate total planned and actual time used
  const totalPlannedSessions = therapies.reduce((sum, t) => sum + t.plannedSessions, 0)
  const totalActualSessions = therapies.reduce((sum, t) => sum + (t.actualSessions || 0), 0)

  const totalPlannedMinutes = therapies.reduce(
    (sum, t) => sum + t.plannedSessions * t.averageDurationMinutes,
    0
  )
  const totalActualMinutes = therapies.reduce(
    (sum, t) => sum + (t.actualSessions || 0) * t.averageDurationMinutes,
    0
  )

  // Calculate utilization rates
  const plannedUtilizationRate =
    timeAvailable.weeklyAvailableMinutes > 0
      ? (totalPlannedMinutes / timeAvailable.weeklyAvailableMinutes) * 100
      : 0

  const actualUtilizationRate =
    timeAvailable.weeklyAvailableMinutes > 0
      ? (totalActualMinutes / timeAvailable.weeklyAvailableMinutes) * 100
      : 0

  const availableCapacity = timeAvailable.weeklyAvailableMinutes - totalPlannedMinutes

  // Determine status
  const isOverbooked = plannedUtilizationRate > 100
  let utilizationStatus: 'low' | 'optimal' | 'high' | 'overbooked'

  if (isOverbooked) {
    utilizationStatus = 'overbooked'
  } else if (plannedUtilizationRate >= 85) {
    utilizationStatus = 'high'
  } else if (plannedUtilizationRate >= 65) {
    utilizationStatus = 'optimal'
  } else {
    utilizationStatus = 'low'
  }

  // Generate recommendations
  const recommendations = generateRecommendations({
    utilizationStatus,
    plannedUtilizationRate,
    actualUtilizationRate,
    availableCapacity,
    totalPlannedSessions,
    totalActualSessions,
    settings
  })

  return {
    annualWorkingWeeks: timeAvailable.annualWorkingWeeks,
    weeklyAvailableMinutes: timeAvailable.weeklyAvailableMinutes,
    annualAvailableMinutes: timeAvailable.annualAvailableMinutes,

    totalPlannedSessions,
    totalActualSessions,
    totalPlannedMinutes,
    totalActualMinutes,

    plannedUtilizationRate,
    actualUtilizationRate,
    availableCapacity,

    isOverbooked,
    utilizationStatus,
    recommendations
  }
}

/**
 * Generate personalized recommendations based on capacity analysis
 */
function generateRecommendations(data: {
  utilizationStatus: string
  plannedUtilizationRate: number
  actualUtilizationRate: number
  availableCapacity: number
  totalPlannedSessions: number
  totalActualSessions: number
  settings: CapacitySettings
}): string[] {
  const recommendations: string[] = []

  // Overbooking warning
  if (data.utilizationStatus === 'overbooked') {
    recommendations.push(
      `⚠️ Achtung: Ihre geplanten Sitzungen überschreiten Ihre verfügbare Zeit um ${(data.plannedUtilizationRate - 100).toFixed(1)}%. Dies ist nicht realistisch umsetzbar.`
    )
    recommendations.push(
      `💡 Tipp: Reduzieren Sie geplante Sitzungen oder erhöhen Sie Ihre Arbeitszeit um ${Math.ceil((data.totalPlannedSessions / 100 - data.plannedUtilizationRate / 100) * data.settings.weeklyHoursAvailable)} Stunden/Woche.`
    )
  }

  // High utilization (good, but risky)
  if (data.utilizationStatus === 'high' && data.plannedUtilizationRate < 100) {
    recommendations.push(
      `✅ Hervorragend! Ihre Auslastung von ${data.plannedUtilizationRate.toFixed(1)}% ist optimal. Sie nutzen Ihre Zeit effektiv.`
    )
    recommendations.push(
      `ℹ️ Hinweis: Sie haben nur noch ${Math.floor(data.availableCapacity / 60)} Stunden Pufferzeit. Planen Sie Notfalltermine ein.`
    )
  }

  // Optimal utilization
  if (data.utilizationStatus === 'optimal') {
    recommendations.push(
      `✅ Ihre Auslastung von ${data.plannedUtilizationRate.toFixed(1)}% liegt im optimalen Bereich (65-85%). Gutes Gleichgewicht zwischen Produktivität und Flexibilität.`
    )
    const additionalSessions = Math.floor(data.availableCapacity / 50) // Assuming 50-min avg session
    recommendations.push(
      `💰 Umsatzpotenzial: Sie könnten noch ~${additionalSessions} Sitzungen pro Woche einplanen (+€${(additionalSessions * 80).toLocaleString('de-AT')} potenzielle Mehreinnahmen).`
    )
  }

  // Low utilization (opportunity)
  if (data.utilizationStatus === 'low') {
    recommendations.push(
      `📊 Ihre aktuelle Auslastung beträgt nur ${data.plannedUtilizationRate.toFixed(1)}%. Sie haben signifikantes Wachstumspotenzial.`
    )
    const additionalHours = Math.floor(data.availableCapacity / 60)
    recommendations.push(
      `💡 Opportunity: Sie haben ${additionalHours} Stunden/Woche verfügbar. Erwägen Sie Marketing-Maßnahmen zur Patientenakquise.`
    )
  }

  // Gap between planned and actual
  if (data.totalActualSessions > 0 && data.actualUtilizationRate < data.plannedUtilizationRate * 0.8) {
    const gap = data.plannedUtilizationRate - data.actualUtilizationRate
    recommendations.push(
      `⚠️ Ihre tatsächliche Auslastung (${data.actualUtilizationRate.toFixed(1)}%) liegt ${gap.toFixed(1)}% unter der Planung. Überprüfen Sie Ihre Absagequote.`
    )
  }

  // Multiple rooms underutilized
  if (data.settings.treatmentRooms > 1 && data.utilizationStatus === 'low') {
    recommendations.push(
      `ℹ️ Sie haben ${data.settings.treatmentRooms} Behandlungsräume. Erwägen Sie die Anstellung eines weiteren Therapeuten oder Untervermietung.`
    )
  }

  return recommendations
}

/**
 * Calculate maximum sessions per week based on average duration
 */
export function calculateMaxSessionsPerWeek(
  weeklyHoursAvailable: number,
  averageDurationMinutes: number
): number {
  const weeklyMinutes = weeklyHoursAvailable * 60
  return Math.floor(weeklyMinutes / averageDurationMinutes)
}

/**
 * Calculate revenue per available hour
 */
export function calculateRevenuePerHour(
  totalRevenue: number,
  hoursWorked: number
): number {
  if (hoursWorked === 0) return 0
  return totalRevenue / hoursWorked
}

/**
 * Austrian statutory minimum vacation (Urlaub)
 * Employees: 25 days (5 weeks)
 * Self-employed doctors typically take 4-6 weeks
 */
export const AUSTRIAN_MIN_VACATION_WEEKS = 5

/**
 * Format time in hours and minutes
 */
export function formatTimeHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}min`
}
