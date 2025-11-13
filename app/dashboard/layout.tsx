'use client'

import { ReactNode } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { PageErrorBoundary, DataFetchErrorBoundary } from '@/components/error-boundaries'

/**
 * Layout for dashboard routes
 * Wraps all dashboard pages with persistent navigation sidebar
 *
 * Desktop: Fixed sidebar on left (264px), content takes remaining space
 * Mobile: Top navigation bar with collapsible menu, full-width content
 *
 * Features:
 * - Persistent navigation across all dashboard pages
 * - Active page indicator
 * - Keyboard shortcuts (Alt+H, Alt+T, Alt+P, Alt+A, Alt+R)
 * - Responsive mobile menu
 * - Dark mode support
 * - Error boundaries for graceful error handling
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PageErrorBoundary pageName="Dashboard">
      <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Navigation */}
        <DashboardNav />

        {/* Main Content Area */}
        <main className="flex-1 mt-14 md:mt-0 md:ml-64">
          <div className="p-4 md:p-6">
            <DataFetchErrorBoundary dataSource="dashboard">
              {children}
            </DataFetchErrorBoundary>
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
