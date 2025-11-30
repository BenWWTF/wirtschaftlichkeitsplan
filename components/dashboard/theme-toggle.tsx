'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full justify-start px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      title={isDark ? 'Zu Hell-Modus wechseln' : 'Zu Dunkel-Modus wechseln'}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span>Helles Design</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span>Dunkles Design</span>
        </>
      )}
    </Button>
  )
}
