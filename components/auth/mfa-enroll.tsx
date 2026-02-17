'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MfaEnrollProps {
  onEnrolled?: () => void
}

export function MfaEnroll({ onEnrolled }: MfaEnrollProps) {
  const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // Check current MFA status on mount
  useState(() => {
    checkMfaStatus()
  })

  async function checkMfaStatus() {
    setIsCheckingStatus(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error

      const verifiedFactors = data.totp.filter(f => f.status === 'verified')
      setIsEnrolled(verifiedFactors.length > 0)
    } catch {
      // If we can't check, assume not enrolled
    } finally {
      setIsCheckingStatus(false)
    }
  }

  async function startEnrollment() {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Ordi Pro Authenticator',
      })

      if (error) throw error

      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
      setStep('verifying')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einrichten der 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  async function verifyEnrollment() {
    if (verifyCode.length !== 6) {
      setError('Bitte geben Sie einen 6-stelligen Code ein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      })

      if (verifyError) throw verifyError

      setIsEnrolled(true)
      setStep('idle')
      toast.success('2FA erfolgreich aktiviert')
      onEnrolled?.()
    } catch (err: any) {
      setError(err.message === 'Invalid TOTP code'
        ? 'Ungültiger Code. Bitte versuchen Sie es erneut.'
        : err.message || 'Fehler bei der Verifizierung')
    } finally {
      setIsLoading(false)
    }
  }

  async function unenroll() {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()

      if (data?.totp && data.totp.length > 0) {
        for (const factor of data.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }

      setIsEnrolled(false)
      setStep('idle')
      toast.success('2FA deaktiviert')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Deaktivieren der 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isEnrolled ? (
            <ShieldCheck className="h-6 w-6 text-green-600" />
          ) : (
            <Shield className="h-6 w-6 text-neutral-500" />
          )}
          <div>
            <CardTitle className="text-lg">Zwei-Faktor-Authentifizierung (2FA)</CardTitle>
            <CardDescription>
              {isEnrolled
                ? '2FA ist aktiviert. Ihr Konto ist geschützt.'
                : 'Schützen Sie Ihr Konto mit einer Authenticator-App'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Already enrolled - show disable option */}
        {isEnrolled && step === 'idle' && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                2FA ist aktiv
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={unenroll}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4 mr-1" />}
              Deaktivieren
            </Button>
          </div>
        )}

        {/* Not enrolled - show enable button */}
        {!isEnrolled && step === 'idle' && (
          <Button onClick={startEnrollment} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            2FA aktivieren
          </Button>
        )}

        {/* QR Code enrollment step */}
        {step === 'verifying' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                1. Scannen Sie den QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator, Authy)
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code für 2FA" className="w-48 h-48" />
              </div>
              <details className="text-xs text-neutral-500">
                <summary className="cursor-pointer hover:text-neutral-700">
                  QR-Code kann nicht gescannt werden? Manueller Schlüssel
                </summary>
                <code className="block mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs break-all">
                  {secret}
                </code>
              </details>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                2. Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
              </p>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verifizierungscode</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono max-w-[200px]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={verifyEnrollment}
                disabled={isLoading || verifyCode.length !== 6}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Bestätigen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('idle')
                  setVerifyCode('')
                  setError('')
                }}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
