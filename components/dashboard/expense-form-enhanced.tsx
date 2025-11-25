'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ExpenseSchema, type ExpenseInput } from '@/lib/validations'
import type { Expense, ExpenseDocument } from '@/lib/types'
import { createExpenseAction, updateExpenseAction } from '@/lib/actions/expenses'
import { uploadExpenseDocument, getExpenseDocuments } from '@/lib/actions/documents'
import { AUSTRIAN_EXPENSE_CATEGORIES, RECURRENCE_INTERVALS } from '@/lib/constants'
import { toast } from 'sonner'
import { Plus, Upload, X } from 'lucide-react'
import { DocumentViewer } from './document-viewer'

interface ExpenseFormEnhancedProps {
  expense?: Expense
  onSuccess?: () => void
}

export function ExpenseFormEnhanced({ expense, onSuccess }: ExpenseFormEnhancedProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [documents, setDocuments] = useState<ExpenseDocument[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

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

  const loadDocuments = useCallback(async () => {
    if (!expense) return
    const docs = await getExpenseDocuments(expense.id)
    setDocuments(docs)
  }, [expense])

  // Load documents if editing an expense
  useEffect(() => {
    if (expense) {
      loadDocuments()
    }
  }, [expense, loadDocuments])

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        category: expense.category,
        subcategory: expense.subcategory || undefined,
        amount: expense.amount,
        expense_date: expense.expense_date,
        is_recurring: expense.is_recurring,
        recurrence_interval: expense.recurrence_interval || undefined,
        description: expense.description || undefined,
      })
      setSelectedCategory(expense.category)
    } else {
      form.reset({
        category: '',
        subcategory: undefined,
        amount: 0,
        expense_date: today,
        is_recurring: false,
        recurrence_interval: undefined,
        description: undefined,
      })
      setSelectedCategory('')
    }
  }, [expense, form, today])

  // Watch category changes
  const watchCategory = form.watch('category')
  const watchIsRecurring = form.watch('is_recurring')

  useEffect(() => {
    if (watchCategory !== selectedCategory) {
      setSelectedCategory(watchCategory)
      form.setValue('subcategory', undefined)
    }
  }, [watchCategory, selectedCategory, form])

  // Get subcategories for selected category
  const subcategories = AUSTRIAN_EXPENSE_CATEGORIES.find(
    (cat) => cat.category === selectedCategory
  )?.subcategories || []

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadingFiles((prev) => [...prev, ...files])
  }

  const removeSelectedFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadSelectedFiles = async () => {
    if (!expense || uploadingFiles.length === 0) {
      toast.error('Bitte wählen Sie zuerst eine Ausgabe und Datei(en)')
      return
    }

    setIsLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of uploadingFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await uploadExpenseDocument(expense.id, {
          name: file.name,
          content: buffer,
          type: file.type
        })

        if (result.error) {
          toast.error(`${file.name}: ${result.error}`)
          errorCount++
        } else {
          successCount++
        }
      } catch (error) {
        console.error('Upload error:', error)
        errorCount++
        toast.error(`Fehler beim Upload: ${file.name}`)
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} Datei(en) erfolgreich hochgeladen`)
      setUploadingFiles([])
      await loadDocuments()
    }

    setIsLoading(false)
  }

  const onSubmit = async (values: ExpenseInput) => {
    setIsLoading(true)
    try {
      let result

      if (expense) {
        result = await updateExpenseAction(expense.id, values)
      } else {
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
        onSuccess?.()
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Fields */}
        <div className="space-y-4">
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
                    value={field.value && field.value > 0 ? field.value : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
        </div>

        {/* Document Management */}
        {expense && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Dokumente & Belege
            </h3>

            {/* Existing Documents */}
            {documents.length > 0 && (
              <DocumentViewer
                documents={documents}
                onDocumentsChange={loadDocuments}
              />
            )}

            {/* File Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Dateien hochladen
              </label>

              <div className="space-y-2">
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadingFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
                      >
                        <span className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                          <X className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <span className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Dateien auswählen</span>
                    </span>
                  </label>

                  {uploadingFiles.length > 0 && (
                    <Button
                      type="button"
                      onClick={uploadSelectedFiles}
                      disabled={isLoading}
                      variant="outline"
                    >
                      {isLoading ? 'Upload...' : 'Hochladen'}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Unterstützte Formate: JPG, PNG, PDF (Max. 10MB pro Datei)
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              form.reset()
              onSuccess?.()
            }}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Speichern...' : expense ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
