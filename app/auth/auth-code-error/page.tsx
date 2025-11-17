'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />

          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Authentication Failed
          </h1>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your authentication code has expired or is invalid. This usually happens if:
          </p>

          <ul className="text-left text-sm text-neutral-600 dark:text-neutral-400 mb-6 space-y-2">
            <li>• The magic link in your email is older than 24 hours</li>
            <li>• The link has already been used</li>
            <li>• The code was modified or corrupted</li>
          </ul>

          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Please request a new login link to try again.
          </p>

          <Link href="/auth/login">
            <Button className="w-full">
              Request New Login Link
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
