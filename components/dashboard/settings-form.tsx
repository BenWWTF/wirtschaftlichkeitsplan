'use client'

import { useState } from 'react'
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
import { Save } from 'lucide-react'

interface SettingsFormProps {
  settings: PracticeSettings | null
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PracticeSettingsInput>({
    resolver: zodResolver(PracticeSettingsSchema),
    defaultValues: settings
      ? {
          practice_name: settings.practice_name,
          practice_type: settings.practice_type,
          monthly_fixed_costs: settings.monthly_fixed_costs,
          average_variable_cost_per_session: settings.average_variable_cost_per_session,
          expected_growth_rate: settings.expected_growth_rate,
        }
      : {
          practice_name: '',
          practice_type: 'mixed',
          monthly_fixed_costs: 8000,
          average_variable_cost_per_session: 20,
          expected_growth_rate: 5,
        },
  })

  const onSubmit = async (values: PracticeSettingsInput) => {
    setIsLoading(true)
    try {
      const result = await upsertPracticeSettingsAction(values)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Einstellungen erfolgreich gespeichert')
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
          {/* Practice Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Praxis-Informationen
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Grundlegende Informationen über Ihre Praxis
              </p>
            </div>

            <FormField
              control={form.control}
              name="practice_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Praxisname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Praxis Dr. Müller"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Der Name Ihrer Praxis oder Ordination
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
                  <FormLabel>Praxistyp</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRACTICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Art Ihrer Praxis (Kasse, Privat oder gemischt)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Financial Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Finanzielle Annahmen
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Kosten und Wachstumserwartungen für Berechnungen
              </p>
            </div>

            <FormField
              control={form.control}
              name="monthly_fixed_costs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monatliche Fixkosten (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="8000.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Durchschnittliche monatliche Fixkosten (Miete, Personal, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="average_variable_cost_per_session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durchschnittliche variable Kosten pro Sitzung (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="20.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Durchschnittliche Kosten pro Therapiesitzung (Material, Verbrauchsmaterialien)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_growth_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erwartete Wachstumsrate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="-100"
                      max="1000"
                      placeholder="5.0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Erwartetes jährliches Wachstum in Prozent (kann negativ sein)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Verwendung dieser Einstellungen
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li>
                • <strong>Monatliche Fixkosten:</strong> Werden für Break-Even-Berechnungen verwendet
              </li>
              <li>
                • <strong>Variable Kosten:</strong> Dienen als Standard für neue Therapiearten
              </li>
              <li>
                • <strong>Wachstumsrate:</strong> Wird für Prognosen und Projektionen genutzt
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isLoading} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Speichern...' : 'Einstellungen speichern'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
