'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Trash2, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getKPIAlerts,
  createKPIAlert,
  updateKPIAlert,
  deleteKPIAlert,
  type KPIAlert,
} from '@/lib/actions/kpi-alerts'
import { toast } from 'sonner'

interface KPIAlertSettingsProps {
  className?: string
  onAlertsChange?: (alerts: KPIAlert[]) => void
}

const METRIC_OPTIONS = [
  { value: 'occupancyRate', label: 'Auslastungsquote (%)', unit: '%' },
  { value: 'profitMarginPercent', label: 'Gewinnmarge (%)', unit: '%' },
  { value: 'revenuePerSession', label: 'Umsatz pro Sitzung (€)', unit: '€' },
  { value: 'costPerSession', label: 'Kosten pro Sitzung (€)', unit: '€' },
]

/**
 * KPI Alert Settings Component
 * Allows users to set thresholds and get alerts when metrics breach them
 */
export function KPIAlertSettings({
  className = '',
  onAlertsChange,
}: KPIAlertSettingsProps) {
  const [alerts, setAlerts] = useState<KPIAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for new alert
  const [newAlert, setNewAlert] = useState<{
    metric_name: string
    threshold_value: number
    alert_type: 'below' | 'above'
    notification_channels: {
      inApp: boolean
      email: boolean
    }
  }>({
    metric_name: 'occupancyRate',
    threshold_value: 60,
    alert_type: 'below',
    notification_channels: {
      inApp: true,
      email: false,
    },
  })

  // Load alerts on mount
  useEffect(() => {
    loadAlerts()
  }, [])

  // Notify parent of alerts change
  useEffect(() => {
    onAlertsChange?.(alerts)
  }, [alerts, onAlertsChange])

  const loadAlerts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getKPIAlerts()
      setAlerts(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load alerts'
      setError(message)
      console.error('[KPIAlertSettings] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsCreating(true)
      const created = await createKPIAlert(newAlert)
      setAlerts([created, ...alerts])
      setNewAlert({
        metric_name: 'occupancyRate',
        threshold_value: 60,
        alert_type: 'below',
        notification_channels: {
          inApp: true,
          email: false,
        },
      })
      toast.success('Alert erstellt')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create alert'
      toast.error(message)
      console.error('[KPIAlertSettings] Error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleAlert = async (alert: KPIAlert) => {
    try {
      const updated = await updateKPIAlert(alert.id, {
        is_active: !alert.is_active,
      })
      setAlerts(alerts.map((a) => (a.id === alert.id ? updated : a)))
      toast.success(updated.is_active ? 'Alert aktiviert' : 'Alert deaktiviert')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update alert'
      toast.error(message)
      console.error('[KPIAlertSettings] Error:', err)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteKPIAlert(alertId)
      setAlerts(alerts.filter((a) => a.id !== alertId))
      toast.success('Alert gelöscht')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete alert'
      toast.error(message)
      console.error('[KPIAlertSettings] Error:', err)
    }
  }

  const getMetricLabel = (metricName: string) => {
    return METRIC_OPTIONS.find((m) => m.value === metricName)?.label || metricName
  }

  const getMetricUnit = (metricName: string) => {
    return METRIC_OPTIONS.find((m) => m.value === metricName)?.unit || ''
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
          KPI-Schwellenwert-Alerts
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Erhalten Sie benachrichtigungen, wenn wichtige kennzahlen ihre zielwerte unter- oder
          überschreiten
        </p>
      </div>

      {/* Create New Alert Form */}
      <form onSubmit={handleCreateAlert} className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
          Neuen Alert erstellen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Metric Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Kennzahl
            </label>
            <select
              value={newAlert.metric_name}
              onChange={(e) =>
                setNewAlert({ ...newAlert, metric_name: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
            >
              {METRIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Type Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Typ
            </label>
            <select
              value={newAlert.alert_type}
              onChange={(e) =>
                setNewAlert({
                  ...newAlert,
                  alert_type: (e.target.value === 'below' ? 'below' : 'above'),
                })
              }
              className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
            >
              <option value="below">Unterschreitet</option>
              <option value="above">Übersteigt</option>
            </select>
          </div>

          {/* Threshold Value */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Schwellenwert
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={newAlert.threshold_value}
                onChange={(e) =>
                  setNewAlert({
                    ...newAlert,
                    threshold_value: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
                step="0.1"
              />
              <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                {getMetricUnit(newAlert.metric_name)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isCreating}
              variant="default"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Alert erstellen
            </Button>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newAlert.notification_channels.inApp}
              onChange={(e) =>
                setNewAlert({
                  ...newAlert,
                  notification_channels: {
                    ...newAlert.notification_channels,
                    inApp: e.target.checked,
                  },
                })
              }
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              In-App Benachrichtigung
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={newAlert.notification_channels.email}
              onChange={(e) =>
                setNewAlert({
                  ...newAlert,
                  notification_channels: {
                    ...newAlert.notification_channels,
                    email: e.target.checked,
                  },
                })
              }
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              E-Mail Benachrichtigung
            </span>
          </label>
        </div>
      </form>

      {/* Alerts List */}
      <div className="space-y-2">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
          Aktive Alerts ({alerts.filter((a) => a.is_active).length})
        </h3>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-neutral-600 dark:text-neutral-400">Alerts werden geladen...</div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Keine Alerts erstellt. Erstellen Sie den ersten Alert oben.
            </p>
          </div>
        )}

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAlert(alert)}
                  className={`p-1.5 rounded-md transition-colors ${
                    alert.is_active
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                >
                  <Check
                    className={`w-4 h-4 ${
                      alert.is_active
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-neutral-400'
                    }`}
                  />
                </button>
                <div className={alert.is_active ? '' : 'opacity-50'}>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-50">
                    {getMetricLabel(alert.metric_name)}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {alert.alert_type === 'below'
                      ? `Unterschreitet ${alert.threshold_value}${getMetricUnit(alert.metric_name)}`
                      : `Übersteigt ${alert.threshold_value}${getMetricUnit(alert.metric_name)}`}
                  </p>
                  {(alert.notification_channels.inApp ||
                    alert.notification_channels.email) && (
                    <div className="flex gap-2 mt-2 text-xs">
                      {alert.notification_channels.inApp && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          In-App
                        </span>
                      )}
                      {alert.notification_channels.email && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          E-Mail
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDeleteAlert(alert.id)}
              className="ml-4 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Alert löschen"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
