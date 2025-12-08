'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileCardProps {
  /** Main title/header of the card */
  title: string
  /** Primary information to display below title */
  primary?: ReactNode
  /** Secondary information */
  secondary?: ReactNode
  /** Action buttons (Edit, Delete, etc.) */
  actions?: ReactNode
  /** Content inside expandable section */
  children?: ReactNode
  /** Optional CSS class */
  className?: string
  /** Show loading skeleton state */
  isLoading?: boolean
}

/**
 * MobileCard Component
 *
 * Responsive card component for displaying data on mobile
 * Replaces table rows on mobile devices
 *
 * Features:
 * - Bold title with primary info
 * - Secondary info (muted color)
 * - Action buttons (edit/delete)
 * - Loading skeleton state
 * - Dark mode support
 * - Touch-friendly spacing (44px+ targets)
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
  actions,
  children,
  className,
  isLoading = false,
}: MobileCardProps) {
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
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-lg p-4 mb-3',
        'transition-all duration-200',
        'hover:border-neutral-300 dark:hover:border-neutral-700',
        className
      )}
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1 truncate">
        {title}
      </h3>

      {/* Primary Info */}
      {primary && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-1">
          {primary}
        </p>
      )}

      {/* Secondary Info */}
      {secondary && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
          {secondary}
        </p>
      )}

      {/* Content */}
      {children && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 mb-3">
          {children}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          {actions}
        </div>
      )}
    </div>
  )
}
