'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TherapyTypeSchema, type TherapyTypeInput } from '@/lib/validations'
import { createTherapyAction, updateTherapyAction } from '@/lib/actions/therapies'
import type { TherapyType } from '@/lib/types'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TherapyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  therapy?: TherapyType | null
}

export function TherapyDialog({
  open,
  onOpenChange,
  therapy
}: TherapyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TherapyTypeInput>({
    resolver: zodResolver(TherapyTypeSchema),
    defaultValues: {
      name: '',
      price_per_session: 150,
      variable_cost_per_session: 0
    }
  })

  // Update form when therapy changes
  useEffect(() => {
    if (therapy) {
      form.reset({
        name: therapy.name,
        price_per_session: therapy.price_per_session,
        variable_cost_per_session: therapy.variable_cost_per_session
      })
    } else {
      form.reset({
        name: '',
        price_per_session: 150,
        variable_cost_per_session: 0
      })
    }
  }, [therapy, form, open])

  async function onSubmit(values: TherapyTypeInput) {
    try {
      setIsLoading(true)

      let result

      if (therapy) {
        // Update existing
        result = await updateTherapyAction(therapy.id, values)
      } else {
        // Create new
        result = await createTherapyAction(values)
      }

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(
          therapy ? 'Therapieart aktualisiert' : 'Therapieart erstellt'
        )
        onOpenChange(false)
        form.reset()
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {therapy ? 'Therapieart bearbeiten' : 'Neue Therapieart'}
          </DialogTitle>
          <DialogDescription>
            {therapy
              ? 'Ändern Sie die Details dieser Therapieart'
              : 'Erstellen Sie eine neue Therapieart für Ihre Praxis'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name der Therapieart</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Einzelpsychotherapie"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    z.B. Einzeltherapie, Paartherapie, Gruppentherapie
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preis pro Sitzung (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="150"
                      step="0.01"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Ihr Honorar pro Sitzung
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="variable_cost_per_session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Kosten pro Sitzung (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      step="0.01"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    z.B. Materialkosten, Verbrauchsmaterialien
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contribution Margin Display */}
            {form.watch('price_per_session') > 0 && (
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Deckungsbeitrag pro Sitzung:
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  €{' '}
                  {(
                    form.watch('price_per_session') -
                    form.watch('variable_cost_per_session')
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  ({(
                    ((form.watch('price_per_session') -
                      form.watch('variable_cost_per_session')) /
                      form.watch('price_per_session')) *
                    100
                  ).toFixed(1)}
                  % Marge)
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
