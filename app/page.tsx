'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-neutral-900 dark:text-white mb-8 uppercase tracking-tight">
          Meine Ordi Finanzen
        </h1>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-4 bg-primary-600 text-white font-medium text-lg rounded-sm hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200 ease-out"
        >
          Zum Tool
        </Link>
      </div>
    </main>
  )
}
