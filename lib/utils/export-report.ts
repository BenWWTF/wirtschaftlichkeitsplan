/**
 * Export utilities for break-even reports
 */

import type { BreakEvenAnalysis } from '@/lib/types'

interface BreakEvenReportData {
  title: string
  generatedAt: string
  fixedCosts: number
  therapies: BreakEvenAnalysis[]
  sessionsNeeded: number
  avgContribution: number
}

/**
 * Export break-even report as CSV
 */
export function exportAsCSV(data: BreakEvenReportData): void {
  const { title, generatedAt, fixedCosts, therapies, sessionsNeeded, avgContribution } = data

  let csv = 'Break-Even Analysebericht\n'
  csv += `Generiert: ${generatedAt}\n\n`

  csv += 'Zusammenfassung\n'
  csv += `Monatliche Fixkosten,${fixedCosts}€\n`
  csv += `Durchschnittlicher Deckungsbeitrag,${avgContribution.toFixed(2)}€\n`
  csv += `Sitzungen für Break-Even,${sessionsNeeded}\n\n`

  csv += 'Therapiearten\n'
  csv += 'Name,Preis pro Sitzung,Deckungsbeitrag,Deckungsbeitrag %\n'

  therapies.forEach((therapy) => {
    csv += `${therapy.therapy_type_name},${therapy.price_per_session.toFixed(2)}€,${therapy.contribution_margin.toFixed(2)}€,${therapy.contribution_margin_percent.toFixed(1)}%\n`
  })

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `break-even-bericht-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export break-even report as JSON
 */
export function exportAsJSON(data: BreakEvenReportData): void {
  const { generatedAt } = data

  const exportData = {
    ...data,
    exportedAt: generatedAt,
    version: '1.0'
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `break-even-bericht-${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export break-even report as HTML (for printing or email)
 */
export function exportAsHTML(data: BreakEvenReportData): void {
  const { title, generatedAt, fixedCosts, therapies, sessionsNeeded, avgContribution } = data

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Break-Even Analysebericht</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      background: white;
    }
    h1 {
      color: #1f2937;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }
    h2 {
      color: #374151;
      margin-top: 30px;
    }
    .summary {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #dbeafe;
    }
    .summary-item:last-child {
      border-bottom: none;
    }
    .summary-label {
      font-weight: bold;
    }
    .summary-value {
      color: #3b82f6;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    @media print {
      body {
        background: white;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>📊 Break-Even Analysebericht</h1>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Generiert:</span>
      <span>${generatedAt}</span>
    </div>
  </div>

  <h2>📋 Zusammenfassung</h2>
  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Monatliche Fixkosten:</span>
      <span class="summary-value">${fixedCosts.toFixed(2)} €</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Durchschnittlicher Deckungsbeitrag:</span>
      <span class="summary-value">${avgContribution.toFixed(2)} €</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Sitzungen für Break-Even:</span>
      <span class="summary-value">${sessionsNeeded}</span>
    </div>
  </div>

  <h2>🏥 Therapiearten im Detail</h2>
  <table>
    <thead>
      <tr>
        <th>Therapieart</th>
        <th>Preis pro Sitzung</th>
        <th>Deckungsbeitrag</th>
        <th>Deckungsbeitrag %</th>
      </tr>
    </thead>
    <tbody>
      ${therapies
        .map(
          (therapy) => `
        <tr>
          <td>${therapy.therapy_type_name}</td>
          <td>${therapy.price_per_session.toFixed(2)} €</td>
          <td>${therapy.contribution_margin.toFixed(2)} €</td>
          <td>${therapy.contribution_margin_percent.toFixed(1)} %</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>💡 Interpretation</h2>
  <p>
    Sie benötigen <strong>${sessionsNeeded} Sitzungen pro Monat</strong>, um Ihre Fixkosten von
    <strong>${fixedCosts.toFixed(2)} €</strong> zu decken. Dies basiert auf einem durchschnittlichen
    Deckungsbeitrag von <strong>${avgContribution.toFixed(2)} €</strong> pro Sitzung.
  </p>
  <p>
    Jede Sitzung über diesem Break-Even-Punkt trägt zum Gewinn bei. Jede Sitzung darunter
    erhöht Ihren Verlust.
  </p>

  <div class="footer">
    <p>Dieser Bericht wurde mit Wirtschaftlichkeitsplan generiert.</p>
    <p>Die Berechnungen basieren auf den eingegebenen Daten und den aktuellen Therapiearten.</p>
  </div>
</body>
</html>
  `

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `break-even-bericht-${new Date().toISOString().split('T')[0]}.html`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Print break-even report directly
 */
export function printReport(data: BreakEvenReportData): void {
  const { title, generatedAt, fixedCosts, therapies, sessionsNeeded, avgContribution } = data

  const printContent = `
    <h1>Break-Even Analysebericht</h1>
    <p><strong>Generiert:</strong> ${generatedAt}</p>

    <h2>Zusammenfassung</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Monatliche Fixkosten:</strong></td>
        <td style="padding: 8px; border: 1px solid #ccc;">${fixedCosts.toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Durchschnittlicher Deckungsbeitrag:</strong></td>
        <td style="padding: 8px; border: 1px solid #ccc;">${avgContribution.toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;"><strong>Sitzungen für Break-Even:</strong></td>
        <td style="padding: 8px; border: 1px solid #ccc;">${sessionsNeeded}</td>
      </tr>
    </table>

    <h2>Therapiearten</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f0f0f0;">
        <th style="padding: 8px; border: 1px solid #ccc;">Therapieart</th>
        <th style="padding: 8px; border: 1px solid #ccc;">Preis</th>
        <th style="padding: 8px; border: 1px solid #ccc;">Deckungsbeitrag</th>
        <th style="padding: 8px; border: 1px solid #ccc;">%</th>
      </tr>
      ${therapies
        .map(
          (therapy) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">${therapy.therapy_type_name}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${therapy.price_per_session.toFixed(2)} €</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${therapy.contribution_margin.toFixed(2)} €</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${therapy.contribution_margin_percent.toFixed(1)} %</td>
        </tr>
      `
        )
        .join('')}
    </table>
  `

  const printWindow = window.open('', '', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }
}
