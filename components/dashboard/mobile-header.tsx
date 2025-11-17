'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  practiceName?: string
}

/**
 * MobileHeader Component
 *
 * Minimal header for mobile pages with:
 * - Section title and optional subtitle
 * - Optional back button
 * - Branding/practice name
 * - Dark mode compatible
 */
export function MobileHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  practiceName,
}: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-neutral-900/80 dark:backdrop-blur-md border-b border-neutral-200 dark:border-accent-700/20">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 -ml-2"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {subtitle}
            </p>
          )}
          {!subtitle && practiceName && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
              {practiceName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
