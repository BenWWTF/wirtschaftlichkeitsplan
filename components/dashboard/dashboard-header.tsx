'use client'

import { useState } from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Dashboard Header
 * Top-right corner controls for theme toggle and logout
 * Fixed/sticky at the top so they don't scroll with content
 */
export function DashboardHeader() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-3 md:p-4 flex items-center gap-1.5">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="h-9 w-9 p-0 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
        aria-label={`Wechsel zu ${theme === 'dark' ? 'hellem' : 'dunklem'} Modus`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
        aria-label="Abmelden"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
