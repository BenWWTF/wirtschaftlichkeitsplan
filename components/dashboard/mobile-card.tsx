'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface MobileCardProps {
  /** Main title/header of the card */
  title: string
  /** Primary information to display below title */
  primary?: ReactNode
  /** Secondary information */
  secondary?: ReactNode
  /** Subtitle for card (alternative to primary/secondary) */
  subtitle?: ReactNode
  /** Badge element to display in header */
  badge?: ReactNode
  /** Main content/children */
  children?: ReactNode
  /** Expandable details content */
  expandableContent?: ReactNode
  /** Label for expand button */
  expandLabel?: string
  /** Action buttons (Edit, Delete, etc.) */
  actions?: ReactNode
  /** Optional CSS class */
  className?: string
  /** Show loading skeleton state */
  isLoading?: boolean
  /** Whether expandable section is expanded by default */
  defaultExpanded?: boolean
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void
}

/**
 * MobileCard Component
 *
 * Responsive card component for displaying data on mobile
 * Replaces table rows on mobile devices
 *
 * Features:
 * - Bold title with primary/subtitle info
 * - Secondary info (muted color)
 * - Action buttons (edit/delete)
 * - Loading skeleton state
 * - Dark mode support
 * - Touch-friendly spacing (44px+ targets)
 * - Expandable content sections
 *
 * @example
 * <MobileCard
 *   title="Physiotherapie"
 *   primary="50€ / Sitzung"
 *   secondary="Ca. 15 Sitzungen/Monat"
 *   actions={
 *     <div className="flex gap-2">
 *       <Button size="sm" variant="ghost">Bearbeiten</Button>
 *       <Button size="sm" variant="ghost">Löschen</Button>
 *     </div>
 *   }
 * >
 *   Additional details here
 * </MobileCard>
 */
export function MobileCard({
  title,
  primary,
  secondary,
  subtitle,
  badge,
  actions,
  children,
  className,
  isLoading = false,
  expandableContent,
  expandLabel = 'Details anzeigen',
  defaultExpanded = false,
  onExpandChange,
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggleExpand = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onExpandChange?.(newState)
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          'rounded-lg p-4 mb-3',
          'animate-pulse',
          className
        )}
      >
        <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mb-3" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-2" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 dark:border-accent-700/20',
        'bg-white dark:bg-neutral-900/50 dark:backdrop-blur-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header with title, subtitle, and badge */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-accent-700/10">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {title}
            </h3>
            {(subtitle || primary) && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                {subtitle || primary}
              </p>
            )}
            {secondary && !subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {secondary}
              </p>
            )}
          </div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
      </div>

      {/* Main content */}
      {(children || expandableContent) && (
        <div className="px-4 py-3">{children}</div>
      )}

      {/* Expandable section */}
      {expandableContent && (
        <>
          <button
            onClick={handleToggleExpand}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2',
              'text-xs font-medium text-neutral-600 dark:text-neutral-400',
              'hover:bg-neutral-50 dark:hover:bg-accent-900/10',
              'border-t border-neutral-100 dark:border-accent-700/10',
              'transition-colors duration-200',
              'group'
            )}
            type="button"
          >
            <span className="group-hover:text-neutral-900 dark:group-hover:text-accent-300 transition-colors">
              {expandLabel}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </button>

          {isExpanded && (
            <div className="px-4 py-3 bg-neutral-50/50 dark:bg-accent-900/5 border-t border-neutral-100 dark:border-accent-700/10">
              {expandableContent}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex gap-2 px-4 py-3 border-t border-neutral-100 dark:border-accent-700/10">
          {actions}
        </div>
      )}
    </div>
  )
}

/**
 * MobileCardRow Component
 *
 * Utility component for displaying rows of key-value pairs
 * within mobile cards. Used for expandable detail sections.
 *
 * @example
 * <MobileCardRow label="Datum" value="15.01.2025" />
 * <MobileCardRow label="Betrag" value="€250,00" variant="highlight" />
 */
interface MobileCardRowProps {
  label: string
  value: ReactNode
  variant?: 'default' | 'highlight'
  className?: string
}

export function MobileCardRow({
  label,
  value,
  variant = 'default',
  className,
}: MobileCardRowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2', className)}>
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-semibold text-right',
          variant === 'highlight'
            ? 'text-accent-700 dark:text-accent-300'
            : 'text-neutral-900 dark:text-white'
        )}
      >
        {value}
      </span>
    </div>
  )
}
