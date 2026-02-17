'use client'

import { useState, useEffect } from 'react'
import { Receipt, Calendar, Pill, Clock } from 'lucide-react'
import { getRecentActivity, type ActivityItem } from '@/lib/actions/recent-activity'

const ICONS: Record<ActivityItem['type'], React.ReactNode> = {
  expense: <Receipt className="w-3.5 h-3.5 text-red-500" />,
  plan: <Calendar className="w-3.5 h-3.5 text-accent-500" />,
  therapy: <Pill className="w-3.5 h-3.5 text-purple-500" />,
}

function timeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'gerade eben'
  if (diffMin < 60) return `vor ${diffMin} Min.`
  if (diffH < 24) return `vor ${diffH} Std.`
  if (diffD === 1) return 'gestern'
  if (diffD < 7) return `vor ${diffD} Tagen`
  return then.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

/**
 * Recent Activity Feed
 * Shows a timeline of the last few actions in the dashboard sidebar footer.
 * Fetches data from multiple tables (expenses, plans, results, therapies).
 */
export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getRecentActivity(3)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-2 px-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Aktivität
          </span>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-2 py-1">
            <div className="w-3.5 h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <div className="px-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Letzte Aktivitäten
        </span>
      </div>
      <div className="space-y-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2 py-1.5 px-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
          >
            <span className="flex-shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {ICONS[activity.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                {activity.label}
              </p>
              {activity.detail && (
                <p className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate">
                  {activity.detail}
                </p>
              )}
            </div>
            <span className="text-[9px] text-neutral-400 dark:text-neutral-600 flex-shrink-0 whitespace-nowrap">
              {timeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
