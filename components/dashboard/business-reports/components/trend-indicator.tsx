import { TrendingUp, TrendingDown } from 'lucide-react'

interface TrendIndicatorProps {
  value: number
  label?: string
  showPercent?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrendIndicator({
  value,
  label,
  showPercent = true,
  showIcon = true,
  size = 'md',
  className = ''
}: TrendIndicatorProps) {
  const isPositive = value >= 0
  const isNeutral = value === 0

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-base gap-1.5'
  }

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const colorClass = isNeutral
    ? 'text-neutral-500 dark:text-neutral-400'
    : isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${colorClass} ${className}`}>
      {showIcon && (
        isPositive ? (
          <TrendingUp className={iconSize[size]} />
        ) : isNeutral ? (
          <div className={`${iconSize[size]}`}>−</div>
        ) : (
          <TrendingDown className={iconSize[size]} />
        )
      )}
      <span className="font-medium">
        {isNeutral ? '0' : isPositive ? '+' : ''}{value.toFixed(1)}
        {showPercent && '%'}
      </span>
      {label && <span className="text-neutral-600 dark:text-neutral-400">{label}</span>}
    </div>
  )
}
