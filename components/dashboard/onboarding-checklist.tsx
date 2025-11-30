'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChecklistItem {
  id: string
  label: string
  description: string
  completed: boolean
  icon: React.ReactNode
}

interface OnboardingChecklistProps {
  items?: ChecklistItem[]
  onDismiss?: () => void
  onComplete?: (itemId: string) => void
  title?: string
  subtitle?: string
  showTips?: boolean
}

/**
 * OnboardingChecklist Component
 * Guides new users through setup steps with progress tracking
 */
export function OnboardingChecklist({
  items = [
    {
      id: 'therapies',
      label: 'Therapiearten erstellen',
      description: 'Definieren Sie Ihre Therapiearten und Preise',
      completed: false,
      icon: '🏥'
    },
    {
      id: 'planning',
      label: 'Erste Planung erstellen',
      description: 'Planen Sie Ihre Sitzungen für den kommenden Monat',
      completed: false,
      icon: '📅'
    },
    {
      id: 'expenses',
      label: 'Ausgaben hinzufügen',
      description: 'Erfassen Sie Ihre fixen Kosten',
      completed: false,
      icon: '💰'
    },
    {
      id: 'profile',
      label: 'Praxisprofil vervollständigen',
      description: 'Geben Sie Ihre Praxisinformationen ein',
      completed: false,
      icon: '👤'
    }
  ],
  onDismiss,
  onComplete,
  title = 'Willkommen in deiner Praxis-Planung!',
  subtitle = 'Folgen Sie diesen Schritten, um loszulegen:',
  showTips = true
}: OnboardingChecklistProps) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())
  const [localItems, setLocalItems] = useState(items)

  const completedCount = localItems.filter((item) => item.completed).length
  const progress = (completedCount / localItems.length) * 100

  const handleToggleItem = (itemId: string) => {
    setLocalItems(
      localItems.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
    onComplete?.(itemId)
  }

  const handleDismissTip = (tipId: string) => {
    setDismissedTips((prev) => new Set([...prev, tipId]))
  }

  const tips = [
    {
      id: 'tip-1',
      title: 'Tipp: Flexible Planung',
      description: 'Sie können Ihre Planung jederzeit anpassen und aktualisieren.'
    },
    {
      id: 'tip-2',
      title: 'Tipp: Kostenansicht',
      description: 'Der Dashboard zeigt dir automatisch deine Gewinnzahlen basierend auf deinen Kosten.'
    },
    {
      id: 'tip-3',
      title: 'Tipp: Kalendernavigation',
      description: 'Nutze den Kalender, um zwischen verschiedenen Monaten zu wechseln.'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{subtitle}</p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Fortschritt: {completedCount}/{localItems.length}
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {localItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleToggleItem(item.id)}
            className="w-full bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              {item.completed ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-6 w-6 text-neutral-400 dark:text-neutral-600 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    item.completed
                      ? 'text-neutral-500 dark:text-neutral-500 line-through'
                      : 'text-neutral-900 dark:text-white'
                  }`}
                >
                  {item.label}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
              </div>

              <div className="text-2xl flex-shrink-0">{item.icon}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Tips Section */}
      {showTips && (
        <div className="space-y-2">
          {tips.map((tip) => {
            if (dismissedTips.has(tip.id)) return null

            return (
              <div
                key={tip.id}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {tip.title}
                    </h5>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{tip.description}</p>
                  </div>
                  <button
                    onClick={() => handleDismissTip(tip.id)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completion Message */}
      {completedCount === localItems.length && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
            🎉 Du bist bereit!
          </h4>
          <p className="text-sm text-green-800 dark:text-green-300 mb-3">
            Du hast alle Einrichtungsschritte abgeschlossen. Viel Erfolg mit deiner Praxisplanung!
          </p>
          {onDismiss && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
            >
              Verstanden
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
