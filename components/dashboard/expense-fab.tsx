'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Upload, Stethoscope } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ExpenseDialogEnhanced } from './expense-dialog-enhanced'

interface FabAction {
  label: string
  icon: typeof Plus
  action: string
}

/**
 * Context-aware Floating Action Button
 *
 * Shows different actions depending on the current page:
 * - /dashboard/ausgaben → Neue Ausgabe erfassen
 * - /dashboard → Neue Ausgabe erfassen (quick access from overview)
 * - /dashboard/ergebnisse → Ergebnisse importieren (dispatches custom event)
 * - /dashboard/therapien → Neue Therapieart (dispatches custom event)
 * - Other pages → hidden
 */
export function ExpenseFab() {
  const pathname = usePathname()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const fabAction = useMemo((): FabAction | null => {
    if (pathname === '/dashboard/ausgaben') {
      return { label: 'Neue Ausgabe erfassen', icon: Plus, action: 'expense' }
    }
    if (pathname === '/dashboard/ergebnisse') {
      return { label: 'Ergebnisse importieren', icon: Upload, action: 'import-results' }
    }
    if (pathname === '/dashboard/therapien') {
      return { label: 'Neue Therapieart', icon: Stethoscope, action: 'add-therapy' }
    }
    // No FAB on: planung, planung-jaehrlich, berichte, steuerprognose, einstellungen
    return null
  }, [pathname])

  if (!fabAction) return null

  const handleClick = () => {
    if (fabAction.action === 'expense') {
      setDialogOpen(true)
    } else {
      // Dispatch custom event for other pages to handle
      window.dispatchEvent(new CustomEvent('fab-action', { detail: fabAction.action }))
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
  }

  const Icon = fabAction.icon

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          fixed z-40
          bottom-20 right-4 md:bottom-6 md:right-6
          w-14 h-14 rounded-full
          bg-accent-600/90 backdrop-blur-lg
          shadow-lg shadow-accent-500/25
          hover:bg-accent-700/90 hover:shadow-xl hover:shadow-accent-500/30
          active:scale-95
          transition-all duration-300 ease-out
          flex items-center justify-center
          group
          ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
        style={{
          transitionTimingFunction: mounted
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label={fabAction.label}
        title={fabAction.label}
      >
        <Icon
          className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-90"
          strokeWidth={2.5}
        />
      </button>

      {/* Expense Dialog - only for expense action */}
      <ExpenseDialogEnhanced
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={null}
        onSuccess={handleSuccess}
      />
    </>
  )
}
