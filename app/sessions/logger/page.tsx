'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { TherapyType } from '@/lib/types'
import { logError } from '@/lib/utils/logger'
import { createClient } from '@/utils/supabase/client'

export default function SessionLoggerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [therapies, setTherapies] = useState<TherapyType[]>([])
  const [selectedTherapyId, setSelectedTherapyId] = useState<string>('')
  const [monthYear, setMonthYear] = useState<string>('')
  const [sessionsCount, setSessionsCount] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [revenuePreview, setRevenuePreview] = useState<number>(0)

  // Translate error messages to German
  const translations = {
    selectTherapy: 'Bitte wählen Sie eine Therapieform aus',
    selectMonth: 'Bitte wählen Sie einen Monat aus',
    invalidSessions: 'Die Anzahl der Sitzungen muss größer als 0 sein',
    logSuccess: (count: number) => `${count} Sitzung${count > 1 ? 'en' : ''} erfolgreich protokolliert`,
    logError: 'Fehler beim Protokollieren der Sitzungen',
    unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten',
    loadError: 'Fehler beim Laden der Therapietypen',
    noTherapies: 'Keine Therapieformen gefunden. Bitte erstellen Sie zunächst Therapieformen.'
  }

  // Load therapies on mount
  useEffect(() => {
    const loadTherapies = async () => {
      try {
        const { data, error } = await supabase
          .from('therapy_types')
          .select('*')
          .order('name', { ascending: true })

        if (error) {
          logError('SessionLoggerPage', 'Error loading therapies', error)
          setMessage({ type: 'error', text: translations.loadError })
          return
        }

        setTherapies(data || [])
      } catch (error) {
        logError('SessionLoggerPage', 'Unexpected error loading therapies', error)
        setMessage({ type: 'error', text: translations.loadError })
      }
    }

    loadTherapies()
  }, [supabase])

  // Update revenue preview when therapy or sessions count changes
  useEffect(() => {
    if (selectedTherapyId && sessionsCount > 0) {
      const therapy = therapies.find(t => t.id === selectedTherapyId)
      if (therapy) {
        setRevenuePreview(therapy.price_per_session * sessionsCount)
      }
    } else {
      setRevenuePreview(0)
    }
  }, [selectedTherapyId, sessionsCount, therapies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validate form
    if (!selectedTherapyId) {
      setMessage({ type: 'error', text: translations.selectTherapy })
      return
    }

    if (!monthYear) {
      setMessage({ type: 'error', text: translations.selectMonth })
      return
    }

    if (sessionsCount <= 0) {
      setMessage({ type: 'error', text: translations.invalidSessions })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/sessions/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          therapy_id: selectedTherapyId,
          month_year: monthYear,
          sessions_count: sessionsCount
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.message || translations.logError
        })
        return
      }

      setMessage({
        type: 'success',
        text: translations.logSuccess(sessionsCount)
      })

      // Reset form after success
      setTimeout(() => {
        setSelectedTherapyId('')
        setMonthYear('')
        setSessionsCount(1)
        setRevenuePreview(0)
        setMessage(null)
      }, 2000)

    } catch (error) {
      logError('SessionLoggerPage', 'Error submitting session log', error)
      setMessage({
        type: 'error',
        text: translations.unexpectedError
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Get today's date in YYYY-MM format for the input
  const today = new Date().toISOString().slice(0, 7)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sitzungen Protokollieren
          </h1>
          <p className="text-gray-600">
            Erfassen Sie absolvierte Therapiesitzungen, um Ihre tatsächlichen Metriken zu aktualisieren
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Therapy Type Selection */}
          <div className="mb-6">
            <label htmlFor="therapy" className="block text-sm font-semibold text-gray-700 mb-2">
              Therapieform
            </label>
            <select
              id="therapy"
              value={selectedTherapyId}
              onChange={(e) => setSelectedTherapyId(e.target.value)}
              disabled={isLoading || therapies.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wählen Sie eine Therapieform...</option>
              {therapies.map((therapy) => (
                <option key={therapy.id} value={therapy.id}>
                  {therapy.name} ({formatCurrency(therapy.price_per_session)}/Sitzung)
                </option>
              ))}
            </select>
            {therapies.length === 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                {translations.noTherapies}
              </p>
            )}
          </div>

          {/* Month Selection */}
          <div className="mb-6">
            <label htmlFor="month" className="block text-sm font-semibold text-gray-700 mb-2">
              Monat
            </label>
            <input
              id="month"
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              max={today}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sessions Count */}
          <div className="mb-6">
            <label htmlFor="sessions" className="block text-sm font-semibold text-gray-700 mb-2">
              Anzahl der Sitzungen
            </label>
            <input
              id="sessions"
              type="number"
              min="1"
              value={sessionsCount}
              onChange={(e) => setSessionsCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Revenue Preview */}
          {revenuePreview > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Einnahmevorschau</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(revenuePreview)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {sessionsCount} Sitzung{sessionsCount > 1 ? 'en' : ''} × {formatCurrency(
                  therapies.find(t => t.id === selectedTherapyId)?.price_per_session || 0
                )}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              !selectedTherapyId ||
              !monthYear ||
              sessionsCount <= 0 ||
              therapies.length === 0
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Wird gespeichert...' : 'Sitzungen Protokollieren'}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">So funktioniert es</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Wählen Sie eine Therapieform aus Ihrer Liste aus</li>
            <li>• Wählen Sie den Monat, in dem Sie die Sitzungen durchgeführt haben</li>
            <li>• Geben Sie die Anzahl der absolviertenSitzungen ein</li>
            <li>• Überprüfen Sie die Einnahmevorschau</li>
            <li>• Klicken Sie auf „Sitzungen Protokollieren", um Ihre tatsächlichen Metriken zu aktualisieren</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
