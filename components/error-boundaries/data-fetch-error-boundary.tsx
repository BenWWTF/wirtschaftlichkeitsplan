'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  dataSource?: string
  onRetry?: () => void
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  retryCount: number
}

export class DataFetchErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error caught by DataFetchErrorBoundary${this.props.dataSource ? ` (${this.props.dataSource})` : ''}:`,
      error,
      errorInfo
    )
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1
    this.setState({ hasError: false, retryCount: newRetryCount })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Fehler beim Laden von {this.props.dataSource || 'Daten'}
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  {this.state.error?.message || 'Daten konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center gap-2 text-sm px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Erneut versuchen
                  </button>
                  {this.state.retryCount > 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 py-1.5">
                      ({this.state.retryCount}-mal versucht)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
