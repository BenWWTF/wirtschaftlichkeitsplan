'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Calendar, FileText, Pill, Home, Receipt, Settings, Calculator, BarChart3, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/components/ui/hooks/useMediaQuery'
import { MobileBottomNav } from './mobile-bottom-nav'
import { ThemeToggle } from './theme-toggle'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

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
    label: 'Monatliche Planung',
    icon: <Calendar className="w-5 h-5" />,
    shortcut: 'Alt+P',
  },
  {
    href: '/dashboard/ergebnisse',
    label: 'Monatliche Ergebnisse',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    href: '/dashboard/ausgaben',
    label: 'Ausgaben',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    href: '/dashboard/steuerprognose',
    label: 'Meine Steuerprognose',
    icon: <Calculator className="w-5 h-5" />,
    shortcut: 'Alt+S',
  },
  {
    href: '/dashboard/berichte',
    label: 'Geschäftsberichte',
    icon: <FileText className="w-5 h-5" />,
    shortcut: 'Alt+R',
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
 * - Keyboard shortcuts (Alt+key)
 * - Responsive mobile menu
 * - Dark mode support
 * - Ordination name display
 */
export function DashboardNav({ practiceName = '' }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isMobile = useIsMobile()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

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
    return pathname.startsWith(href)
  }

  // On mobile, render MobileBottomNav instead
  if (isMobile) {
    return <MobileBottomNav />
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className="fixed top-0 left-0 w-64 border-r border-neutral-200 bg-white dark:border-accent-700/30 dark:bg-neutral-900/80 dark:backdrop-blur-md flex flex-col h-screen overflow-y-auto"
      >
        {/* Logo/Header */}
        <Link href="/dashboard" className="border-b border-neutral-200 px-6 py-6 dark:border-accent-700/20 hover:opacity-80 transition-opacity block flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <span className="text-xl font-bold text-neutral-900 dark:text-white block">Ordi</span>
            {practiceName && (
              <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate block">
                {practiceName}
              </span>
            )}
          </div>
        </Link>

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
                  : 'text-neutral-600 hover:bg-neutral-100/60 dark:text-neutral-200 dark:hover:bg-accent-900/10 hover:text-neutral-900 dark:hover:text-accent-300'
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
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-3 py-4 dark:border-accent-700/20 space-y-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 dark:text-neutral-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 min-h-[44px] disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{isLoggingOut ? 'Abmelden...' : 'Abmelden'}</span>
          </button>
          <div className="px-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              v1.0
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-neutral-500 dark:text-neutral-300">
                Online
              </span>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
