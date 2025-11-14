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
import { upsertPracticeSettingsAction, deleteDemoDataAction } from '@/lib/actions/settings'
import { PRACTICE_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import { Save, Lightbulb, Trash2 } from 'lucide-react'

interface SettingsFormProps {
  settings: PracticeSettings | null
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<number>(0)

  const form = useForm<PracticeSettingsInput>({
    resolver: zodResolver(PracticeSettingsSchema),
    defaultValues: settings
      ? {
          practice_name: settings.practice_name,
          practice_type: settings.practice_type,
          monthly_fixed_costs: settings.monthly_fixed_costs,
          average_variable_cost_per_session: settings.average_variable_cost_per_session,
          expected_growth_rate: settings.expected_growth_rate,
          max_sessions_per_week: settings.max_sessions_per_week || 30,
        }
      : {
          practice_name: '',
          practice_type: 'mixed',
          monthly_fixed_costs: 8000,
          average_variable_cost_per_session: 20,
          expected_growth_rate: 5,
          max_sessions_per_week: 30,
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

  // Prevent rapid form submissions (debounce-like behavior)
  // Allows immediate submission but prevents spam within 1 second
  const canSubmit = Date.now() - submittedAt >= 1000 || !isLoading

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmittedAt(Date.now())
    form.handleSubmit(onSubmit)()
  }

  const handleDeleteDemoData = async () => {
    const confirmed = window.confirm(
      'Sind Sie sicher, dass Sie alle Demo-Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
    )
    if (!confirmed) return

    setIsLoading(true)
    try {
      const result = await deleteDemoDataAction()
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Demo-Daten erfolgreich gelöscht')
        // Refresh the page to show empty state
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Fehler beim Löschen der Demo-Daten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-8">
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
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

            <FormField
              control={form.control}
              name="max_sessions_per_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximale Sitzungen pro Woche</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="30"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isLoading}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    Kapazitätslimit für Therapiesitzungen pro Woche (z.B. 30 Sitzungen)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Verwendung dieser Einstellungen
              </h4>
            </div>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li>
                • <strong>Monatliche Fixkosten:</strong> Werden für Break-Even-Berechnungen und Steuern verwendet
              </li>
              <li>
                • <strong>Variable Kosten:</strong> Dienen als Standard für neue Therapiearten
              </li>
              <li>
                • <strong>Wachstumsrate:</strong> Wird für Prognosen und Projektionen genutzt
              </li>
              <li>
                • <strong>Max. Sitzungen/Woche:</strong> Definiert die Kapazitätsgrenze Ihrer Praxis
              </li>
            </ul>
          </div>

          <div className="flex justify-between gap-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteDemoData}
              disabled={isLoading}
              size="lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Demo-Daten löschen
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Speichern...' : 'Einstellungen speichern'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
