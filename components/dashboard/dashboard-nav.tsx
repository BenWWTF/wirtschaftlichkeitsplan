'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, FileText, Pill, Home, Receipt, Settings, Calculator, BarChart3, ChevronDown, ChevronRight, CalendarRange, TrendingUp, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/components/ui/hooks/useMediaQuery'
import { MobileBottomNav } from './mobile-bottom-nav'
import { RecentActivityFeed } from './recent-activity-feed'

interface NavItem {
  href?: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  children?: NavItem[]
  group?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Übersicht',
    icon: <Home className="w-5 h-5" />,
    shortcut: 'Alt+H',
  },
  {
    href: '/dashboard/therapien',
    label: 'Therapiearten',
    icon: <Pill className="w-5 h-5" />,
    shortcut: 'Alt+T',
  },
  {
    href: '/dashboard/ausgaben',
    label: 'Ausgaben',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    label: 'Planung',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      {
        href: '/dashboard/planung',
        label: 'Monatliche Planung',
        icon: <Calendar className="w-5 h-5" />,
        shortcut: 'Alt+P',
      },
      {
        href: '/dashboard/planung-jaehrlich',
        label: 'Jährliche Planung',
        icon: <CalendarRange className="w-5 h-5" />,
      },
    ],
  },
  {
    label: 'Ergebnisse',
    icon: <PieChart className="w-5 h-5" />,
    children: [
      {
        href: '/dashboard/ergebnisse',
        label: 'Monatliche Ergebnisse',
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        href: '/dashboard/berichte',
        label: 'Geschäftsberichte',
        icon: <FileText className="w-5 h-5" />,
        shortcut: 'Alt+R',
      },
      {
        href: '/dashboard/steuerprognose',
        label: 'Meine Steuerprognose',
        icon: <Calculator className="w-5 h-5" />,
        shortcut: 'Alt+S',
      },
    ],
  },
  {
    href: '/dashboard/einstellungen',
    label: 'Einstellungen',
    icon: <Settings className="w-5 h-5" />,
  },
]

interface DashboardNavProps {
  practiceName?: string
}

/**
 * DashboardNav Component
 *
 * Persistent navigation sidebar for dashboard routes with:
 * - Active page indicator
 * - Icon-based navigation
 * - Collapsible grouped sections
 * - Auto-expand active groups
 * - Keyboard shortcuts (Alt+key)
 * - Responsive mobile menu
 * - Dark mode support
 * - Ordination name display
 */
export function DashboardNav({ practiceName = '' }: DashboardNavProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Initialize with all groups expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const groups = new Set<string>()
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        groups.add(item.label)
      }
    })
    return groups
  })
  const isMobile = useIsMobile()

  // Keep groups expanded even when navigating
  useEffect(() => {
    // Groups stay expanded - no need to collapse them
  }, [pathname])

  // Handle keyboard shortcuts: Alt+H, Alt+T, Alt+P, Alt+A, Alt+R, Escape to close mobile menu
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Close mobile menu on Escape
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        return
      }

      if (!e.altKey) return

      const shortcuts: Record<string, string> = {
        h: '/dashboard',
        t: '/dashboard/therapien',
        p: '/dashboard/planung',
        r: '/dashboard/berichte',
        s: '/dashboard/steuerprognose',
      }

      const href = shortcuts[e.key.toLowerCase()]
      if (href) {
        window.location.href = href
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isMobileMenuOpen])

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    // Exact match or match with trailing slash, but not substring matches
    return pathname === href || pathname === `${href}/`
  }

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel)
      } else {
        newSet.add(groupLabel)
      }
      return newSet
    })
  }

  const renderNavItem = (item: NavItem, isChild = false) => {
    // Group header (collapsible)
    if (item.children) {
      const isExpanded = expandedGroups.has(item.label)
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleGroup(item.label)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 min-h-[44px] w-full',
              'text-sm font-medium group',
              'text-neutral-600 hover:bg-neutral-100/60 dark:text-neutral-200 dark:hover:bg-accent-900/10 hover:text-neutral-900 dark:hover:text-accent-300'
            )}
            aria-expanded={isExpanded}
            title={item.label}
          >
            <span className="flex-shrink-0 w-5 h-5 transition-colors text-neutral-400 group-hover:text-accent-600 dark:group-hover:text-accent-400">
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            <span className="flex-shrink-0 w-5 h-5 transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </span>
          </button>
          {isExpanded && (
            <div className="space-y-1 mt-1">
              {item.children.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    // Regular nav item
    if (item.href) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-full py-2 transition-all duration-300 min-h-[44px]',
            'text-sm font-medium group',
            isChild ? 'pl-9 pr-4' : 'px-4',
            isActive(item.href)
              ? 'bg-accent-500/15 text-accent-800 dark:text-accent-200 font-semibold'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-accent-300'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-current={isActive(item.href) ? 'page' : undefined}
          title={item.label}
        >
          <span className={cn(
            'flex-shrink-0 w-5 h-5 transition-colors',
            isActive(item.href)
              ? 'text-accent-700 dark:text-accent-300'
              : 'text-neutral-400 group-hover:text-accent-600 dark:group-hover:text-accent-400'
          )}>
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
        </Link>
      )
    }

    return null
  }

  // On mobile, render MobileBottomNav instead
  if (isMobile) {
    return <MobileBottomNav />
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className="fixed top-0 left-0 w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 dark:bg-neutral-900/60 dark:backdrop-blur-xl dark:border-white/5 flex flex-col h-screen overflow-y-auto"
      >
        {/* Logo/Header */}
        <Link href="/dashboard" className="border-b border-neutral-200 px-6 py-6 dark:border-accent-700/20 hover:opacity-80 transition-opacity block flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white block">ORDI PRO</span>
            {practiceName && (
              <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate block">
                {practiceName}
              </span>
            )}
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1" role="navigation" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => renderNavItem(item))}
        </nav>

        {/* Recent Activity Feed */}
        <div className="border-t border-neutral-200 dark:border-accent-700/20 py-6 px-3">
          <RecentActivityFeed />
        </div>

      </nav>
    </>
  )
}
