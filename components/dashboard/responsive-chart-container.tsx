'use client'

import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface ResponsiveChartContainerProps {
  /**
   * Height on desktop (default: 400px)
   */
  desktopHeight?: string | number

  /**
   * Height on mobile (default: 300px)
   */
  mobileHeight?: string | number

  /**
   * Title of the chart
   */
  title?: string

  /**
   * Description of the chart
   */
  description?: string

  /**
   * Additional info to display
   */
  info?: React.ReactNode

  /**
   * Chart content
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ResponsiveChartContainer Component
 *
 * Mobile-optimized wrapper for charts with responsive sizing and touch-friendly interactions.
 *
 * Features:
 * - Automatic height adjustment for mobile (300px) vs desktop (400px)
 * - Touch-friendly tooltips and interactions
 * - Responsive legend placement (bottom on mobile, right on desktop)
 * - Reduced margins and padding on mobile
 * - Font size adjustments for readability
 *
 * Usage:
 * ```tsx
 * <ResponsiveChartContainer
 *   title="Revenue Chart"
 *   description="Monthly revenue breakdown"
 *   mobileHeight={250}
 *   desktopHeight={350}
 * >
 *   <ResponsiveContainer width="100%" height="100%">
 *     <LineChart data={data}>
 *       ...
 *     </LineChart>
 *   </ResponsiveContainer>
 * </ResponsiveChartContainer>
 * ```
 */
export function ResponsiveChartContainer({
  desktopHeight = 400,
  mobileHeight = 300,
  title,
  description,
  info,
  children,
  className,
}: ResponsiveChartContainerProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const height = isMobile ? mobileHeight : desktopHeight
  const heightClass = typeof height === 'number' ? `h-[${height}px]` : height

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700',
        'p-4 md:p-6',
        className
      )}
    >
      {/* Header */}
      {(title || description || info) && (
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 md:mb-6 gap-3">
          {(title || description) && (
            <div className="flex-1">
              {title && (
                <h3 className="text-base md:text-lg font-semibold text-neutral-900 dark:text-white mb-1 md:mb-2">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
          )}
          {info && (
            <div className="text-xs md:text-sm">
              {info}
            </div>
          )}
        </div>
      )}

      {/* Chart Content */}
      <div
        className={cn(
          'w-full',
          typeof height === 'number' ? '' : heightClass
        )}
        style={typeof height === 'number' ? { height: `${height}px` } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Get responsive chart margins based on screen size
 *
 * @param isMobile - Whether the device is mobile
 * @returns Margin configuration for Recharts
 */
export function getResponsiveChartMargins(isMobile: boolean) {
  return isMobile
    ? { top: 10, right: 10, left: 0, bottom: 10 }
    : { top: 20, right: 30, left: 20, bottom: 20 }
}

/**
 * Get responsive font size for chart labels
 *
 * @param isMobile - Whether the device is mobile
 * @returns Font size in pixels
 */
export function getResponsiveChartFontSize(isMobile: boolean) {
  return isMobile ? 11 : 12
}

/**
 * Get responsive legend configuration for Recharts
 *
 * @param isMobile - Whether the device is mobile
 * @returns Legend configuration object
 */
export function getResponsiveLegendConfig(isMobile: boolean) {
  return {
    verticalAlign: isMobile ? 'bottom' : 'top',
    align: 'center',
    wrapperStyle: {
      paddingTop: isMobile ? 10 : 0,
      paddingBottom: isMobile ? 0 : 10,
      fontSize: isMobile ? 11 : 12,
    },
  } as const
}

/**
 * Custom hook to detect mobile screen size for charts
 */
export function useIsMobileChart() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
