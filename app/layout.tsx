import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

// Primary font: Source Sans 3
const sourceSans = Source_Sans_3({
  weight: ['300', '400', '600', '700'],
  variable: '--font-source-sans',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Wirtschaftlichkeitsplan',
  description: 'Financial planning dashboard for Austrian medical practices'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={sourceSans.variable}
    >
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  )
}
