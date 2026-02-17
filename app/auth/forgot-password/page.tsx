'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (resetError) {
        setError(resetError.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #5A7B88 0%, #7A9BA8 50%, #A8C5D1 100%)',
      }}
    >
      <Card
        className="w-full max-w-sm relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-neutral-800">
            Passwort zurücksetzen
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-700 font-medium">
                  E-Mail gesendet!
                </p>
                <p className="text-sm text-neutral-600">
                  Falls ein Konto mit <strong>{email}</strong> existiert, erhalten Sie in Kürze eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-800 text-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    E-Mail-Adresse
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihremail@beispiel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Wird gesendet...' : 'Link senden'}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Zurück zur Anmeldung
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
