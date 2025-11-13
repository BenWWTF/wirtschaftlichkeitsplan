'use client'

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
  showDetails?: boolean
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ComponentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error caught by ComponentErrorBoundary${this.props.componentName ? ` (${this.props.componentName})` : ''}:`,
      error,
      errorInfo
    )
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  {this.props.componentName || 'Component'} Error
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {this.state.error?.message || 'This component encountered an error.'}
                </p>
                {this.props.showDetails && this.state.error?.stack && (
                  <details className="mt-2 text-xs text-orange-700 dark:text-orange-300">
                    <summary className="cursor-pointer font-mono">Stack trace</summary>
                    <pre className="mt-1 bg-orange-100 dark:bg-orange-900/30 p-2 rounded overflow-auto max-h-32 font-mono">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
