'use client'

interface AchievementBadgeProps {
  achievement: number // percentage (e.g., 95 for 95%)
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline'
  showCircle?: boolean
}

export function AchievementBadge({
  achievement,
  size = 'md',
  variant = 'solid',
  showCircle = false,
}: AchievementBadgeProps) {
  // Determine color based on achievement percentage
  let colorClass = ''
  let bgColorClass = ''
  let borderColorClass = ''

  if (achievement >= 100) {
    colorClass = 'text-green-700 dark:text-green-300'
    bgColorClass = 'bg-green-100 dark:bg-green-900/30'
    borderColorClass = 'border-green-300 dark:border-green-800'
  } else if (achievement >= 90) {
    colorClass = 'text-amber-700 dark:text-amber-300'
    bgColorClass = 'bg-amber-100 dark:bg-amber-900/30'
    borderColorClass = 'border-amber-300 dark:border-amber-800'
  } else {
    colorClass = 'text-red-700 dark:text-red-300'
    bgColorClass = 'bg-red-100 dark:bg-red-900/30'
    borderColorClass = 'border-red-300 dark:border-red-800'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 font-medium',
    md: 'text-sm px-2.5 py-1.5 font-semibold',
    lg: 'text-base px-3 py-2 font-semibold',
  }

  const circleSizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  if (showCircle) {
    // Circular progress variant
    const radius = 15
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (achievement / 100) * circumference

    return (
      <div className="flex flex-col items-center gap-1">
        <div className={`relative ${circleSizeClasses[size]} flex items-center justify-center`}>
          <svg className="absolute w-full h-full" viewBox="0 0 40 40">
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-200 dark:text-neutral-700"
            />
            {/* Progress circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${colorClass}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '20px 20px' }}
            />
          </svg>
          <span className={`relative ${colorClass} font-bold`}>
            {Math.round(achievement)}%
          </span>
        </div>
      </div>
    )
  }

  // Solid or outline badge variant
  const baseClass = variant === 'solid' ? bgColorClass : `border ${borderColorClass} bg-white dark:bg-neutral-900`

  return (
    <div
      className={`inline-flex items-center rounded-md ${sizeClasses[size]} ${baseClass} ${colorClass} whitespace-nowrap`}
      title={`Erreichung: ${Math.round(achievement)}%`}
    >
      {Math.round(achievement)}%
    </div>
  )
}
