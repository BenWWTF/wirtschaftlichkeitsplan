'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = await createClient()

      if (isSignUp) {
        // Sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        setError('Check your email to confirm your account')
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
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
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
              {isSignUp ? 'Konto erstellen' : 'Anmelden'}
            </h2>

            {error && (
              <div className={`mb-6 p-4 rounded-lg ${
                error.includes('Check your email')
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  E-Mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihremail@beispiel.com"
                  required
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Passwort
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird bearbeitet...' : isSignUp ? 'Konto erstellen' : 'Anmelden'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {isSignUp ? 'Bereits ein Konto?' : 'Kein Konto?'}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  {isSignUp ? 'Anmelden' : 'Konto erstellen'}
                </button>
              </p>
            </div>

            {/* Demo Mode or Getting Started Info */}
            {DEMO_MODE ? (
              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-3">
                  🧪 Demo-Modus aktiviert (Entwicklung)
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-4">
                  Sie können direkt zum Dashboard gehen, um das System zu testen.
                </p>
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-center"
                >
                  Zum Dashboard (Demo-Modus)
                </Link>
              </div>
            ) : (
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">
                  🚀 Los geht's:
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Klicken Sie auf "Konto erstellen" um ein neues Konto zu registrieren.<br />
                  Sie erhalten ein Bestätigungs-E-Mail und können sich dann anmelden.
                </p>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
            <p>✅ Sichere Authentifizierung mit Supabase</p>
            <p>🔒 Ihre Daten sind verschlüsselt und sicher</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2024 Ordi Finanzen. DSGVO-konform. EU-gehostet.</p>
        </div>
      </footer>
    </main>
  )
}
