'use client'

import { useState } from 'react'
import { updatePracticeSettings } from '@/lib/actions/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NumberField } from '@/components/ui/number-field'
import type { PracticeSettings } from '@/lib/types'
import { toast } from 'sonner'
import { Save, CreditCard, Loader2 } from 'lucide-react'

interface PaymentFeeSectionProps {
  settings: PracticeSettings
  onUpdate: (updated: PracticeSettings) => void
}

/**
 * PaymentFeeSection Component
 *
 * Allows users to configure the payment processing fee percentage (e.g., SumUp fees).
 * This fee is deducted from revenue calculations to show net revenue per session.
 *
 * Default: 1.39% (standard SumUp card payment fee in Austria)
 */
export function PaymentFeeSection({ settings, onUpdate }: PaymentFeeSectionProps) {
  const [feePercentage, setFeePercentage] = useState<number>(
    settings.payment_processing_fee_percentage ?? 1.39
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate fee percentage (0-100%)
  const validateFee = (value: number): string | null => {
    if (isNaN(value)) {
      return 'Bitte geben Sie eine gueltige Zahl ein'
    }
    if (value < 0) {
      return 'Die Gebuehr kann nicht negativ sein'
    }
    if (value > 100) {
      return 'Die Gebuehr kann nicht ueber 100% liegen'
    }
    return null
  }

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setFeePercentage(value)
    setError(validateFee(value))
  }

  const handleSave = async () => {
    // Validate before saving
    const validationError = validateFee(feePercentage)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePracticeSettings({
        payment_processing_fee_percentage: feePercentage
      })

      if (result.success && result.data) {
        toast.success('Zahlungsgebuehr erfolgreich gespeichert')
        onUpdate(result.data)
      } else {
        const errorMessage = result.error || 'Speichern fehlgeschlagen'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error('Error saving payment fee:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(errorMessage)
      toast.error(`Fehler: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if value has changed from saved setting
  const hasChanges = feePercentage !== (settings.payment_processing_fee_percentage ?? 1.39)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          <CardTitle className="text-lg">Zahlungsabwicklungsgebuehren</CardTitle>
        </div>
        <CardDescription>
          Konfigurieren Sie den Prozentsatz der Zahlungsabwicklungsgebuehren (z.B. SumUp).
          Diese Gebuehren werden bei der Berechnung des Nettoerloes pro Sitzung beruecksichtigt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <NumberField
            label="Gebuehrenprozentsatz"
            value={feePercentage}
            onChange={handleFeeChange}
            step={0.01}
            min={0}
            max={100}
            suffix="%"
            placeholder="1.39"
            error={error ?? undefined}
            disabled={isLoading}
            helperText="Standard SumUp-Gebuehr: 1,39% pro Kartenzahlung"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={isLoading || !!error || !hasChanges}
            size="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </>
            )}
          </Button>

          {hasChanges && !error && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Nicht gespeicherte Aenderungen
            </span>
          )}
        </div>

        {/* Info box about fee calculation */}
        <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            <strong>Hinweis:</strong> Bei einem Preis von 100 EUR und einer Gebuehr von {feePercentage.toFixed(2)}%
            betraegt der Nettoerlos{' '}
            <span className="font-semibold text-neutral-900 dark:text-white">
              {(100 - (100 * feePercentage / 100)).toFixed(2)} EUR
            </span>{' '}
            pro Sitzung.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
