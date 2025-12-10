'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import {
  Calculator,
  FileText,
  Settings,
  Upload,
  CreditCard,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DrawerPrimitive } from '@/components/ui/drawer-primitive'

interface MoreMenuDrawerProps {
  /** Is drawer open? */
  isOpen: boolean
  /** Close drawer callback */
  onClose: () => void
  /** Optional logout handler */
  onLogout?: () => void
}

interface DrawerItem {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  action?: () => void
  divider?: boolean
}

// Secondary navigation items for More menu
const DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'tax-forecast',
    label: 'Steuerprognose',
    href: '/dashboard/steuerprognose',
    icon: <Calculator className="w-5 h-5" />,
  },
  {
    id: 'reports',
    label: 'Geschäftsberichte',
    href: '/dashboard/berichte',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'import',
    label: 'Daten Import',
    href: '/dashboard/import',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    href: '/dashboard/einstellungen',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: 'divider-1',
    label: '',
    divider: true,
  },
  {
    id: 'billing',
    label: 'Abonnement & Billing',
    href: '/dashboard/billing',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'help',
    label: 'Hilfe',
    href: '/dashboard/help',
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    id: 'divider-2',
    label: '',
    divider: true,
  },
  {
    id: 'logout',
    label: 'Abmelden',
    icon: <LogOut className="w-5 h-5" />,
  },
]

/**
 * MoreMenuDrawer Component
 *
 * Bottom drawer for secondary navigation
 * Opened via "Mehr" tab in mobile bottom navigation
 *
 * Features:
 * - 8 secondary menu items organized with dividers
 * - Smooth slide-up animation
 * - Dismissible (click overlay, swipe down, Escape)
 * - Safe area padding for notches
 * - Dark mode support
 * - Keyboard navigation
 *
 * @example
 * <MoreMenuDrawer
 *   isOpen={isMoreOpen}
 *   onClose={() => setIsMoreOpen(false)}
 *   onLogout={() => handleLogout()}
 * />
 */
export function MoreMenuDrawer({
  isOpen,
  onClose,
  onLogout,
}: MoreMenuDrawerProps) {
  const handleItemClick = (item: DrawerItem) => {
    if (item.action) {
      item.action()
    }
    // Auto-close drawer after navigation
    if (item.href) {
      onClose()
    }
  }

  return (
    <DrawerPrimitive isOpen={isOpen} onClose={onClose}>
      <nav
        className="space-y-1"
        role="navigation"
        aria-label="Additional Navigation"
      >
        {DRAWER_ITEMS.map((item) => {
          // Divider
          if (item.divider) {
            return (
              <div
                key={item.id}
                className="my-3 border-t border-neutral-200 dark:border-neutral-800"
              />
            )
          }

          // Link items
          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-3',
                  'min-h-[44px]',
                  'text-sm font-medium',
                  'text-neutral-700 dark:text-neutral-300',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800/50',
                  'transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600'
                )}
              >
                <span className="text-neutral-500 dark:text-neutral-400">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          }

          // Action items (logout)
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout' && onLogout) {
                  onLogout()
                }
                handleItemClick(item)
              }}
              className={cn(
                'w-full flex items-center gap-3 rounded-md px-4 py-3',
                'min-h-[44px]',
                'text-sm font-medium',
                'text-red-600 dark:text-red-400',
                'hover:bg-red-50 dark:hover:bg-red-900/20',
                'transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600'
              )}
            >
              <span className="text-red-600 dark:text-red-400">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </DrawerPrimitive>
  )
}
