'use client'

import Link from 'next/link'
import { ChevronRight, Home, Calendar, BarChart3, Pill, Receipt, Calculator, FileText, Settings, TrendingUp } from 'lucide-react'
import { getRelatedPages, IconName } from '@/lib/config/page-relationships'
import { cn } from '@/lib/utils'

interface RelatedPagesProps {
  currentPage: string
  limit?: number
}

/**
 * Icon factory function - maps icon names to lucide-react components
 */
function getIconComponent(iconName: IconName) {
  const iconMap: Record<IconName, React.ReactNode> = {
    Home: <Home className="w-6 h-6" />,
    Calendar: <Calendar className="w-6 h-6" />,
    BarChart3: <BarChart3 className="w-6 h-6" />,
    Pill: <Pill className="w-6 h-6" />,
    Receipt: <Receipt className="w-6 h-6" />,
    Calculator: <Calculator className="w-6 h-6" />,
    FileText: <FileText className="w-6 h-6" />,
    Settings: <Settings className="w-6 h-6" />,
    TrendingUp: <TrendingUp className="w-6 h-6" />,
  }
  return iconMap[iconName]
}

/**
 * RelatedPages Component
 *
 * Displays cards showing related pages to help users discover connections
 * between different dashboard pages.
 *
 * Features:
 * - Responsive grid (1/2/3 columns based on breakpoint)
 * - Card hover effects with shadow lift
 * - Icon + title + description + navigation arrow
 * - Full dark mode support
 * - Accessible with proper keyboard navigation
 */
export function RelatedPages({ currentPage, limit = 4 }: RelatedPagesProps) {
  const relatedPages = getRelatedPages(currentPage, limit)

  if (relatedPages.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
        Related Pages
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {relatedPages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className={cn(
              'group rounded-lg border border-neutral-200 dark:border-neutral-700',
              'bg-white dark:bg-neutral-800',
              'p-4 md:p-6',
              'hover:shadow-md dark:hover:shadow-lg',
              'transition-shadow duration-200',
              'flex flex-col gap-3'
            )}
          >
            {/* Icon and Title Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-6 h-6 text-accent-600 dark:text-accent-400">
                  {getIconComponent(page.icon)}
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm md:text-base group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                  {page.title}
                </h3>
              </div>
              <ChevronRight className="flex-shrink-0 w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors" />
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {page.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
