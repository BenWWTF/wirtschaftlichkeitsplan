'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PracticeSettingsSchema, type PracticeSettingsInput } from '@/lib/validations'
import type { PracticeSettings } from '@/lib/types'
import { upsertPracticeSettingsAction } from '@/lib/actions/settings'
import { PRACTICE_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import { Save, Target } from 'lucide-react'

interface SettingsFormProps {
  settings: PracticeSettings | null
  onSaveSuccess?: () => void
}

export function SettingsForm({ settings, onSaveSuccess }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PracticeSettingsInput>({
    resolver: zodResolver(PracticeSettingsSchema),
    defaultValues: settings ? {
      practice_name: settings.practice_name,
      practice_type: settings.practice_type,
      monthly_fixed_costs: settings.monthly_fixed_costs,
      average_variable_cost_per_session: settings.average_variable_cost_per_session,
      expected_growth_rate: settings.expected_growth_rate,
      payment_processing_fee_percentage: settings.payment_processing_fee_percentage,
      annual_revenue_goal: settings.annual_revenue_goal,
    } : {
      practice_name: '',
      practice_type: 'mixed',
      monthly_fixed_costs: 8000,
      average_variable_cost_per_session: 20,
      expected_growth_rate: 5,
      payment_processing_fee_percentage: 1.39,
      annual_revenue_goal: null,
    },
  })

  // Reset form when settings data changes
  useEffect(() => {
    if (settings) {
      form.reset({
        practice_name: settings.practice_name,
        practice_type: settings.practice_type,
        monthly_fixed_costs: settings.monthly_fixed_costs,
        average_variable_cost_per_session: settings.average_variable_cost_per_session,
        expected_growth_rate: settings.expected_growth_rate,
        payment_processing_fee_percentage: settings.payment_processing_fee_percentage,
        annual_revenue_goal: settings.annual_revenue_goal,
      })
      // Explicitly update practice_type for Select component
      form.setValue('practice_type', settings.practice_type)
    }
  }, [settings?.id, settings, form])

  const onSubmit = async (values: PracticeSettingsInput) => {
    setIsLoading(true)
    try {
      const result = await upsertPracticeSettingsAction(values)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Einstellungen erfolgreich gespeichert')
        // Reload settings from database
        if (onSaveSuccess) {
          onSaveSuccess()
        }
      }
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        toast.error(`Fehler: ${error.message}`)
      } else {
        toast.error('Ein unbekannter Fehler ist aufgetreten')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Ordination Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Ordinations-Informationen
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Grundlegende Informationen über Ihre Ordination
              </p>
            </div>

            <FormField
              control={form.control}
              name="practice_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordinationsname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Ordination Dr. Müller"
                      {...field}
                      disabled={isLoading}
                      className="h-12 md:h-10"
                      autoComplete="organization"
                    />
                  </FormControl>
                  <FormDescription>
                    Der Name Ihrer Ordination
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="practice_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordinationstyp</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Typ wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRACTICE_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="min-h-[44px] flex items-center"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Art Ihrer Ordination (Kasse, Privat oder gemischt)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Processing Fees */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Zahlungsgebühren
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Gebührensatz für Kartenzahlungen (z.B. SumUp)
              </p>
            </div>

            <FormField
              control={form.control}
              name="payment_processing_fee_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zahlungsgebühren (%)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="1.39"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 1.39 : parseFloat(e.target.value)
                          field.onChange(value)
                        }}
                        disabled={isLoading}
                        className="h-12 md:h-10 w-full md:max-w-xs"
                        inputMode="decimal"
                        autoComplete="off"
                      />
                      <span className="text-neutral-600 dark:text-neutral-400">%</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Der Prozentsatz, den Sie pro Zahlung an den Kartendienstleister zahlen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Annual Revenue Goal */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-500" />
                Jahresziel
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Optionales Nettoumsatz-Ziel für das laufende Jahr
              </p>
            </div>

            <FormField
              control={form.control}
              name="annual_revenue_goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jahresziel Nettoumsatz</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        placeholder="z.B. 80000"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseFloat(e.target.value)
                          field.onChange(value)
                        }}
                        disabled={isLoading}
                        className="h-12 md:h-10 w-full md:max-w-xs"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      <span className="text-neutral-600 dark:text-neutral-400">EUR</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Ihr angestrebter Nettoumsatz für das gesamte Jahr. Wird als Fortschrittsbalken im Dashboard angezeigt.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full md:w-auto min-h-[48px] md:min-h-[44px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Speichern...' : 'Einstellungen speichern'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
