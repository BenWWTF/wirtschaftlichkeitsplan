'use client'

import Link from 'next/link'

interface MobileHeaderProps {
  practiceName?: string
  showBackButton?: boolean
  onBack?: () => void
}

/**
 * MobileHeader Component
 *
 * Minimal header for mobile that appears above the bottom navigation
 * Shows practice branding and optional back button
 *
 * Features:
 * - Branding (Ordi + practice name)
 * - Optional back button
 * - Dark mode support
 * - Compact design (minimal space usage)
 *
 * @example
 * <MobileHeader
 *   practiceName="Praxis Schmidt"
 *   showBackButton={true}
 *   onBack={() => history.back()}
 * />
 */
export function MobileHeader({
  practiceName = '',
  showBackButton = false,
  onBack,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-neutral-200 bg-white dark:border-accent-700/20 dark:bg-neutral-900/80 dark:backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {/* Back button or logo */}
        {showBackButton ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-accent-300 transition-colors"
            aria-label="Zurück"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity flex items-center gap-2">
            <span className="text-lg font-bold text-neutral-900 dark:text-white">Ordi</span>
          </Link>
        )}

        {/* Practice name (if available and no back button) */}
        {practiceName && !showBackButton && (
          <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1 text-center px-2">
            {practiceName}
          </span>
        )}

        {/* Spacer for centering */}
        {showBackButton && <div className="flex-1" />}
      </div>
    </header>
  )
}
