'use client'

import { getPracticeSettings } from '@/lib/actions/settings'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { MfaEnroll } from '@/components/auth/mfa-enroll'
import { RelatedPages } from '@/components/dashboard/related-pages'
import { Settings, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PracticeSettings } from '@/lib/types'

export default function EinstellungenPage() {
  const [settings, setSettings] = useState<PracticeSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSettings = async () => {
    const data = await getPracticeSettings()
    setSettings(data)
    setIsLoading(false)
  }

  useEffect(() => {
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

          {/* Forms */}
          <div className="space-y-8">
            {/* Practice Settings Form */}
            <SettingsForm settings={settings} onSaveSuccess={loadSettings} />

            {/* Security Section */}
            <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      Sicherheit
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      Schützen Sie Ihr Konto mit zusätzlichen Sicherheitsmaßnahmen
                    </p>
                  </div>
                </div>
              </div>

              {/* 2FA Settings */}
              <div className="max-w-3xl">
                <MfaEnroll onEnrolled={() => {}} />
              </div>
            </div>
          </div>
        </div>
        <RelatedPages currentPage="/dashboard/einstellungen" />
      </div>
    </main>
  )
}
