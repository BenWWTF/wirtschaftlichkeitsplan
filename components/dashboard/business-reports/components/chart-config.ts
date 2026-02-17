/**
 * Shared chart configuration for consistent data visualization across all report tabs.
 *
 * Design principles applied:
 * - Semantic financial colors from tailwind config (profit, loss, accent)
 * - Colorblind-safe palette (blue/green/orange avoids red-green confusion)
 * - Dark mode aware via CSS class detection
 * - Consistent tooltip, grid, and axis styling
 */

// --- Semantic chart colors aligned with tailwind.config.ts tokens ---
export const CHART_COLORS = {
  // Primary data series
  revenue: '#7A9BA8',       // accent-500 (Taubenblau)
  revenueLight: '#A8C5D1',  // accent-300
  profit: '#22C55E',        // profit-500
  profitLight: '#86EFAC',   // profit-300
  loss: '#EF4444',          // loss-500
  lossLight: '#FCA5A5',     // loss-300

  // Cost categories
  fixedCosts: '#E04848',    // slightly muted red
  sumupFees: '#F59E0B',     // warning-500 (amber)
  variableCosts: '#F97316', // orange

  // Neutral / secondary
  planned: '#8AB5C4',       // accent-400 (lighter taubenblau)
  sessions: '#8B5CF6',      // violet for session counts
  sessionsLight: '#C4B5FD',

  // Categorical (colorblind-safe: blue, orange, teal, pink, amber)
  category: [
    '#3B82F6', // blue
    '#F59E0B', // amber
    '#14B8A6', // teal
    '#EC4899', // pink
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#6366F1', // indigo
    '#10B981', // emerald
    '#EF4444', // red
  ],
} as const

// --- Dark mode detection ---
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

// --- Axis / Grid colors that adapt to theme ---
export function getGridColor(): string {
  return isDarkMode() ? '#374151' : '#e5e7eb' // gray-700 / gray-200
}

export function getAxisColor(): string {
  return isDarkMode() ? '#9ca3af' : '#6b7280' // gray-400 / gray-500
}

export function getTextColor(): string {
  return isDarkMode() ? '#d1d5db' : '#374151' // gray-300 / gray-700
}

// --- Shared tooltip style ---
export const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 with slight transparency
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '0.5rem',
  color: '#f1f5f9',
  fontSize: '0.8125rem',
  padding: '0.5rem 0.75rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
}

// --- Shared chart margins ---
export const CHART_MARGIN = {
  standard: { top: 10, right: 10, left: -10, bottom: 0 },
  withLegend: { top: 10, right: 10, left: -10, bottom: 5 },
  horizontal: { top: 5, right: 30, left: 10, bottom: 5 },
} as const

// --- Y-axis tick formatter for Euro amounts ---
export function formatAxisEuro(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `${value}`
}

// --- Gradient definitions (reusable SVG defs) ---
export const GRADIENT_IDS = {
  revenue: 'gradient-revenue',
  profit: 'gradient-profit',
  loss: 'gradient-loss',
  sessions: 'gradient-sessions',
} as const

import type { CSSProperties } from 'react'

/** Sparkline data point */
export interface SparklinePoint {
  value: number
}
