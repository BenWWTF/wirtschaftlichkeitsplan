'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, Calendar, Pill, BarChart, FileText, Calculator, Settings, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { MoreMenuDrawer } from '@/components/dashboard/more-menu-drawer'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  ariaLabel: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Übersicht',
    icon: <Home className="w-5 h-5" />,
    ariaLabel: 'Dashboard - Übersicht',
  },
  {
    href: '/dashboard/ausgaben',
    label: 'Ausgaben',
    icon: <Receipt className="w-5 h-5" />,
    ariaLabel: 'Ausgaben verwalten',
  },
  {
    href: '/dashboard/planung',
    label: 'Planung',
    icon: <Calendar className="w-5 h-5" />,
    ariaLabel: 'Monatliche Planung',
  },
  {
    href: '/dashboard/therapien',
    label: 'Therapien',
    icon: <Pill className="w-5 h-5" />,
    ariaLabel: 'Therapie-Übersicht',
  },
  {
    href: '/dashboard/ergebnisse',
    label: 'Ergebnisse',
    icon: <BarChart className="w-5 h-5" />,
    ariaLabel: 'Ergebnisse anzeigen',
  },
]

/**
 * LandscapeNav Component
 *
 * Horizontal navigation bar optimized for landscape orientation on mobile devices.
 *
 * Features:
 * - Horizontal layout with icon-only navigation
 * - Fixed to top with 64px height
 * - Tooltips for labels (on hover/long-press)
 * - Active tab indication
 * - Touch-friendly targets (44x44px minimum)
 * - Only visible on landscape mobile (< 768px width)
 * - More menu for additional options
 *
 * Usage:
 * Add this component to dashboard layout alongside regular nav
 */
export function LandscapeNav() {
  const pathname = usePathname()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Landscape Navigation - Only visible in landscape mode on mobile */}
      <nav
        className="hidden landscape:flex landscape:max-md:flex fixed top-0 left-0 right-0 z-50
                   bg-white dark:bg-neutral-900/95 dark:backdrop-blur-md
                   border-b border-neutral-200 dark:border-accent-700/20 h-16
                   md:hidden"
        role="navigation"
        aria-label="Landscape Navigation"
      >
        <div className="flex items-center w-full px-2 gap-1">
          {/* Navigation Items */}
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-center min-w-[44px] min-h-[44px] w-14 h-14',
                'rounded-lg transition-all duration-200',
                'relative group',
                isActive(item.href)
                  ? 'text-accent-700 dark:text-accent-300 bg-accent-50 dark:bg-accent-900/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-accent-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
              aria-label={item.ariaLabel}
              aria-current={isActive(item.href) ? 'page' : undefined}
              title={item.label}
            >
              {item.icon}

              {/* Tooltip on hover */}
              <span
                className="absolute top-full mt-1 px-2 py-1 text-xs font-medium
                           bg-neutral-900 dark:bg-neutral-100
                           text-white dark:text-neutral-900
                           rounded opacity-0 group-hover:opacity-100
                           transition-opacity duration-200 pointer-events-none
                           whitespace-nowrap z-10"
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5
                                 bg-accent-700 dark:bg-accent-400 rounded-full" />
              )}
            </Link>
          ))}

          {/* Spacer to push More button to the right */}
          <div className="flex-1" />

          {/* More Button */}
          <Button
            onClick={() => setMoreMenuOpen(true)}
            variant="ghost"
            size="sm"
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] w-14 h-14',
              'rounded-lg',
              'text-neutral-600 dark:text-neutral-400',
              'hover:text-neutral-900 dark:hover:text-accent-300',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800',
              'relative group'
            )}
            aria-label="More options"
            title="Mehr Optionen"
          >
            <Menu className="w-5 h-5" />

            {/* Tooltip */}
            <span
              className="absolute top-full mt-1 px-2 py-1 text-xs font-medium
                         bg-neutral-900 dark:bg-neutral-100
                         text-white dark:text-neutral-900
                         rounded opacity-0 group-hover:opacity-100
                         transition-opacity duration-200 pointer-events-none
                         whitespace-nowrap z-10"
            >
              Mehr
            </span>
          </Button>
        </div>
      </nav>

      {/* More Menu Drawer */}
      <MoreMenuDrawer open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
    </>
  )
}
