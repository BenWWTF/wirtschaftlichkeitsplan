'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileFormProps {
  /** Form title */
  title?: string
  /** Form fields content */
  children: ReactNode
  /** Submit button content */
  submitLabel?: string
  /** Cancel/close action */
  onCancel?: () => void
  /** Form submission handler */
  onSubmit?: (e: React.FormEvent) => void
  /** CSS class */
  className?: string
  /** Show loading state */
  isLoading?: boolean
}

/**
 * MobileForm Component
 *
 * Optimized form wrapper for mobile screens
 * Full-screen modal styling with sticky submit button
 *
 * Features:
 * - Full-screen modal layout on mobile
 * - Sticky submit button at bottom (respects safe area)
 * - Single column responsive layout
 * - Full-width inputs (no 2-column layouts)
 * - 16px font size (prevents iOS zoom)
 * - 44px+ touch targets for inputs/buttons
 * - Scrollable content area
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <MobileForm
 *   title="Neue Therapie"
 *   submitLabel="Erstellen"
 *   onCancel={() => setOpen(false)}
 *   onSubmit={(e) => handleSubmit(e)}
 * >
 *   {form fields here}
 * </MobileForm>
 * ```
 */
export function MobileForm({
  title,
  children,
  submitLabel = 'Speichern',
  onCancel,
  onSubmit,
  className,
  isLoading = false,
}: MobileFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'md:hidden fixed inset-0 z-50',
        'flex flex-col bg-white dark:bg-neutral-900',
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {title}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            aria-label="Schließen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </div>

      {/* Sticky Footer with Submit Button */}
      <div
        className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        }}
      >
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full h-12 px-4',
            'bg-accent-600 hover:bg-accent-700 dark:bg-accent-700 dark:hover:bg-accent-600',
            'text-white font-medium text-base',
            'rounded-md transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isLoading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Wird gespeichert...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
