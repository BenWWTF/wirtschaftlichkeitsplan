import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Einstellungen - Wirtschaftlichkeitsplan',
  description: 'Praxis-Einstellungen verwalten'
}

export default function EinstellungenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
