'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { NumberField } from '@/components/ui/number-field'
import { TherapyTypeSchema, type TherapyTypeInput } from '@/lib/validations'
import type { TherapyType } from '@/lib/types'
import { createTherapyAction, updateTherapyAction } from '@/lib/actions/therapies'
import { toast } from 'sonner'

interface TherapyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  therapy: TherapyType | null
}

export function TherapyDialog({ open, onOpenChange, therapy }: TherapyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TherapyTypeInput>({
    resolver: zodResolver(TherapyTypeSchema),
    defaultValues: therapy
      ? {
          name: therapy.name,
          price_per_session: therapy.price_per_session,
          variable_cost_per_session: therapy.variable_cost_per_session,
        }
      : {
          name: '',
          price_per_session: 0,
          variable_cost_per_session: 0,
        },
  })

  const onSubmit = async (values: TherapyTypeInput) => {
    setIsLoading(true)
    try {
      let result

      if (therapy) {
        // Update existing therapy
        console.log('Updating therapy:', therapy.id, values)
        result = await updateTherapyAction(therapy.id, values)
      } else {
        // Create new therapy
        console.log('Creating therapy:', values)
        result = await createTherapyAction(values)
      }

      console.log('Action result:', result)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          therapy
            ? 'Therapieart erfolgreich aktualisiert'
            : 'Therapieart erfolgreich erstellt'
        )
        onOpenChange(false)
        form.reset()
      }
    } catch (error) {
      console.error('Catch error:', error)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {therapy ? 'Therapieart bearbeiten' : 'Neue Therapieart erstellen'}
          </DialogTitle>
          <DialogDescription>
            {therapy
              ? 'Aktualisieren Sie die Details dieser Therapieart.'
              : 'Fügen Sie eine neue Therapieart mit Preis und Kosten hinzu.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Therapieart-Name"
                  placeholder="z.B. Physiotherapie, Logopädie"
                  helperText="Der Name der Therapieart (z.B. Physiotherapie)"
                  error={fieldState.error?.message}
                  disabled={isLoading}
                  required
                />
              )}
            />

            <FormField
              control={form.control}
              name="price_per_session"
              render={({ field, fieldState }) => (
                <NumberField
                  {...field}
                  label="Sitzungspreis"
                  placeholder="60.00"
                  suffix="€"
                  helperText="Preis pro Sitzung in Euro"
                  error={fieldState.error?.message}
                  disabled={isLoading}
                  step={0.01}
                  min={0}
                  required
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    field.onChange(value)
                  }}
                />
              )}
            />

            <FormField
              control={form.control}
              name="variable_cost_per_session"
              render={({ field, fieldState }) => (
                <NumberField
                  {...field}
                  label="Variable Kosten pro Sitzung"
                  placeholder="15.00"
                  suffix="€"
                  helperText="Kosten pro Sitzung (Material, Verbrauchsmaterial, etc.)"
                  error={fieldState.error?.message}
                  disabled={isLoading}
                  step={0.01}
                  min={0}
                  required
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    field.onChange(value)
                  }}
                />
              )}
            />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Beitragsmarge</h4>
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Absolut</p>
                  <p className="text-sm font-semibold text-green-600">
                    €{((form.watch('price_per_session') || 0) - (form.watch('variable_cost_per_session') || 0)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prozent</p>
                  <p className="text-sm font-semibold text-green-600">
                    {((form.watch('price_per_session') || 0) > 0
                      ? (((form.watch('price_per_session') || 0) - (form.watch('variable_cost_per_session') || 0)) /
                          (form.watch('price_per_session') || 1) *
                          100).toFixed(1)
                      : 0)}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Speichern...' : therapy ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
