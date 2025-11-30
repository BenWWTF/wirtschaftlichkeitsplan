'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Receipt, Calendar, Tag, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getTouchTargetClasses } from '@/hooks/useTouchTarget'

interface MobileExpenseCardProps {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  isRecurring?: boolean
  isPaid?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

/**
 * MobileExpenseCard Component
 *
 * Optimized card layout for displaying expenses on mobile devices.
 *
 * Features:
 * - Compact card layout with key information visible
 * - Expandable section for additional details
 * - Swipe-friendly action buttons
 * - Touch-optimized targets (44x44px minimum)
 * - Status indicators (recurring, paid)
 * - Visual hierarchy for amount and category
 */
export function MobileExpenseCard({
  id,
  amount,
  category,
  description,
  date,
  isRecurring = false,
  isPaid = false,
  onEdit,
  onDelete,
  className,
}: MobileExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedDate = format(new Date(date), 'dd. MMM yyyy', { locale: de })
  const formattedAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg border bg-white dark:bg-neutral-900',
        'border-neutral-200 dark:border-neutral-800',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Header: Amount and Category */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 truncate">
              {category}
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {formattedAmount}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col gap-1">
          {isRecurring && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                           bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Wiederkehrend
            </span>
          )}
          {isPaid && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                           bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Bezahlt
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <Calendar className="w-4 h-4" />
        <span>{formattedDate}</span>
      </div>

      {/* Description (if available) */}
      {description && (
        <div className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
          {description}
        </div>
      )}

      {/* Expandable Details Section */}
      {isExpanded && description && (
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong className="text-neutral-900 dark:text-neutral-100">Beschreibung:</strong>
            <p className="mt-1">{description}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        {/* Expand/Collapse Button */}
        {description && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-1 gap-2',
              getTouchTargetClasses('sm')
            )}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">Weniger</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">Mehr</span>
              </>
            )}
          </Button>
        )}

        {/* Edit Button */}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(id)}
            className={cn(
              'gap-2',
              getTouchTargetClasses('sm')
            )}
            aria-label="Ausgabe bearbeiten"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-sm">Bearbeiten</span>
          </Button>
        )}

        {/* Delete Button */}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className={cn(
              'gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              getTouchTargetClasses('sm')
            )}
            aria-label="Ausgabe löschen"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
