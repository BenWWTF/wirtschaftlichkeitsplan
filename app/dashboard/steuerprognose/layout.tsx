import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meine Steuerprognose - Ordi Pro',
  description:
    'Berechnen Sie Ihre Steuerschätzung für Österreich mit detaillierter Analyse',
}

export default function SteuerprognosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
