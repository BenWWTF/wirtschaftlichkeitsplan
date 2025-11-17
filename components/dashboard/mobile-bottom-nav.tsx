'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Pill, Calendar, Receipt, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MoreMenuDrawer } from '@/components/dashboard/more-menu-drawer'

interface NavTab {
  href: string
  label: string
  icon: React.ReactNode
  ariaLabel: string
}

const NAV_TABS: NavTab[] = [
  {
    href: '/dashboard',
    label: 'Übersicht',
    icon: <Home className="w-5 h-5" />,
    ariaLabel: 'Dashboard - Übersicht',
  },
  {
    href: '/dashboard/therapien',
    label: 'Therapien',
    icon: <Pill className="w-5 h-5" />,
    ariaLabel: 'Therapiearten verwalten',
  },
  {
    href: '/dashboard/planung',
    label: 'Planung',
    icon: <Calendar className="w-5 h-5" />,
    ariaLabel: 'Monatliche Planung',
  },
  {
    href: '/dashboard/ausgaben',
    label: 'Ausgaben',
    icon: <Receipt className="w-5 h-5" />,
    ariaLabel: 'Ausgaben verwalten',
  },
]

interface MobileBottomNavProps {
  onMoreClick?: () => void
}

/**
 * MobileBottomNav Component
 *
 * Fixed bottom navigation bar for mobile with:
 * - 5-tab layout (4 primary + More button)
 * - Active tab indication with accent underline
 * - Icon + label for each tab
 * - Touch feedback animations
 * - Safe area handling for notched devices
 * - Mobile-only rendering
 * - More menu drawer for secondary navigation
 */
export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-neutral-900/95 dark:backdrop-blur-md border-t border-neutral-200 dark:border-accent-700/20 safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile Navigation"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex h-16 divide-x divide-neutral-100 dark:divide-accent-700/10">
        {/* Primary Nav Tabs */}
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200',
              'text-xs font-medium min-h-16',
              'border-b-[3px] border-transparent',
              isActive(tab.href)
                ? 'text-accent-700 dark:text-accent-300 border-accent-700 dark:border-accent-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-accent-300'
            )}
            aria-label={tab.ariaLabel}
            aria-current={isActive(tab.href) ? 'page' : undefined}
            title={tab.label}
          >
            <span className="flex-shrink-0 flex items-center justify-center">
              {tab.icon}
            </span>
            <span className="truncate">{tab.label}</span>
          </Link>
        ))}

        {/* More Button */}
        <Button
          onClick={() => setMoreMenuOpen(true)}
          variant="ghost"
          size="sm"
          className={cn(
            'flex-1 h-16 flex flex-col items-center justify-center gap-1 rounded-none border-none',
            'text-xs font-medium text-neutral-600 dark:text-neutral-400',
            'hover:text-neutral-900 dark:hover:text-accent-300 hover:bg-transparent'
          )}
          aria-label="More options"
          title="Mehr Optionen"
        >
          <span className="flex-shrink-0 flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </span>
          <span className="truncate">Mehr</span>
        </Button>
      </div>

      {/* More Menu Drawer */}
      <MoreMenuDrawer open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
    </nav>
  )
}

/**
 * Hook to determine if a route is the dashboard overview
 */
export function useIsActiveDashboardTab(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname.startsWith(href)
}
