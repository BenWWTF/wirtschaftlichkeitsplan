/**
 * Context-based icon mapping
 *
 * Replaces emoji with modern Lucide flat icons for consistent,
 * accessible, and customizable icon usage throughout the application.
 */

import {
  Lightbulb,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Target,
  LucideIcon,
} from 'lucide-react'

export type IconContext =
  | 'tip'
  | 'success'
  | 'warning'
  | 'info'
  | 'financial'
  | 'growth'
  | 'chart'
  | 'goal'

export interface IconConfig {
  icon: LucideIcon
  defaultColor: string
  darkColor: string
}

/**
 * Central icon configuration mapping context to appropriate icon + colors
 *
 * Example usage:
 * ```tsx
 * const config = contextIcons.tip
 * <config.icon className={`h-5 w-5 ${config.defaultColor}`} />
 * ```
 */
export const contextIcons: Record<IconContext, IconConfig> = {
  // Tips, hints, ideas, suggestions
  tip: {
    icon: Lightbulb,
    defaultColor: 'text-blue-500',
    darkColor: 'dark:text-blue-400',
  },

  // Success, completion, healthy status
  success: {
    icon: CheckCircle2,
    defaultColor: 'text-green-600',
    darkColor: 'dark:text-green-400',
  },

  // Warnings, cautions, moderate status
  warning: {
    icon: AlertTriangle,
    defaultColor: 'text-yellow-600',
    darkColor: 'dark:text-yellow-400',
  },

  // Information, notes, disclaimers
  info: {
    icon: Info,
    defaultColor: 'text-gray-500',
    darkColor: 'dark:text-gray-400',
  },

  // Financial, costs, money-related
  financial: {
    icon: DollarSign,
    defaultColor: 'text-green-700',
    darkColor: 'dark:text-green-500',
  },

  // Growth, positive trends, increases
  growth: {
    icon: TrendingUp,
    defaultColor: 'text-green-600',
    darkColor: 'dark:text-green-400',
  },

  // Reports, analytics, data visualization
  chart: {
    icon: BarChart3,
    defaultColor: 'text-indigo-600',
    darkColor: 'dark:text-indigo-400',
  },

  // Goals, recommendations, targeting
  goal: {
    icon: Target,
    defaultColor: 'text-purple-600',
    darkColor: 'dark:text-purple-400',
  },
}

/**
 * Get icon configuration for a given context
 *
 * @param context - The icon context/purpose
 * @param size - Icon size: 'sm' | 'md' | 'lg' (default: 'md')
 * @returns Object with icon component and combined color classes
 */
export function getIconConfig(context: IconContext, size: 'sm' | 'md' | 'lg' = 'md') {
  const config = contextIcons[context]
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return {
    Icon: config.icon,
    className: `${sizeMap[size]} ${config.defaultColor} ${config.darkColor}`,
  }
}

/**
 * Icon size utility classes
 */
export const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const

/**
 * Status colors for icons (for conditional rendering)
 */
export const statusColors = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-500 dark:text-blue-400',
  neutral: 'text-gray-600 dark:text-gray-400',
} as const
