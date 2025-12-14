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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/images/gradient-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0 opacity-0"
        style={{
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      />

      {/* Floating glass orbs for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-50 animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full opacity-40 animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full opacity-45 animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            animationDelay: '0.5s',
          }}
        />
      </div>

      <Card
        className="w-full max-w-md relative z-10 border-transparent"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(40px) saturate(250%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow:
            '0 32px 80px rgba(0, 0, 0, 0.3), 0 16px 64px rgba(255, 255, 255, 0.2), inset 0 3px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(255, 255, 255, 0.3)',
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
                className="border-white/40 bg-white/20 placeholder:text-neutral-500 text-neutral-800 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/30 transition-all duration-200"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
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
                className="border-white/40 bg-white/20 placeholder:text-neutral-500 text-neutral-800 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/30 transition-all duration-200"
                style={{
                  backdropFilter: 'blur(10px)',
                }}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full font-semibold py-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{
                backgroundColor: '#0C115B',
                color: 'white',
              }}
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
            <p>Ihre Daten sind verschlusselt und sicher</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
