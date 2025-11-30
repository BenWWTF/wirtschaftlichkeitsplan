'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

/**
 * Breadcrumb Navigation Component
 *
 * Displays a hierarchy of pages with links to navigate back through the site structure.
 * Always includes Dashboard as the root/hub.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Planning', href: '/planning', icon: <PlanIcon /> },
 *     { label: 'Therapy Types', href: '/planning/therapies' }
 *   ]}
 * />
 * // Renders: Home > Dashboard > Planning > Therapy Types
 * ```
 */
export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname()

  // Build the full breadcrumb trail
  const breadcrumbs: Array<{ label: string; href: string; icon?: React.ReactNode; isActive: boolean }> = []

  if (showHome) {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
      isActive: pathname === '/dashboard'
    })
  }

  // Add provided items
  items.forEach((item, index) => {
    breadcrumbs.push({
      ...item,
      isActive: pathname === item.href || (index === items.length - 1)
    })
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((crumb, index) => (
          <li key={`${crumb.href}-${index}`} className="flex items-center gap-1">
            {/* Link for non-active items */}
            {!crumb.isActive ? (
              <Link
                href={crumb.href}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                {crumb.icon && <span className="h-4 w-4">{crumb.icon}</span>}
                <span>{crumb.label}</span>
              </Link>
            ) : (
              /* Active item - not a link */
              <span className="flex items-center gap-1 px-2 py-1 text-neutral-900 dark:text-neutral-50 font-medium">
                {crumb.icon && <span className="h-4 w-4">{crumb.icon}</span>}
                <span>{crumb.label}</span>
              </span>
            )}

            {/* Divider - only show between items */}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight className="h-4 w-4 text-neutral-400 mx-1" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
