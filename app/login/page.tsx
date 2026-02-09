'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort ist falsch'
          : signInError.message)
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          <CardTitle className="text-3xl font-bold text-neutral-800">
            Willkommen
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Melden Sie sich bei Ihrem Konto an
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ihr Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Passwort vergessen?
            </Link>
          </div>

          {/* Security Info */}
          <div className="pt-4 text-center text-xs text-neutral-500 space-y-1">
            <p>Sichere Authentifizierung mit Supabase</p>
            <p>Ihre Daten sind verschlüsselt und sicher</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
