'use client'

import { useMemo } from 'react'

interface SparklineProps {
  /**
   * Array of numeric values to visualize
   */
  data: number[]

  /**
   * Color of the line (Tailwind color or hex)
   */
  color?: 'green' | 'red' | 'amber' | 'blue' | 'neutral' | string

  /**
   * Height of the sparkline in pixels
   */
  height?: number

  /**
   * Width of the sparkline - if not provided, will use 100% of parent
   */
  width?: number | string

  /**
   * Show a filled area under the line
   */
  filled?: boolean

  /**
   * Smooth the line curves
   */
  smooth?: boolean

  /**
   * Show dots at each data point
   */
  showDots?: boolean

  /**
   * Stroke width of the line
   */
  strokeWidth?: number

  /**
   * Trend direction: 'up', 'down', or 'neutral'
   */
  trend?: 'up' | 'down' | 'neutral'
}

/**
 * Sparkline Component
 * Compact inline chart showing trend data with minimal visual footprint
 * Perfect for KPI cards and dashboards
 */
export function Sparkline({
  data,
  color = 'blue',
  height = 32,
  width = '100%',
  filled = true,
  smooth = true,
  showDots = false,
  strokeWidth = 2,
  trend
}: SparklineProps) {
  // Calculate min/max for scaling
  const { min, max, path, fillPath } = useMemo(() => {
    // Handle empty or single data point
    if (!data || data.length < 2) {
      return { min: 0, max: 1, path: '', fillPath: '' }
    }
    const values = data.filter((v) => typeof v === 'number' && !isNaN(v))

    if (values.length < 2) {
      return { min: 0, max: 1, path: '', fillPath: '' }
    }

    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1

    // Chart dimensions
    const chartHeight = height - 4 // Padding
    const chartWidth = 100

    // Calculate points
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * chartWidth
      const y = chartHeight - ((value - minVal) / range) * chartHeight + 2

      return { x, y, value }
    })

    // Generate SVG path
    let path = ''

    if (smooth) {
      // Smooth curve using quadratic Bezier
      path = points
        .reduce((acc, point, index) => {
          if (index === 0) {
            return `M ${point.x},${point.y}`
          }

          const prevPoint = points[index - 1]
          const controlX = (prevPoint.x + point.x) / 2
          const controlY = (prevPoint.y + point.y) / 2

          return `${acc} Q ${controlX},${controlY} ${point.x},${point.y}`
        }, '')
    } else {
      // Linear line
      path = points
        .reduce((acc, point, index) => {
          if (index === 0) {
            return `M ${point.x},${point.y}`
          }

          return `${acc} L ${point.x},${point.y}`
        }, '')
    }

    // Generate fill path (closing the area)
    let fillPath = path
    if (filled) {
      const lastPoint = points[points.length - 1]
      const firstPoint = points[0]
      fillPath = `${path} L ${lastPoint.x},${height} L ${firstPoint.x},${height} Z`
    }

    return { min: minVal, max: maxVal, path, fillPath }
  }, [data, height, filled, smooth])

  // Determine color classes
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return { line: '#22C55E', fill: 'rgba(34, 197, 94, 0.1)' }
      case 'red':
        return { line: '#EF4444', fill: 'rgba(239, 68, 68, 0.1)' }
      case 'amber':
        return { line: '#F59E0B', fill: 'rgba(245, 158, 11, 0.1)' }
      case 'blue':
        return { line: '#0EA5E9', fill: 'rgba(14, 165, 233, 0.1)' }
      case 'neutral':
        return { line: '#6B7280', fill: 'rgba(107, 114, 128, 0.1)' }
      default:
        return { line: color, fill: `${color}20` }
    }
  }

  const colors = getColorClasses()

  // If no valid path, return null
  if (!path) {
    return null
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="transition-opacity duration-300"
    >
      {/* Fill area under the line */}
      {filled && fillPath && (
        <path
          d={fillPath}
          fill={colors.fill}
          opacity="0.5"
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={colors.line}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Optional data point dots */}
      {showDots && (
        data.map((value, index) => {
          const chartHeight = height - 4
          const chartWidth = 100
          const values = data.filter((v) => typeof v === 'number' && !isNaN(v))
          const minVal = Math.min(...values)
          const maxVal = Math.max(...values)
          const range = maxVal - minVal || 1

          const x = (index / (values.length - 1)) * chartWidth
          const y = chartHeight - ((value - minVal) / range) * chartHeight + 2

          return (
            <circle
              key={`dot-${index}`}
              cx={x}
              cy={y}
              r="1.5"
              fill={colors.line}
              opacity="0.7"
            />
          )
        })
      )}
    </svg>
  )
}
