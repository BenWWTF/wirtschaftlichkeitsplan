'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { generateBreadcrumbs } from '@/lib/config/breadcrumb-config'
import { cn } from '@/lib/utils'

/**
 * BreadcrumbNav Component
 *
 * Displays navigation breadcrumbs showing the user's current location
 * Example: Home / Monatliche Planung / November 2025
 *
 * Features:
 * - Clickable segments (except last) for quick navigation
 * - Mobile-friendly: shows only current page on small screens
 * - Full dark mode support
 * - Accessible with proper ARIA attributes
 */
export function BreadcrumbNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') || undefined

  // Generate breadcrumb items based on current route
  const items = generateBreadcrumbs(pathname, month)

  // Hide breadcrumbs on home page (redundant)
  if (items.length <= 1) {
    return null
  }

  return (
    <nav
      className="mb-6 flex items-center gap-1 flex-wrap"
      aria-label="Breadcrumb Navigation"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-1">
            {/* Separator (hidden on first item) */}
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
            )}

            {/* Breadcrumb Item */}
            {isLast ? (
              // Last item: not clickable, bold styling
              <span
                className="text-sm font-semibold text-neutral-900 dark:text-white"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // Clickable breadcrumb
              <Link
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  'text-accent-600 dark:text-accent-400',
                  'hover:text-accent-700 dark:hover:text-accent-300',
                  'hover:underline',
                  'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-950 rounded px-1'
                )}
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
