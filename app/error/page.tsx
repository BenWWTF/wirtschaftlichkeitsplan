'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Error page displayed when authentication or other critical processes fail
 */
export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-6">⚠️</div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
          Ein Fehler ist aufgetreten
        </h1>

        {/* Description */}
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Es gab ein Problem beim Verarbeiten Ihrer Anfrage. Dies könnte daran liegen, dass:
        </p>

        {/* Error reasons list */}
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 mb-8 space-y-2 text-left bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Der Bestätigungslink ist abgelaufen (gültig für 24 Stunden)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Der Link wurde bereits verwendet</span>
          </li>
          <li className="flex items-start">
            <span className="mr-3">•</span>
            <span>Es gibt ein technisches Problem mit unserem Service</span>
          </li>
        </ul>

        {/* Action buttons */}
        <div className="space-y-3">
          <Link href="/signup" className="block">
            <Button className="w-full">
              Erneut registrieren
            </Button>
          </Link>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Zum Login
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Zur Startseite
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-6">
          Wenn das Problem weiterhin besteht, versuchen Sie es später erneut oder kontaktieren Sie den Support.
        </p>
      </div>
    </div>
  )
}
