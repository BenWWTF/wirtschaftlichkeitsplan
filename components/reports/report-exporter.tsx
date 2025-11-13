'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Sheet, FileJson } from 'lucide-react'
import { toast } from 'sonner'
import type { AdvancedAnalytics } from '@/lib/actions/analytics'

interface ReportExporterProps {
  analytics: AdvancedAnalytics | null
  reportName: string
}

export function ReportExporter({ analytics, reportName }: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!analytics) {
    return null
  }

  /**
   * Export as JSON
   */
  const exportAsJSON = () => {
    try {
      setIsExporting(true)
      const dataStr = JSON.stringify(analytics, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportName}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Report als JSON exportiert')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Export as CSV
   */
  const exportAsCSV = () => {
    try {
      setIsExporting(true)

      const rows: string[] = []

      // Header
      rows.push('Bericht: ' + reportName)
      rows.push('Datum: ' + new Date().toLocaleDateString('de-DE'))
      rows.push('')

      // Basic KPIs
      rows.push('KPI,Wert,Einheit')
      rows.push(`Auslastungsquote,${analytics.occupancyRate.toFixed(1)},%`)
      rows.push(`Umsatz pro Sitzung,${analytics.revenuePerSession.toFixed(2)},€`)
      rows.push(`Kosten pro Sitzung,${analytics.costPerSession.toFixed(2)},€`)
      rows.push(`Gewinnmarge,${analytics.profitMarginPercent.toFixed(1)},%`)
      rows.push(`Variable Gesamtkosten,${analytics.totalVariableCosts.toFixed(2)},€`)
      rows.push('')

      // Trends
      rows.push('Trend,Wert,%')
      rows.push(`Umsatz Trend,${analytics.revenueTrend !== null ? analytics.revenueTrend.toFixed(1) : 'N/A'},%`)
      rows.push(`Kosten Trend,${analytics.costTrend !== null ? analytics.costTrend.toFixed(1) : 'N/A'},%`)
      rows.push(`Gewinn Trend,${analytics.profitTrend !== null ? analytics.profitTrend.toFixed(1) : 'N/A'},%`)
      rows.push('')

      // Forecasting
      rows.push('Prognose,Wert,€')
      rows.push(`Umsatzprognose,${analytics.forecastedRevenue.toFixed(2)},€`)
      rows.push(`Sessions bis Break-Even,${isFinite(analytics.sessionsToBreakEven) ? analytics.sessionsToBreakEven.toFixed(0) : 'N/A'},Stück`)
      rows.push('')

      // Top Therapies
      if (analytics.topTherapyByRevenue) {
        rows.push('Top Therapie (Umsatz),Wert')
        rows.push(`Name,${analytics.topTherapyByRevenue.name}`)
        rows.push(`Umsatz,${analytics.topTherapyByRevenue.revenue.toFixed(2)}€`)
        rows.push(`Sessions,${analytics.topTherapyByRevenue.sessions}`)
        rows.push('')
      }

      if (analytics.topTherapyByMargin) {
        rows.push('Top Therapie (Marge),Wert')
        rows.push(`Name,${analytics.topTherapyByMargin.name}`)
        rows.push(`Marge,${analytics.topTherapyByMargin.margin.toFixed(2)}€`)
        rows.push(`Marge %,${analytics.topTherapyByMargin.marginPercent.toFixed(1)}%`)
        rows.push('')
      }

      // Cost Structure
      rows.push('Kostenstruktur,%')
      rows.push(`Variable Kosten,${analytics.costStructure.variableCostsPercent.toFixed(1)}%`)
      rows.push(`Fixkosten,${analytics.costStructure.fixedCostsPercent.toFixed(1)}%`)

      const csvContent = rows.join('\n')
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportName}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Report als CSV exportiert')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Export as HTML (for printing/PDF)
   */
  const exportAsHTML = () => {
    try {
      setIsExporting(true)

      const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      color: #333;
      background: white;
    }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .date { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #374151;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover { background-color: #f9fafb; }
    .metric {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f9fafb;
      padding: 15px;
      border-left: 4px solid #3b82f6;
    }
    .metric-label { color: #6b7280; font-size: 12px; font-weight: 600; }
    .metric-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    .metric-unit { font-size: 14px; color: #9ca3af; }
    .positive { color: #059669; }
    .negative { color: #dc2626; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>📊 ${reportName}</h1>
  <div class="date">Generiert am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}</div>

  <div class="section">
    <h2>Hauptkennzahlen</h2>
    <div class="metric">
      <div class="metric-card">
        <div class="metric-label">Auslastungsquote</div>
        <div><span class="metric-value">${analytics.occupancyRate.toFixed(1)}</span><span class="metric-unit">%</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Umsatz pro Sitzung</div>
        <div><span class="metric-value">${analytics.revenuePerSession.toFixed(2)}</span><span class="metric-unit">€</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Kosten pro Sitzung</div>
        <div><span class="metric-value">${analytics.costPerSession.toFixed(2)}</span><span class="metric-unit">€</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Gewinnmarge</div>
        <div><span class="metric-value">${analytics.profitMarginPercent.toFixed(1)}</span><span class="metric-unit">%</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Trends</h2>
    <table>
      <thead>
        <tr>
          <th>Indikator</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Umsatz</td>
          <td class="${analytics.revenueTrend !== null && analytics.revenueTrend > 0 ? 'positive' : 'negative'}">
            ${analytics.revenueTrend !== null ? analytics.revenueTrend > 0 ? '+' : '' : ''}${analytics.revenueTrend?.toFixed(1) ?? 'N/A'}%
          </td>
        </tr>
        <tr>
          <td>Kosten</td>
          <td class="${analytics.costTrend !== null && analytics.costTrend < 0 ? 'positive' : 'negative'}">
            ${analytics.costTrend !== null ? analytics.costTrend > 0 ? '+' : '' : ''}${analytics.costTrend?.toFixed(1) ?? 'N/A'}%
          </td>
        </tr>
        <tr>
          <td>Gewinn</td>
          <td class="${analytics.profitTrend !== null && analytics.profitTrend > 0 ? 'positive' : 'negative'}">
            ${analytics.profitTrend !== null ? analytics.profitTrend > 0 ? '+' : '' : ''}${analytics.profitTrend?.toFixed(1) ?? 'N/A'}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Dieser Bericht wurde automatisch generiert. Alle Angaben ohne Gewähr.</p>
  </div>
</body>
</html>
      `

      const dataBlob = new Blob([html], { type: 'text/html;charset=utf-8;' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportName}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Report als HTML exportiert (zum Drucken oder PDF speichern nutzen Sie "Drucken")')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsJSON}
        disabled={isExporting}
        className="gap-2"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsCSV}
        disabled={isExporting}
        className="gap-2"
      >
        <Sheet className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsHTML}
        disabled={isExporting}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        HTML/PDF
      </Button>
    </div>
  )
}
