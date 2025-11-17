/**
 * Tax Report Generation Service
 *
 * Generates various report formats (HTML, PDF, CSV, JSON) from tax calculation results.
 * Supports multiple export formats with proper formatting and styling.
 */

import type { ComprehensiveTaxResult, TaxScenario, ExportFormat } from '@/lib/types/tax-types'
import { formatEuro, formatPercentage } from '@/lib/config/tax-config'

// ========================================================================
// HTML REPORT GENERATION
// ========================================================================

export function generateHTMLReport(
  result: ComprehensiveTaxResult,
  scenarioName: string = 'Steuerschätzung'
): string {
  const reportDate = new Date(result.calculatedAt).toLocaleDateString('de-AT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steuerschätzung - ${scenarioName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
    }

    header {
      text-align: center;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #1f2937;
    }

    .report-meta {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #6b7280;
      margin-top: 10px;
    }

    h2 {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    @media (max-width: 600px) {
      .metric-grid {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      border: 1px solid #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      background: #f9fafb;
    }

    .metric-card-title {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .metric-card-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }

    .metric-card-subtitle {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 8px;
    }

    .positive {
      color: #10b981;
    }

    .negative {
      color: #ef4444;
    }

    .neutral {
      color: #6b7280;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }

    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 2px solid #d1d5db;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:hover {
      background: #f9fafb;
    }

    .text-right {
      text-align: right;
    }

    .section-box {
      background: #f9fafb;
      border-left: 4px solid #4f46e5;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin-top: 30px;
      font-size: 12px;
      color: #1e40af;
      border-radius: 4px;
    }

    .burden-visualization {
      background: #e5e7eb;
      height: 30px;
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }

    .burden-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }

    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      body {
        padding: 0;
      }
      .container {
        box-shadow: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Steuerschätzung Österreich ${result.taxYear}</h1>
      <div class="report-meta">
        <span>Szenario: ${scenarioName}</span>
        <span>Erstellt: ${reportDate}</span>
      </div>
    </header>

    <!-- Main Summary -->
    <section>
      <h2>Zusammenfassung</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-card-title">Bruttoeinkommen</div>
          <div class="metric-card-value">${formatEuro(result.totalGrossIncome)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Sozialversicherung</div>
          <div class="metric-card-value negative">−${formatEuro(result.totalSs)}</div>
          <div class="metric-card-subtitle">${((result.totalSs / result.totalGrossIncome) * 100).toFixed(1)}% der Einkünfte</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Einkommensteuer</div>
          <div class="metric-card-value negative">−${formatEuro(result.totalIncomeTax)}</div>
          <div class="metric-card-subtitle">${result.effectiveTaxRate.toFixed(1)}% effektiv</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Nettoeinkommen</div>
          <div class="metric-card-value positive">${formatEuro(result.netIncome)}</div>
          <div class="metric-card-subtitle">Das nehmen Sie mit</div>
        </div>
      </div>

      <div class="section-box">
        <strong>Gesamtsteuerbelastung: ${result.burdenPercentage.toFixed(1)}%</strong>
        <div class="burden-visualization">
          <div class="burden-fill" style="width: ${Math.min(result.burdenPercentage, 100)}%">
            ${result.burdenPercentage.toFixed(1)}%
          </div>
        </div>
        <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
          Von €${formatEuro(result.totalGrossIncome)} gehen €${formatEuro(result.totalDirectBurden)}
          an Steuern und Sozialversicherung
        </p>
      </div>
    </section>

    <!-- Income Details -->
    <section>
      <h2>Einkommendetails</h2>
      <table>
        <tbody>
          ${result.employmentGross > 0 ? `
          <tr>
            <td>Angestellteneinkommen (Brutto)</td>
            <td class="text-right">${formatEuro(result.employmentGross)}</td>
          </tr>
          <tr>
            <td>  Sozialversicherung (Angestellte)</td>
            <td class="text-right negative">−${formatEuro(result.employeeSs)}</td>
          </tr>
          ` : ''}
          ${result.selfEmploymentProfit > 0 ? `
          <tr>
            <td>Selbständiges Einkommen (Gewinn)</td>
            <td class="text-right">${formatEuro(result.selfEmploymentProfit)}</td>
          </tr>
          <tr>
            <td>  Gewinnfreibetrag (15%)</td>
            <td class="text-right negative">−${formatEuro(result.gewinnfreibetrag)}</td>
          </tr>
          <tr>
            <td>  Sozialversicherung (SVS)</td>
            <td class="text-right negative">−${formatEuro(result.selfEmployedSs)}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </section>

    <!-- Tax Calculation -->
    <section>
      <h2>Steuererrechnung</h2>
      <table>
        <tbody>
          <tr>
            <td>Steuerpflichtiges Einkommen</td>
            <td class="text-right">${formatEuro(result.finalTaxableIncome)}</td>
          </tr>
          <tr>
            <td>Einkommensteuer (vor Gutschriften)</td>
            <td class="text-right">${formatEuro(result.incomeTaxBeforeCredits)}</td>
          </tr>
          ${result.appliedCredits > 0 ? `
          <tr>
            <td>  Absetzbeträge (Gutschriften)</td>
            <td class="text-right negative">−${formatEuro(result.appliedCredits)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #d1d5db; font-weight: bold;">
            <td>Gesamte Einkommensteuer</td>
            <td class="text-right negative">−${formatEuro(result.totalIncomeTax)}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Tax Rates -->
    <section>
      <h2>Steuersätze</h2>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-card-title">Durchschnittssatz</div>
          <div class="metric-card-value">${result.effectiveTaxRate.toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Grenzsteuersatz</div>
          <div class="metric-card-value">${result.marginalTaxRate.toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Gesamtbelastung</div>
          <div class="metric-card-value">${result.burdenPercentage.toFixed(1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-title">Quartalsvorauszahlung</div>
          <div class="metric-card-value">${formatEuro(result.totalIncomeTax / 4)}</div>
        </div>
      </div>
    </section>

    <div class="info-box">
      <strong>ℹ️ Hinweis zur Berechnung:</strong>
      <p style="margin-top: 8px;">
        Diese Berechnung basiert auf den österreichischen Steuersätzen ${result.taxYear} und
        verwendet vereinfachte Annahmen. Für eine verbindliche Steuerberechnung konsultieren Sie
        bitte Ihren Steuerberater. Die Berechnung berücksichtigt: progressive Einkommensteuer
        (bis ${result.marginalTaxRate.toFixed(0)}%), SVS-Beiträge, Gewinnfreibetrag, und Absetzbeträge.
      </p>
    </div>

    <footer>
      <p>Wirtschaftlichkeitsplan - Steuerschätzung Tool</p>
      <p>Generiert am ${new Date().toLocaleString('de-AT')}</p>
    </footer>
  </div>
</body>
</html>
  `

  return html
}

// ========================================================================
// CSV REPORT GENERATION
// ========================================================================

export function generateCSVReport(
  result: ComprehensiveTaxResult,
  scenarioName: string = 'Steuerschätzung'
): string {
  const lines: string[] = []

  // Header
  lines.push(`Steuerschätzung Österreich ${result.taxYear}`)
  lines.push(`Szenario,${scenarioName}`)
  lines.push(`Erstellt,${new Date(result.calculatedAt).toLocaleDateString('de-AT')}`)
  lines.push('')

  // Summary
  lines.push('ZUSAMMENFASSUNG')
  lines.push('Metrik,Betrag,Prozentsatz')
  lines.push(`Bruttoeinkommen,${result.totalGrossIncome.toFixed(2)}€,100%`)
  lines.push(
    `Sozialversicherung,${result.totalSs.toFixed(2)}€,${((result.totalSs / result.totalGrossIncome) * 100).toFixed(1)}%`
  )
  lines.push(
    `Einkommensteuer,${result.totalIncomeTax.toFixed(2)}€,${result.effectiveTaxRate.toFixed(1)}%`
  )
  lines.push(`Nettoeinkommen,${result.netIncome.toFixed(2)}€,${(100 - result.burdenPercentage).toFixed(1)}%`)
  lines.push(`Gesamtbelastung,${result.totalDirectBurden.toFixed(2)}€,${result.burdenPercentage.toFixed(1)}%`)
  lines.push('')

  // Income Details
  lines.push('EINKOMMENDETAILS')
  lines.push('Kategorie,Betrag')
  if (result.employmentGross > 0) {
    lines.push(`Angestellteneinkommen (Brutto),${result.employmentGross.toFixed(2)}€`)
    lines.push(`Sozialversicherung (Angestellte),${result.employeeSs.toFixed(2)}€`)
  }
  if (result.selfEmploymentProfit > 0) {
    lines.push(`Selbständiges Einkommen (Gewinn),${result.selfEmploymentProfit.toFixed(2)}€`)
    lines.push(`Gewinnfreibetrag (15%),${result.gewinnfreibetrag.toFixed(2)}€`)
    lines.push(`Sozialversicherung (SVS),${result.selfEmployedSs.toFixed(2)}€`)
  }
  lines.push('')

  // Tax Calculation
  lines.push('STEUERERRECHNUNG')
  lines.push('Beschreibung,Betrag')
  lines.push(`Steuerpflichtiges Einkommen,${result.finalTaxableIncome.toFixed(2)}€`)
  lines.push(`Einkommensteuer (vor Gutschriften),${result.incomeTaxBeforeCredits.toFixed(2)}€`)
  if (result.appliedCredits > 0) {
    lines.push(`Absetzbeträge (Gutschriften),${result.appliedCredits.toFixed(2)}€`)
  }
  lines.push(`Gesamte Einkommensteuer,${result.totalIncomeTax.toFixed(2)}€`)
  lines.push('')

  // Tax Rates
  lines.push('STEUERSÄTZE')
  lines.push('Kennzahl,Wert')
  lines.push(`Durchschnittssatz,${result.effectiveTaxRate.toFixed(1)}%`)
  lines.push(`Grenzsteuersatz,${result.marginalTaxRate.toFixed(1)}%`)
  lines.push(`Gesamtbelastung,${result.burdenPercentage.toFixed(1)}%`)
  lines.push(`Quartalsvorauszahlung,${(result.totalIncomeTax / 4).toFixed(2)}€`)

  return lines.join('\n')
}

// ========================================================================
// JSON REPORT GENERATION
// ========================================================================

export function generateJSONReport(
  result: ComprehensiveTaxResult,
  scenarioName: string = 'Steuerschätzung'
): string {
  const report = {
    scenario: scenarioName,
    taxYear: result.taxYear,
    generatedAt: new Date(result.calculatedAt).toISOString(),
    summary: {
      totalGrossIncome: result.totalGrossIncome,
      totalSocialSecurity: result.totalSs,
      totalIncomeTax: result.totalIncomeTax,
      netIncome: result.netIncome,
      totalBurden: result.totalDirectBurden,
      burdenPercentage: result.burdenPercentage,
    },
    income: {
      employmentGross: result.employmentGross,
      employeeSocialSecurity: result.employeeSs,
      selfEmploymentProfit: result.selfEmploymentProfit,
      gewinnfreibetrag: result.gewinnfreibetrag,
      selfEmployedSocialSecurity: result.selfEmployedSs,
    },
    taxes: {
      incomeTaxBeforeCredits: result.incomeTaxBeforeCredits,
      appliedCredits: result.appliedCredits,
      totalIncomeTax: result.totalIncomeTax,
      taxLiability: result.taxLiability,
    },
    rates: {
      effectiveTaxRate: result.effectiveTaxRate,
      marginalTaxRate: result.marginalTaxRate,
      burdenPercentage: result.burdenPercentage,
      quarterlyPayment: result.totalIncomeTax / 4,
    },
  }

  return JSON.stringify(report, null, 2)
}

// ========================================================================
// REPORT GENERATION ORCHESTRATOR
// ========================================================================

export async function generateReport(
  result: ComprehensiveTaxResult,
  format: ExportFormat,
  scenarioName: string = 'Steuerschätzung'
): Promise<Blob | string> {
  switch (format) {
    case 'html': {
      const html = generateHTMLReport(result, scenarioName)
      return new Blob([html], { type: 'text/html; charset=utf-8' })
    }

    case 'csv': {
      const csv = generateCSVReport(result, scenarioName)
      return new Blob([csv], { type: 'text/csv; charset=utf-8' })
    }

    case 'json': {
      const json = generateJSONReport(result, scenarioName)
      return new Blob([json], { type: 'application/json; charset=utf-8' })
    }

    case 'pdf': {
      // PDF generation would require a library like pdfkit or html2pdf
      // For now, return HTML which can be printed to PDF
      const html = generateHTMLReport(result, scenarioName)
      return new Blob([html], { type: 'text/html; charset=utf-8' })
    }

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

// ========================================================================
// FILE DOWNLOAD HELPER
// ========================================================================

export function downloadReport(
  blob: Blob,
  filename: string,
  format: ExportFormat
): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${format === 'html' ? 'html' : format === 'csv' ? 'csv' : 'json'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ========================================================================
// BATCH COMPARISON REPORT
// ========================================================================

export function generateComparisonReport(
  scenarios: TaxScenario[],
  format: 'html' | 'csv' = 'html'
): string {
  if (format === 'csv') {
    const lines: string[] = []
    lines.push('Szenarioname,Bruttoeinkommen,Sozialversicherung,Einkommensteuer,Nettoeinkommen,Belastung')

    scenarios.forEach((scenario) => {
      const r = scenario.result
      lines.push(
        `"${scenario.scenarioName}",${r.totalGrossIncome.toFixed(2)},${r.totalSs.toFixed(2)},${r.totalIncomeTax.toFixed(2)},${r.netIncome.toFixed(2)},${r.burdenPercentage.toFixed(1)}%`
      )
    })

    return lines.join('\n')
  } else {
    // HTML format
    let html = `
<html>
  <head>
    <meta charset="UTF-8">
    <title>Vergleich Steuerszenarios</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
      th, td { padding: 10px; border: 1px solid #ddd; text-align: right; }
      th { background: #f3f3f3; font-weight: bold; }
      th:first-child, td:first-child { text-align: left; }
    </style>
  </head>
  <body>
    <h1>Vergleich Steuerszenarios</h1>
    <table>
      <tr>
        <th>Szenarioname</th>
        <th>Bruttoeinkommen</th>
        <th>Sozialversicherung</th>
        <th>Einkommensteuer</th>
        <th>Nettoeinkommen</th>
        <th>Belastung</th>
      </tr>
`
    scenarios.forEach((scenario) => {
      const r = scenario.result
      html += `
      <tr>
        <td>${scenario.scenarioName}</td>
        <td>${formatEuro(r.totalGrossIncome)}</td>
        <td>${formatEuro(r.totalSs)}</td>
        <td>${formatEuro(r.totalIncomeTax)}</td>
        <td>${formatEuro(r.netIncome)}</td>
        <td>${r.burdenPercentage.toFixed(1)}%</td>
      </tr>
`
    })

    html += `
    </table>
  </body>
</html>
`
    return html
  }
}
