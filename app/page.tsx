'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl md:text-8xl font-bold text-neutral-900 dark:text-white mb-8">
          Meine Ordi Finanzen
        </h1>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-4 bg-primary-600 text-white font-medium text-lg rounded-lg hover:bg-primary-700 transition-colors"
        >
          Zum Tool
        </Link>
      </div>
    </main>
  )
}
