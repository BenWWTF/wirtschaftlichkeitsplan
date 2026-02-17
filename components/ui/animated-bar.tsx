'use client'

import { cn } from '@/lib/utils'
import { useInView } from '@/hooks/useInView'

interface AnimatedBarProps {
  percentage: number
  colorClass?: string
  heightClass?: string
  trackClass?: string
  duration?: number
  delay?: number
  className?: string
}

export function AnimatedBar({
  percentage,
  colorClass = 'bg-accent-500',
  heightClass = 'h-2',
  trackClass = 'bg-neutral-100 dark:bg-neutral-700',
  duration = 1000,
  delay = 0,
  className,
}: AnimatedBarProps) {
  const [ref, inView] = useInView({ threshold: 0.1, once: true })

  return (
    <div ref={ref} className={cn('w-full rounded-full overflow-hidden', trackClass, heightClass, className)}>
      <div
        className={cn('h-full rounded-full', colorClass)}
        style={{
          width: inView ? `${Math.min(percentage, 100)}%` : '0%',
          transition: `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        }}
      />
    </div>
  )
}

interface AnimatedStackedBarProps {
  segments: Array<{
    percentage: number
    colorClass: string
    label?: string
  }>
  heightClass?: string
  trackClass?: string
  duration?: number
  className?: string
}

export function AnimatedStackedBar({
  segments,
  heightClass = 'h-3',
  trackClass = 'bg-neutral-100 dark:bg-neutral-700',
  duration = 800,
  className,
}: AnimatedStackedBarProps) {
  const [ref, inView] = useInView({ threshold: 0.1, once: true })

  return (
    <div ref={ref} className={cn('w-full rounded-full overflow-hidden flex', trackClass, heightClass, className)}>
      {segments.map((segment, i) => (
        <div
          key={i}
          className={cn('h-full first:rounded-l-full last:rounded-r-full', segment.colorClass)}
          style={{
            width: inView ? `${segment.percentage}%` : '0%',
            transition: `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 150}ms`,
          }}
        />
      ))}
    </div>
  )
}
