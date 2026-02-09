import { ReactNode } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { createClient } from '@/utils/supabase/server'

/**
 * Layout for dashboard routes
 * Wraps all dashboard pages with persistent navigation
 *
 * Desktop: Fixed sidebar on left (264px), content takes remaining space
 * Mobile: Bottom navigation bar (64px + safe area)
 *
 * Features:
 * - Persistent navigation across all dashboard pages
 * - Active page indicator
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
    <div className="relative min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Subtle gradient background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.08]"
        style={{
          backgroundImage: "url('/images/gradient-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="flex min-h-screen">
        {/* Desktop Sidebar Navigation - hidden on mobile */}
        <div className="hidden md:block md:w-64 md:flex-shrink-0">
          <DashboardNav practiceName={practiceName} />
        </div>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 overflow-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav - shown only on mobile */}
      <div className="md:hidden">
        <DashboardNav practiceName={practiceName} />
      </div>
    </div>
  )
}
