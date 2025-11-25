'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MobileCardProps {
  /**
   * Main title/label displayed at the top
   */
  title: string

  /**
   * Subtitle or secondary info
   */
  subtitle?: string

  /**
   * Primary badge or status display (right side of header)
   */
  badge?: ReactNode

  /**
   * Main content displayed above expandable section
   */
  children: ReactNode

  /**
   * Optional expandable detail content
   */
  expandableContent?: ReactNode

  /**
   * Label for expand/collapse button
   */
  expandLabel?: string

  /**
   * Action buttons displayed at the bottom
   */
  actions?: ReactNode

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Whether this card is initially expanded
   */
  defaultExpanded?: boolean

  /**
   * Callback when expand state changes
   */
  onExpandChange?: (expanded: boolean) => void
}

/**
 * MobileCard Component
 *
 * Optimized card component for mobile that displays:
 * - Title + subtitle header with optional badge
 * - Main content area
 * - Optional expandable details section
 * - Action buttons (edit, delete) at bottom
 *
 * Used for converting table rows to mobile-friendly cards.
 * Supports dark mode and touch-friendly spacing.
 */
export function MobileCard({
  title,
  subtitle,
  badge,
  children,
  expandableContent,
  expandLabel = 'Details anzeigen',
  actions,
  className,
  defaultExpanded = false,
  onExpandChange,
}: MobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleToggleExpand = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onExpandChange?.(newState)
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
            {subtitle && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-3">{children}</div>

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

      {/* Action buttons */}
      {actions && (
        <div
          className={cn(
            'px-4 py-3',
            expandableContent && 'border-t border-neutral-100 dark:border-accent-700/10',
            'flex items-center justify-end gap-2'
          )}
        >
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
