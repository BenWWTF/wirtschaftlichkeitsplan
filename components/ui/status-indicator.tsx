'use client'

import { AlertCircle, CheckCircle2, Info, AlertTriangle, Zap } from 'lucide-react'

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface StatusIndicatorProps {
  /**
   * Status type determines color and icon
   */
  status: StatusType

  /**
   * Title/label for the status
   */
  title?: string

  /**
   * Detailed description
   */
  description?: string

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Show as inline badge instead of block
   */
  inline?: boolean

  /**
   * Custom icon
   */
  icon?: React.ReactNode

  /**
   * Show animated pulse effect (for loading/info)
   */
  pulse?: boolean

  /**
   * Additional className
   */
  className?: string
}

/**
 * Status Indicator Component
 * Displays semantic status with colors, icons, and messages
 */
export function StatusIndicator({
  status,
  title,
  description,
  size = 'md',
  inline = false,
  icon,
  pulse = false,
  className = ''
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bgLight: 'bg-green-50 dark:bg-green-950/20',
          bgDark: 'dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          textTitle: 'text-green-900 dark:text-green-200',
          textDesc: 'text-green-800 dark:text-green-300',
          icon: icon || <CheckCircle2 className="h-5 w-5" />,
          iconColor: 'text-green-600 dark:text-green-400'
        }
      case 'error':
        return {
          bgLight: 'bg-red-50 dark:bg-red-950/20',
          bgDark: 'dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          textTitle: 'text-red-900 dark:text-red-200',
          textDesc: 'text-red-800 dark:text-red-300',
          icon: icon || <AlertCircle className="h-5 w-5" />,
          iconColor: 'text-red-600 dark:text-red-400'
        }
      case 'warning':
        return {
          bgLight: 'bg-amber-50 dark:bg-amber-950/20',
          bgDark: 'dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-800',
          textTitle: 'text-amber-900 dark:text-amber-200',
          textDesc: 'text-amber-800 dark:text-amber-300',
          icon: icon || <AlertTriangle className="h-5 w-5" />,
          iconColor: 'text-amber-600 dark:text-amber-400'
        }
      case 'info':
        return {
          bgLight: 'bg-accent-50 dark:bg-accent-950/20',
          bgDark: 'dark:bg-accent-950/20',
          border: 'border-accent-200 dark:border-accent-800',
          textTitle: 'text-accent-900 dark:text-accent-200',
          textDesc: 'text-accent-800 dark:text-accent-300',
          icon: icon || <Info className="h-5 w-5" />,
          iconColor: 'text-accent-600 dark:text-accent-400'
        }
      case 'loading':
        return {
          bgLight: 'bg-neutral-50 dark:bg-neutral-950/20',
          bgDark: 'dark:bg-neutral-950/20',
          border: 'border-neutral-200 dark:border-neutral-800',
          textTitle: 'text-neutral-900 dark:text-neutral-200',
          textDesc: 'text-neutral-800 dark:text-neutral-300',
          icon: icon || <Zap className="h-5 w-5" />,
          iconColor: 'text-neutral-600 dark:text-neutral-400 animate-pulse'
        }
      default:
        return {
          bgLight: 'bg-neutral-50 dark:bg-neutral-950/20',
          bgDark: 'dark:bg-neutral-950/20',
          border: 'border-neutral-200 dark:border-neutral-800',
          textTitle: 'text-neutral-900 dark:text-neutral-200',
          textDesc: 'text-neutral-800 dark:text-neutral-300',
          icon: icon || <Info className="h-5 w-5" />,
          iconColor: 'text-neutral-600 dark:text-neutral-400'
        }
    }
  }

  const config = getStatusConfig()
  const sizeClasses = {
    sm: { padding: 'p-2', textTitle: 'text-xs', textDesc: 'text-xs', icon: 'h-4 w-4' },
    md: { padding: 'p-3', textTitle: 'text-sm', textDesc: 'text-sm', icon: 'h-5 w-5' },
    lg: { padding: 'p-4', textTitle: 'text-base', textDesc: 'text-base', icon: 'h-6 w-6' }
  }

  const sizeConfig = sizeClasses[size]

  if (inline) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`${config.iconColor} flex-shrink-0`}>{config.icon}</div>
        {title && <span className={`${sizeConfig.textTitle} font-medium ${config.textTitle}`}>{title}</span>}
      </div>
    )
  }

  return (
    <div
      className={`${config.bgLight} border ${config.border} rounded-lg ${sizeConfig.padding} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.iconColor} flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
          {config.icon}
        </div>

        <div className="flex-1">
          {title && (
            <h3 className={`${sizeConfig.textTitle} font-semibold ${config.textTitle}`}>{title}</h3>
          )}
          {description && (
            <p className={`${sizeConfig.textDesc} ${config.textDesc} ${title ? 'mt-1' : ''}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
