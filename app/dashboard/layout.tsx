import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'

/**
 * Layout for dashboard routes
 * Wraps all dashboard pages with persistent navigation sidebar
 *
 * Desktop: Fixed sidebar on left (264px), content takes remaining space
 * Mobile: Bottom navigation bar (64px + safe area), full-width content
 *
 * Features:
 * - Persistent navigation across all dashboard pages
 * - Active page indicator
 * - Keyboard shortcuts (Alt+H, Alt+T, Alt+P, Alt+A, Alt+R)
 * - Mobile bottom navigation with safe area handling (notches)
 * - Mobile landscape navigation bar at top
 * - Dark mode support
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let practiceName = ''

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!authError && user) {
      const { data: settings } = await supabase
        .from('practice_settings')
        .select('practice_name')
        .eq('user_id', user.id)
        .single()

      if (settings?.practice_name) {
        practiceName = settings.practice_name
      }
    }
  } catch (error) {
    console.error('Error fetching practice settings:', error)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Main Content Area */}
      <main className="w-full">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
