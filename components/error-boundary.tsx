'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Catches React errors in the component tree and displays:
 * - User-friendly error message
 * - Error details in development mode
 * - Recovery options (refresh, home)
 * - Dark mode support
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error)
    console.error('Error info:', errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Etwas ist schief gelaufen
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie, die Seite zu aktualisieren.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {isDevelopment && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-mono text-red-700 dark:text-red-300 break-words">
                    <strong>Message:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-red-700 dark:text-red-300 font-semibold">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-48 text-red-600 dark:text-red-400 font-mono p-2 bg-red-100/50 dark:bg-red-900/10 rounded">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  onClick={this.resetError}
                  className="gap-2 bg-accent-600 hover:bg-accent-700 text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </Button>

                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="gap-2 border-neutral-300 dark:border-neutral-600"
                  >
                    <Home className="w-4 h-4" />
                    Zur Startseite
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
