'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendMagicLink } from '@/lib/actions/auth'
import { BarChart3 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const result = await sendMagicLink(email)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLinkSent(true)
      setSentEmail(email)
      setMessage(`✓ Magic Link wurde an ${email} versendet`)
      setEmail('')
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error(err)
      setLoading(false)
    }
  }

  const handleResend = () => {
    setLinkSent(false)
    setMessage('')
    setError('')
    setSentEmail('')
  }

  const handleFreshLink = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/refresh-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: sentEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Fehler beim Anfordern des Magic Links')
        setLoading(false)
        return
      }

      setMessage(`✓ Frischer Magic Link wurde an ${sentEmail} versendet`)
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-6 w-6 text-neutral-900 dark:text-white" />
            <h1 className="font-semibold text-neutral-900 dark:text-white">
              Ordi Finanzen
            </h1>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Zurück
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">
              Anmelden
            </h2>
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {linkSent
                ? 'Überprüfen Sie Ihr E-Mail-Postfach'
                : 'Geben Sie Ihre E-Mail-Adresse ein, um einen Magic Link zu erhalten'
              }
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm">
                {message}
              </div>
            )}

            {/* Magic Link Form */}
            {!linkSent ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ihremail@beispiel.com"
                    required
                    autoFocus
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wird versendet...' : 'Magic Link senden'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
                    📧 Was nun?
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300 space-y-2">
                    <span className="block">1. Überprüfen Sie Ihr E-Mail-Postfach (und Spam-Ordner)</span>
                    <span className="block">2. Klicken Sie auf den Magic Link in der E-Mail</span>
                    <span className="block">3. Sie werden automatisch angemeldet</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleFreshLink}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird versendet...' : '🔄 Frischen Link anfordern'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird versendet...' : 'Andere E-Mail verwenden'}
                  </button>
                </div>
              </div>
            )}

            {/* Information Box */}
            <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border border-neutral-200 dark:border-neutral-600">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                <span className="block font-medium text-neutral-900 dark:text-white mb-2">🔐 Wie funktioniert Magic Link?</span>
                <span className="block">Magic Links sind eine sichere, passwortlose Anmeldung. Sie erhalten einen Link per E-Mail, der Sie automatisch anmeldet – ohne dass Sie sich ein Passwort merken müssen.</span>
              </p>
            </div>

            {/* Security Info */}
            <div className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <p>✅ Sichere Authentifizierung mit Supabase</p>
              <p>🔒 Ihre Daten sind verschlüsselt und sicher</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-neutral-600 dark:text-neutral-400 text-sm">
          <p>&copy; 2024 Ordi Finanzen. DSGVO-konform. EU-gehostet.</p>
        </div>
      </footer>
    </main>
  )
}
