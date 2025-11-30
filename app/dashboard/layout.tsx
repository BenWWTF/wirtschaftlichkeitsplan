import { ReactNode } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { BreadcrumbNav } from '@/components/dashboard/breadcrumb-nav'
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
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Navigation */}
      <DashboardNav practiceName={practiceName} />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 md:ml-64">
        <div className="p-4 md:p-6">
          <BreadcrumbNav />
          {children}
        </div>
      </main>
    </div>
  )
}
