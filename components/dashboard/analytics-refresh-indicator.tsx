'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff, Check } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface AnalyticsRefreshIndicatorProps {
  isLoading?: boolean
  isConnected?: boolean
  lastUpdated?: Date | null
  onRefresh?: () => Promise<void>
  showDetails?: boolean
  className?: string
}

/**
 * Indicator component showing analytics refresh status
 * Displays connection status, last update time, and manual refresh button
 */
export function AnalyticsRefreshIndicator({
  isLoading = false,
  isConnected = false,
  lastUpdated = null,
  onRefresh,
  showDetails = true,
  className = '',
}: AnalyticsRefreshIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update time ago display every 30 seconds
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgo('')
        return
      }

      const now = new Date()
      const diff = now.getTime() - lastUpdated.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (seconds < 60) {
        setTimeAgo('gerade eben')
      } else if (minutes < 60) {
        setTimeAgo(`vor ${minutes}m`)
      } else if (hours < 24) {
        setTimeAgo(`vor ${hours}h`)
      } else {
        setTimeAgo(
          format(lastUpdated, 'dd.MM.yyyy HH:mm', { locale: de })
        )
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [lastUpdated])

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing || isLoading) return

    try {
      setIsRefreshing(true)
      await onRefresh()
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 ${className}`}
    >
      <div className="flex items-center gap-2 flex-1">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {showDetails && (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Live
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              {showDetails && (
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  Offline
                </span>
              )}
            </>
          )}
        </div>

        {/* Last Updated */}
        {showDetails && timeAgo && (
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            {timeAgo}
          </span>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
        className="ml-2 p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Metriken aktualisieren"
        title="Metriken aktualisieren"
      >
        {isRefreshing || isLoading ? (
          <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100" />
        )}
      </button>
    </div>
  )
}
