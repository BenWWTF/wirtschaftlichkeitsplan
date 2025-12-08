'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Pill,
  Calendar,
  Receipt,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavTab {
  id: string
  href: string
  label: string
  icon: React.ReactNode
  shortcut?: string
}

// Primary 5 tabs for bottom navigation
const PRIMARY_TABS: NavTab[] = [
  {
    id: 'home',
    href: '/dashboard',
    label: 'Übersicht',
    icon: <Home className="w-5 h-5" />,
    shortcut: 'Alt+H',
  },
  {
    id: 'therapies',
    href: '/dashboard/therapien',
    label: 'Therapien',
    icon: <Pill className="w-5 h-5" />,
    shortcut: 'Alt+T',
  },
  {
    id: 'planning',
    href: '/dashboard/planung',
    label: 'Planung',
    icon: <Calendar className="w-5 h-5" />,
    shortcut: 'Alt+P',
  },
  {
    id: 'expenses',
    href: '/dashboard/ausgaben',
    label: 'Ausgaben',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    id: 'more',
    href: '#',
    label: 'Mehr',
    icon: <MoreHorizontal className="w-5 h-5" />,
  },
]

interface MobileBottomNavProps {
  onMoreClick?: () => void
}

/**
 * MobileBottomNav Component
 *
 * Bottom navigation bar for mobile with 5 primary tabs
 * Last tab opens a "More" menu drawer for secondary navigation
 *
 * Features:
 * - 5 accessible tabs with icon + label
 * - Active tab highlighting
 * - Touch feedback animations
 * - Dark mode support
 * - Keyboard shortcuts (Alt+key)
 * - Indicator badge for active state
 * - Mobile-only (hidden on desktop with md:hidden)
 *
 * @example
 * <MobileBottomNav onMoreClick={() => setDrawerOpen(true)} />
 */
export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Hydration safety
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle keyboard shortcuts: Alt+H, Alt+T, Alt+P
  useEffect(() => {
    if (!isClient) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!e.altKey) return

      const shortcuts: Record<string, string> = {
        h: '/dashboard',
        t: '/dashboard/therapien',
        p: '/dashboard/planung',
      }

      const href = shortcuts[e.key.toLowerCase()]
      if (href) {
        window.location.href = href
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isClient])

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (href === '#') {
      return false // More button never active
    }
    return pathname.startsWith(href)
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onMoreClick?.()
  }

  if (!isClient) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-neutral-200 bg-white dark:border-accent-700/20 dark:bg-neutral-900/80 dark:backdrop-blur-md"
      role="tablist"
      aria-label="Bottom Navigation"
      style={{
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-stretch h-16">
        {PRIMARY_TABS.map((tab) => {
          const active = isActive(tab.href)

          const tabContent = (
            <>
              {/* Icon */}
              <div
                className={cn(
                  'w-5 h-5 transition-colors',
                  active
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                )}
              >
                {tab.icon}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium mt-1 transition-colors',
                  active
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-neutral-700 dark:text-neutral-400'
                )}
              >
                {tab.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-accent-600 dark:bg-accent-400"
                  aria-hidden="true"
                />
              )}
            </>
          )

          if (tab.href === '#') {
            // More button - use button element
            return (
              <button
                key={tab.id}
                onClick={handleMoreClick}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 relative',
                  'transition-colors duration-200',
                  'text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100',
                  'dark:text-neutral-400 dark:hover:bg-accent-900/10 dark:active:bg-accent-900/20',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900'
                )}
                type="button"
                role="tab"
                aria-selected={false}
                title={tab.label}
              >
                {tabContent}
              </button>
            )
          }

          // Regular navigation links
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 relative',
                'transition-colors duration-200 min-h-16',
                active
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-accent-900/10 dark:active:bg-accent-900/20',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900'
              )}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              title={`${tab.label}${tab.shortcut ? ` (${tab.shortcut})` : ''}`}
            >
              {tabContent}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
