'use client'

import { useState, useEffect } from 'react'
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
  onSuccess?: () => void
}

export function TherapyDialog({ open, onOpenChange, therapy, onSuccess }: TherapyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TherapyTypeInput>({
    resolver: zodResolver(TherapyTypeSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: therapy
      ? {
          name: therapy.name,
          price_per_session: therapy.price_per_session,
        }
      : {
          name: '',
          price_per_session: 0,
        },
  })

  // Update form when therapy prop changes
  useEffect(() => {
    if (therapy) {
      form.reset({
        name: therapy.name,
        price_per_session: therapy.price_per_session,
      })
    } else {
      form.reset({
        name: '',
        price_per_session: 0,
      })
    }
  }, [therapy, form])

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
        onSuccess?.()
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
              : 'Fügen Sie eine neue Therapieart mit Preis hinzu.'}
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
                  isDirty={form.formState.dirtyFields.name || false}
                  isTouched={fieldState.isTouched}
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
                  isDirty={form.formState.dirtyFields.price_per_session || false}
                  isTouched={fieldState.isTouched}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    field.onChange(value)
                  }}
                />
              )}
            />


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
