'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BarChart3, Calendar, FileText, Pill, Home, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  shortcut?: string
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
    href: '/dashboard/planung',
    label: 'Planung',
    icon: <Calendar className="w-5 h-5" />,
    shortcut: 'Alt+P',
  },
  {
    href: '/dashboard/analyse',
    label: 'Break-Even',
    icon: <BarChart3 className="w-5 h-5" />,
    shortcut: 'Alt+A',
  },
  {
    href: '/dashboard/berichte',
    label: 'Berichte',
    icon: <FileText className="w-5 h-5" />,
    shortcut: 'Alt+R',
  },
]

/**
 * DashboardNav Component
 *
 * Persistent navigation sidebar for dashboard routes with:
 * - Active page indicator
 * - Icon-based navigation
 * - Keyboard shortcuts (Alt+key)
 * - Responsive mobile menu
 * - Dark mode support
 */
export function DashboardNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        a: '/dashboard/analyse',
        r: '/dashboard/berichte',
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
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-neutral-200 md:bg-white md:dark:border-accent-700/30 md:dark:bg-neutral-900/80 md:backdrop-blur-md">
        {/* Logo/Header */}
        <div className="border-b border-neutral-200 px-6 py-6 dark:border-accent-700/20">
          <div className="flex items-baseline gap-2">
            <Briefcase className="h-6 w-6 text-neutral-900 dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                Wirtschaftlich
              </h1>
              <p className="text-xs text-accent-600 dark:text-accent-300 font-medium mt-0.5">
                FINANZPLAN
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1" role="navigation" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 min-h-[44px]',
                'text-sm font-medium group',
                isActive(item.href)
                  ? 'bg-accent-100 text-accent-900 dark:bg-accent-900/30 dark:text-accent-200 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100/60 dark:text-neutral-400 dark:hover:bg-accent-900/10 hover:text-neutral-900 dark:hover:text-accent-300'
              )}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              title={`${item.label} (${item.shortcut})`}
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
              {item.shortcut && (
                <kbd className="hidden xl:inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800/60 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700/60">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-3 py-4 dark:border-accent-700/20">
          <div className="px-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              v1.0
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                Online
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden border-b border-neutral-200 bg-white dark:border-accent-700/20 dark:bg-neutral-900/80 dark:backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-neutral-900 dark:text-white" />
            <div>
              <h1 className="text-sm font-bold text-neutral-900 dark:text-white">
                Wirtschaftlich
              </h1>
              <p className="text-xs text-accent-600 dark:text-accent-300 font-medium">
                FINANZPLAN
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-accent-300"
            aria-label={isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu - Dropdown */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-menu"
            className="border-t border-neutral-200 bg-neutral-50 dark:border-accent-700/20 dark:bg-neutral-900/60 max-h-[calc(100vh-56px)] overflow-y-auto"
            role="navigation"
            aria-label="Mobile Navigation"
          >
            <div className="space-y-1 p-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 min-h-[44px]',
                    'text-sm font-medium',
                    isActive(item.href)
                      ? 'bg-accent-100 text-accent-900 dark:bg-accent-900/30 dark:text-accent-200'
                      : 'text-neutral-700 hover:bg-white dark:text-neutral-300 dark:hover:bg-accent-900/10 dark:hover:text-accent-300'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  title={`${item.label} (${item.shortcut})`}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-14 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
