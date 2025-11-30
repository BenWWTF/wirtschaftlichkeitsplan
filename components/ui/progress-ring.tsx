'use client'

import { useMemo } from 'react'

interface ProgressRingProps {
  /**
   * Progress value from 0 to 100
   */
  value: number

  /**
   * Color of the progress ring
   */
  color?: 'green' | 'red' | 'amber' | 'blue' | 'neutral'

  /**
   * Radius of the ring in pixels
   */
  radius?: number

  /**
   * Stroke width of the ring
   */
  strokeWidth?: number

  /**
   * Show percentage text in the center
   */
  showLabel?: boolean

  /**
   * Label text to show above the percentage
   */
  label?: string

  /**
   * Text size for the percentage
   */
  textSize?: 'sm' | 'md' | 'lg'

  /**
   * Animation duration in ms
   */
  animationDuration?: number
}

/**
 * ProgressRing Component
 * Circular progress indicator perfect for showing completion percentages,
 * revenue targets, or other 0-100 metrics
 */
export function ProgressRing({
  value,
  color = 'blue',
  radius = 45,
  strokeWidth = 4,
  showLabel = true,
  label,
  textSize = 'md',
  animationDuration = 1000
}: ProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  const { circumference, offset, colorClasses } = useMemo(() => {
    // Circle circumference
    const c = 2 * Math.PI * radius

    // Calculate stroke offset for progress
    const progress = normalizedValue / 100
    const strokeOffset = c - progress * c

    // Color mapping
    const colorMap: Record<string, { ring: string; label: string }> = {
      green: {
        ring: '#22C55E',
        label: 'text-green-600 dark:text-green-400'
      },
      red: {
        ring: '#EF4444',
        label: 'text-red-600 dark:text-red-400'
      },
      amber: {
        ring: '#F59E0B',
        label: 'text-amber-600 dark:text-amber-400'
      },
      blue: {
        ring: '#0EA5E9',
        label: 'text-blue-600 dark:text-blue-400'
      },
      neutral: {
        ring: '#6B7280',
        label: 'text-neutral-600 dark:text-neutral-400'
      }
    }

    return {
      circumference: c,
      offset: strokeOffset,
      colorClasses: colorMap[color]
    }
  }, [radius, normalizedValue, color])

  const size = radius * 2 + strokeWidth * 2
  const textSizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-bold'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring Container */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-700"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorClasses.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              transitionDuration: `${animationDuration}ms`
            }}
          />
        </svg>

        {/* Center label/percentage */}
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`${textSizeClasses[textSize]} ${colorClasses.label}`}>
              {normalizedValue}%
            </div>
            {label && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                {label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
