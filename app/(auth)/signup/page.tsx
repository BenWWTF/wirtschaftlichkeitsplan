'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { SignUpSchema, type SignUpInput } from '@/lib/validations'
import { signUpAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      practice_name: ''
    }
  })

  async function onSubmit(values: SignUpInput) {
    try {
      setIsLoading(true)
      const result = await signUpAction(values)
      if (result?.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Wirtschaftlichkeitsplan
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Kostenlos registrieren
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="practice_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Praxisname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Dr. Schmidt - Ordination"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Mindestens 8 Zeichen erforderlich
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Wird registriert...' : 'Kostenlos registrieren'}
              </Button>
            </form>
          </Form>

          {/* Login Link */}
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            Haben Sie bereits ein Konto?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Anmelden
            </Link>
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="text-center mt-6 text-xs text-neutral-500 dark:text-neutral-400">
          <p>
            Durch die Registrierung stimmen Sie unseren{' '}
            <Link href="/datenschutz" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
              Datenschutzbestimmungen
            </Link>{' '}
            zu.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
