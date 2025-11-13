'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  pageName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error caught by PageErrorBoundary${this.props.pageName ? ` (${this.props.pageName})` : ''}:`,
      error,
      errorInfo
    )
    this.props.onError?.(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8">
                <div className="flex justify-center mb-4">
                  <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-center text-red-900 dark:text-red-100 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-sm text-center text-red-800 dark:text-red-200 mb-6">
                  {this.props.pageName && `on the ${this.props.pageName} page. `}
                  {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={this.handleReload}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </button>
                  <Link
                    href="/dashboard"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors font-medium"
                  >
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 p-3 bg-red-100 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-700">
                    <summary className="cursor-pointer font-mono text-xs text-red-900 dark:text-red-100">
                      Error Details
                    </summary>
                    <pre className="mt-2 font-mono text-xs text-red-800 dark:text-red-200 overflow-auto max-h-40">
                      {this.state.error.message}
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
