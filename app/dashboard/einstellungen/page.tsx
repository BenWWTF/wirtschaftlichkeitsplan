'use client'

import { getPracticeSettings } from '@/lib/actions/settings'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { PaymentFeeSection } from '@/components/practice-settings/payment-fee-section'
import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PracticeSettings } from '@/lib/types'

export const metadata = {
  title: 'Einstellungen - Wirtschaftlichkeitsplan',
  description: 'Praxis-Einstellungen verwalten'
}

export default function EinstellungenPage() {
  const [settings, setSettings] = useState<PracticeSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getPracticeSettings()
      setSettings(data)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-neutral-700 dark:text-neutral-300" />
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Praxis-Einstellungen
              </h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Konfigurieren Sie Ihre Praxis-Details und finanzielle Annahmen
            </p>
          </div>

          {/* Form */}
          <SettingsForm settings={settings} />

          {/* Payment Fee Section */}
          {!isLoading && settings && (
            <PaymentFeeSection
              settings={settings}
              onUpdate={setSettings}
            />
          )}
        </div>
      </div>
    </main>
  )
}
