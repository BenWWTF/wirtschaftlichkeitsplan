'use client'

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class BaseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Something went wrong
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="text-sm px-3 py-1.5 bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
