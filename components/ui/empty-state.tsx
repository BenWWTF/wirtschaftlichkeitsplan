'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState Component
 *
 * Displays a user-friendly empty state with icon, title, description, and optional action button.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={AlertCircle}
 *   title="Keine Therapiearten vorhanden"
 *   description="Erstellen Sie Ihre erste Therapieart, um zu beginnen."
 *   action={{
 *     label: "Therapieart erstellen",
 *     onClick: () => setShowDialog(true)
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center',
        className
      )}
    >
      {Icon && (
        <Icon className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
      )}
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
