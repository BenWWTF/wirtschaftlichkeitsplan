'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  filled?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color,
  filled = true,
  className,
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 1

    const points = data.map((value, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (value - min) / range) * (height - padding * 2),
    }))

    let line = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      line += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }

    const lastPoint = points[points.length - 1]
    const firstPoint = points[0]
    const area = `${line} L ${lastPoint.x},${height} L ${firstPoint.x},${height} Z`

    return { line, area }
  }, [data, width, height])

  if (!data || data.length < 2) return null

  const trendPositive = data[data.length - 1] >= data[0]
  const strokeColor = color || (trendPositive ? '#22C55E' : '#EF4444')
  const uniqueId = useMemo(() => `sparkline-${Math.random().toString(36).slice(2, 9)}`, [])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block flex-shrink-0', className)}
      aria-hidden="true"
    >
      {filled && (
        <>
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pathData.area} fill={`url(#${uniqueId})`} />
        </>
      )}
      <path
        d={pathData.line}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
