'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MfaVerifyProps {
  email?: string
}

export function MfaVerify({ email }: MfaVerifyProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()

    if (code.length !== 6) {
      setError('Bitte geben Sie einen 6-stelligen Code ein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get the current session to retrieve the challenge ID and factor ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) throw new Error('Keine aktive Sitzung gefunden')

      // Get the challenge ID from the current session
      // Note: In Supabase, the challenge is managed via the session JWT claims
      // We need to list factors and create a challenge first
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError || !factorsData) throw factorsError

      const verifiedFactors = factorsData.totp.filter(f => f.status === 'verified')
      if (verifiedFactors.length === 0) throw new Error('Keine 2FA-Methode konfiguriert')

      const factor = verifiedFactors[0]

      // Create a challenge for this factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })

      if (challengeError) throw challengeError

      // Verify the challenge with the user's code
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code,
      })

      if (verifyError) throw verifyError

      // MFA verification successful - session is now AAL2
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('MFA verification error:', err)
      setError(
        err.message === 'Invalid TOTP code'
          ? 'Ungültiger Code. Bitte versuchen Sie es erneut.'
          : err.message || 'Fehler bei der Verifizierung'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/login-gradient-bg.jpg')",
      }}
    >
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <Card
        className="w-full max-w-sm relative z-10"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-8 w-8 text-accent-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-neutral-800">
            Verifizierung erforderlich
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div
              className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-800 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-code" className="text-sm font-medium text-neutral-700">
                Authentifizierungscode
              </Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Wird verifiziert...
                </>
              ) : (
                'Verifizieren'
              )}
            </Button>
          </form>

          <div className="pt-4 text-center text-xs text-neutral-500 space-y-1">
            <p>Sichere Zwei-Faktor-Authentifizierung</p>
            <p>Ihr Konto ist geschützt</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
