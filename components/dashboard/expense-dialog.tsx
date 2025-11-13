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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ExpenseSchema, type ExpenseInput } from '@/lib/validations'
import type { Expense } from '@/lib/types'
import { createExpenseAction, updateExpenseAction } from '@/lib/actions/expenses'
import { AUSTRIAN_EXPENSE_CATEGORIES, RECURRENCE_INTERVALS } from '@/lib/constants'
import { toast } from 'sonner'

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

export function ExpenseDialog({ open, onOpenChange, expense }: ExpenseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [submittedAt, setSubmittedAt] = useState<number>(0)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          subcategory: expense.subcategory || undefined,
          amount: expense.amount,
          expense_date: expense.expense_date,
          is_recurring: expense.is_recurring,
          recurrence_interval: expense.recurrence_interval || undefined,
          description: expense.description || undefined,
        }
      : {
          category: '',
          subcategory: undefined,
          amount: 0,
          expense_date: today,
          is_recurring: false,
          recurrence_interval: undefined,
          description: undefined,
        },
  })

  // Watch category changes
  const watchCategory = form.watch('category')
  const watchIsRecurring = form.watch('is_recurring')

  useEffect(() => {
    if (watchCategory !== selectedCategory) {
      setSelectedCategory(watchCategory)
      // Reset subcategory when category changes
      form.setValue('subcategory', undefined)
    }
  }, [watchCategory, selectedCategory, form])

  // Get subcategories for selected category
  const subcategories = AUSTRIAN_EXPENSE_CATEGORIES.find(
    (cat) => cat.category === selectedCategory
  )?.subcategories || []

  const onSubmit = async (values: ExpenseInput) => {
    setIsLoading(true)
    try {
      let result

      if (expense) {
        // Update existing expense
        result = await updateExpenseAction(expense.id, values)
      } else {
        // Create new expense
        result = await createExpenseAction(values)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          expense
            ? 'Ausgabe erfolgreich aktualisiert'
            : 'Ausgabe erfolgreich erstellt'
        )
        onOpenChange(false)
        form.reset()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe erfassen'}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? 'Aktualisieren Sie die Details dieser Ausgabe.'
              : 'Erfassen Sie eine neue Betriebsausgabe für Ihre Praxis.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
            <FormField
              control={form.control}
              name="expense_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AUSTRIAN_EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {subcategories.length > 0 && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unterkategorie (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unterkategorie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories.map((subcat) => (
                          <SelectItem key={subcat} value={subcat}>
                            {subcat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betrag (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Betrag in Euro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details zur Ausgabe..."
                      {...field}
                      disabled={isLoading}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Wiederkehrende Ausgabe
                    </FormLabel>
                    <FormDescription>
                      Diese Ausgabe wiederholt sich regelmäßig
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchIsRecurring && (
              <FormField
                control={form.control}
                name="recurrence_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wiederholungsintervall</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Intervall wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECURRENCE_INTERVALS.map((interval) => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || !canSubmit}>
                {isLoading ? 'Speichern...' : expense ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
