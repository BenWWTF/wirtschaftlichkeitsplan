interface StatusBadgeProps {
  status: 'surplus' | 'breakeven' | 'deficit' | 'excellent' | 'good' | 'warning' | 'critical'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true
}: StatusBadgeProps) {
  const statusConfig = {
    surplus: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-200',
      icon: '✓',
      defaultLabel: 'Gewinn'
    },
    breakeven: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-200',
      icon: '−',
      defaultLabel: 'Break-Even'
    },
    deficit: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-200',
      icon: '✗',
      defaultLabel: 'Verlust'
    },
    excellent: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-200',
      icon: '★',
      defaultLabel: 'Ausgezeichnet'
    },
    good: {
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      border: 'border-accent-200 dark:border-accent-800',
      text: 'text-accent-700 dark:text-accent-200',
      icon: '✓',
      defaultLabel: 'Gut'
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-200',
      icon: '⚠',
      defaultLabel: 'Warnung'
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-200',
      icon: '✗',
      defaultLabel: 'Kritisch'
    }
  }

  const config = statusConfig[status]
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} rounded-full border ${config.bg} ${config.border} ${config.text} font-medium`}>
      {showIcon && <span>{config.icon}</span>}
      {label || config.defaultLabel}
    </span>
  )
}
