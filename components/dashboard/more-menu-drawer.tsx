'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Calculator, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Drawer } from '@/components/ui/drawer'

interface MoreMenuDrawerProps {
  /**
   * Whether the drawer is open
   */
  open: boolean

  /**
   * Callback when drawer should close
   */
  onOpenChange: (open: boolean) => void
}

interface MoreNavItem {
  href: string
  label: string
  icon: React.ReactNode
  shortcut?: string
}

const MORE_NAV_ITEMS: MoreNavItem[] = [
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

/**
 * MoreMenuDrawer Component
 *
 * Bottom sheet drawer showing secondary navigation items
 * for mobile. Displayed when "Mehr" button is tapped in
 * mobile bottom navigation.
 *
 * Features:
 * - Shows secondary nav items: Tax prediction, Reports, Settings
 * - Active page highlighting
 * - Keyboard shortcut hints
 * - Drag to close support
 * - Full dark mode support
 */
export function MoreMenuDrawer({ open, onOpenChange }: MoreMenuDrawerProps) {
  const pathname = usePathname()

  const isActive = (href: string): boolean => {
    return pathname.startsWith(href)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Mehr"
      position="bottom"
      className="rounded-t-2xl"
    >
      <nav className="space-y-1">
        {MORE_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onOpenChange(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
              'text-sm font-medium min-h-12',
              isActive(item.href)
                ? 'bg-accent-100 text-accent-900 dark:bg-accent-900/30 dark:text-accent-200'
                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-accent-900/10 dark:hover:text-accent-300'
            )}
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
          >
            <span className={cn(
              'flex-shrink-0 w-5 h-5 transition-colors',
              isActive(item.href)
                ? 'text-accent-700 dark:text-accent-300'
                : 'text-neutral-400 group-hover:text-accent-600 dark:group-hover:text-accent-400'
            )}>
              {item.icon}
            </span>
            <div className="flex-1">
              <div className="font-medium">{item.label}</div>
            </div>
            {item.shortcut && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                {item.shortcut}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </Drawer>
  )
}
