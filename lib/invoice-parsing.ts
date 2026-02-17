/**
 * Invoice text parsing utilities
 * Pure functions - works on both server and client (no 'use client' directive)
 * Used by server action parseBillImage() to extract structured data from OCR text
 */

/**
 * Parse extracted text to find invoice details
 */
export function parseInvoiceText(text: string): {
  vendor_name: string | null
  invoice_date: string | null
  amount: number | null
  currency: string
} {
  const result = {
    vendor_name: null as string | null,
    invoice_date: null as string | null,
    amount: null as number | null,
    currency: 'EUR'
  }

  if (!text || text.trim().length === 0) {
    console.log('[Parse] Empty text input')
    return result
  }

  console.log('[Parse] Input text length:', text.length)
  console.log('[Parse] First 500 chars:', text.substring(0, 500))

  // ──────────────────────────────────────────────
  // AMOUNT EXTRACTION - keyword-aware scoring
  // ──────────────────────────────────────────────

  const candidates: { amount: number; score: number; position: number; matchText: string }[] = []

  const totalKeywords = [
    'endsumme', 'gesamtbetrag', 'gesamtsumme', 'rechnungsbetrag',
    'zahlbetrag', 'zu zahlen', 'total', 'summe', 'gesamt',
    'brutto', 'bruttobetrag', 'endbetrag', 'fällig', 'netto',
    'gesamtpreis', 'rechnungssumme', 'zwischensumme', 'betrag',
    'amount', 'inkl', 'incl'
  ]

  function scoreAmount(fullMatch: string, amountStr: string, pos: number) {
    let cleaned = amountStr
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3})/g, '') // Remove thousands dots (1.234,56 → 1234,56)
      .replace(/,/, '.') // Comma to period (1234,56 → 1234.56)

    const amount = parseFloat(cleaned)
    if (isNaN(amount) || amount <= 0 || amount >= 1000000) return

    const contextStart = Math.max(0, pos - 150)
    const contextEnd = Math.min(text.length, pos + fullMatch.length + 80)
    const context = text.substring(contextStart, contextEnd).toLowerCase()

    let score = 0

    // Near a total keyword? (highest weight)
    for (const keyword of totalKeywords) {
      if (context.includes(keyword)) {
        score += 50
        break
      }
    }

    // Has € symbol nearby?
    if (/€/.test(fullMatch) || /€/.test(context.substring(Math.max(0, pos - contextStart - 10)))) {
      score += 25
    }

    // EUR text nearby?
    if (/eur/i.test(context)) {
      score += 15
    }

    // Position bonus (later in document = more likely total)
    score += (pos / Math.max(text.length, 1)) * 15

    // Penalize tiny amounts
    if (amount < 1) score -= 20
    else if (amount < 5) score -= 10

    // Tiebreaker: slightly favor larger amounts
    score += Math.min(amount / 100, 8)

    candidates.push({ amount, score, position: pos, matchText: fullMatch.trim() })
  }

  // Pattern 1: European comma-decimal format (most common in Austria)
  // Matches: 123,45 | 1.234,56 | € 123,45 | 123,45 €
  const commaDecimalRegex = /€?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*€?/g
  let match
  while ((match = commaDecimalRegex.exec(text)) !== null) {
    scoreAmount(match[0], match[1], match.index)
  }

  // Pattern 2: Dot-decimal format (international, less common in AT)
  // Only use if no comma-decimal amounts found
  if (candidates.length === 0) {
    const dotDecimalRegex = /€?\s*(\d+\.\d{2})\s*€?/g
    while ((match = dotDecimalRegex.exec(text)) !== null) {
      // Make sure it's not a thousands separator (e.g., 1.234 without ,xx after)
      scoreAmount(match[0], match[1], match.index)
    }
  }

  // Pattern 3: Amounts without clear decimal (e.g., "€ 150" or "150 EUR")
  if (candidates.length === 0) {
    const wholeAmountRegex = /€\s*(\d{2,6})\b|\b(\d{2,6})\s*€|\b(\d{2,6})\s*EUR\b/gi
    while ((match = wholeAmountRegex.exec(text)) !== null) {
      const amountStr = match[1] || match[2] || match[3]
      if (amountStr) scoreAmount(match[0], amountStr, match.index)
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score)
    result.amount = candidates[0].amount
    console.log('[Parse] Amount candidates:', candidates.slice(0, 5).map(c =>
      `${c.amount} (score: ${c.score.toFixed(0)}, match: "${c.matchText}")`
    ))
  } else {
    console.log('[Parse] WARNING: No amounts found in text')
    // Last resort: find any number that looks like money
    const anyNumberMatch = text.match(/(\d{2,})[,.](\d{2})\b/)
    if (anyNumberMatch) {
      const fallback = parseFloat(`${anyNumberMatch[1]}.${anyNumberMatch[2]}`)
      if (!isNaN(fallback) && fallback > 0) {
        result.amount = fallback
        console.log('[Parse] Fallback amount:', fallback)
      }
    }
  }

  // ──────────────────────────────────────────────
  // DATE EXTRACTION - keyword-aware
  // ──────────────────────────────────────────────

  const dateKeywords = [
    'rechnungsdatum', 'datum', 'ausstellungsdatum', 'date',
    'invoice date', 'issued', 'ausgestellt', 'vom', 'rechnungstag',
    'belegdatum', 'leistungsdatum'
  ]

  let foundDate: string | null = null
  const lowerText = text.toLowerCase()

  // Try to find dates near keywords first
  for (const keyword of dateKeywords) {
    const idx = lowerText.indexOf(keyword)
    if (idx !== -1) {
      const windowText = text.substring(idx, Math.min(text.length, idx + 80))
      const dateMatch = windowText.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/)
      if (dateMatch) {
        foundDate = dateMatch[0]
        console.log(`[Parse] Date found near keyword "${keyword}":`, foundDate)
        break
      }
    }
  }

  // Fallback: first DD.MM.YYYY date in text
  if (!foundDate) {
    const dateMatch = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/)
    if (dateMatch) {
      foundDate = dateMatch[0]
      console.log('[Parse] Date found (first in text):', foundDate)
    }
  }

  // Also try YYYY-MM-DD format
  if (!foundDate) {
    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      foundDate = isoMatch[0]
      console.log('[Parse] Date found (ISO format):', foundDate)
    }
  }

  if (foundDate) {
    result.invoice_date = formatDateToISO(foundDate)
  }

  // ──────────────────────────────────────────────
  // VENDOR NAME EXTRACTION
  // ──────────────────────────────────────────────

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 2)

  // Company legal form indicators (Austria/Germany/international)
  const companyIndicators = /\b(gmbh|g\.m\.b\.h|ag|e\.?\s?u\.?|og|kg|gmbh\s*&\s*co|gesellschaft|co\.?\s*kg|ohg|verein|stiftung|ltd|inc|corp|ges\.?\s*m\.?\s*b\.?\s*h)\b/i

  // Lines that are definitely NOT vendor names
  const notNamePattern = /^(rechnung|invoice|datum|date|betrag|amount|summe|total|page|seite|tel\.?|fax|www\.|http|@|€|eur|mwst|ust|uid|iban|bic|blz|konto|nr\.|art\.?\s*nr|pos\.|menge|preis|stück|stk|netto|brutto|zwischensumme|rechnungsnummer|kundennummer|bestellnummer|lieferschein|\d{2,}[.,\/-]\d)/i

  const potentialNames = lines.filter(line => {
    if (line.length > 120) return false
    if (/^\d+$/.test(line)) return false
    if (notNamePattern.test(line)) return false
    if (/^[\d.,\/-\s€%]+$/.test(line)) return false
    return true
  })

  console.log('[Parse] Potential vendor names:', potentialNames.slice(0, 5))

  // Priority 1: line with company legal form
  const companyLine = potentialNames.find(line => companyIndicators.test(line))
  if (companyLine) {
    result.vendor_name = companyLine.substring(0, 100)
  } else if (potentialNames.length > 0) {
    // Priority 2: longest line in first 5 header lines
    const headerLines = potentialNames.slice(0, 5)
    const best = headerLines.reduce((a, b) => a.length >= b.length ? a : b)
    result.vendor_name = best.substring(0, 100)
  }

  console.log('[Parse] Final result:', JSON.stringify(result))

  return result
}

/**
 * Debug function to dump extracted text
 */
export function debugExtractedText(text: string): void {
  const lines = text.split('\n')
  console.log('=== DEBUG: EXTRACTED TEXT ===')
  console.log('Length:', text.length, 'Lines:', lines.length)
  console.log('--- First 500 chars ---')
  console.log(text.substring(0, 500))
  console.log('--- Amounts (comma-decimal) ---')
  console.log(text.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || 'NONE')
  console.log('--- Amounts (dot-decimal) ---')
  console.log(text.match(/\d+\.\d{2}/g) || 'NONE')
  console.log('--- Dates ---')
  console.log(text.match(/\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}/g) || 'NONE')
  console.log('--- € symbols ---')
  console.log((text.match(/€/g) || []).length)
  console.log('===========================')
}

/**
 * Convert date string to ISO format (YYYY-MM-DD)
 */
function formatDateToISO(dateStr: string): string | null {
  try {
    const parts = dateStr.split(/[.\/-]/)
    if (parts.length !== 3) return null

    let year: number, month: number, day: number

    if (parts[0].length === 4) {
      year = parseInt(parts[0])
      month = parseInt(parts[1])
      day = parseInt(parts[2])
    } else {
      day = parseInt(parts[0])
      month = parseInt(parts[1])
      year = parseInt(parts[2])
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    if (year < 1990 || year > new Date().getFullYear() + 1) return null

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  } catch {
    return null
  }
}

/**
 * Suggest expense category based on vendor name and text
 */
export function suggestCategory(vendorName: string, text: string): string {
  const lowerVendor = vendorName.toLowerCase()
  const lowerText = text.toLowerCase()

  const categoryKeywords: Record<string, string[]> = {
    'Räumlichkeiten': [
      'miete', 'rent', 'pacht', 'lease',
      'strom', 'wasser', 'gas', 'energie', 'electricity', 'water', 'heizung', 'heating', 'cooling',
      'betriebskosten', 'nebenkosten', 'facility', 'ordinationsräume', 'praxis'
    ],
    'Personal': [
      'gehalt', 'lohn', 'salary', 'wage', 'mitarbeiter', 'staff', 'personalkosten',
      'sozialversicherung', 'lohnverrechnung', 'fortbildung', 'training'
    ],
    'Medizinischer Bedarf': [
      'apotheke', 'pharma', 'medizin', 'medicine', 'pharmacy',
      'arztbedarf', 'verbrauchsmaterial', 'desinfektionsmittel', 'desinfection',
      'spritze', 'kanüle', 'verbandsmaterial', 'instrumentarium',
      'laborbedarf', 'diagnostik', 'röntgen'
    ],
    'Ausstattung & Geräte': [
      'wartung', 'reparatur', 'maintenance', 'repair', 'service', 'instandhaltung',
      'geräte', 'equipment', 'einrichtung', 'furniture', 'möbel',
      'computer', 'drucker', 'scanner', 'edv-ausrüstung', 'leasing',
      'liegen', 'stuhl', 'behandlungseinheit', 'sterilisator'
    ],
    'Versicherungen': [
      'versicherung', 'insurance', 'haftung', 'haftpflicht', 'liability',
      'berufshaftpflicht', 'betriebsversicherung', 'praxisausfall', 'rechtsschutz',
      'versicherungsbeitrag'
    ],
    'IT & Digital': [
      'software', 'ordinationssoftware', 'arztsoftware', 'praxissoftware',
      'ecard', 'e-card-system', 'it-support', 'cloud', 'telefon', 'telefax',
      'internet', 'telekommunikation', 'domain', 'website', 'server'
    ],
    'Beratung & Verwaltung': [
      'beratung', 'consulting', 'steuerberatung', 'steuer', 'tax', 'taxation',
      'buchhaltung', 'buchhalter', 'accounting', 'rechtsanwalt', 'lawyer', 'anwalt',
      'wirtschaftsprüfung', 'revision', 'prüfung', 'audit'
    ],
    'Pflichtbeiträge': [
      'ärztekammer', 'kammer', 'beitrag', 'fee', 'membership',
      'fortbildung', 'fortbildungsbeitrag',
      'pflichtversicherung', 'pflichtbeitrag'
    ],
    'Sonstige Betriebsausgaben': [
      'büro', 'office', 'papier', 'drucker', 'tinte', 'printer', 'paper', 'stationery',
      'werbung', 'marketing', 'advertising', 'anzeige',
      'hotel', 'lufthansa', 'taxi', 'uber', 'flug', 'bahn', 'travel', 'fahrt', 'reise',
      'bankgebühren', 'gebühren', 'fees', 'porto', 'versand', 'shipping'
    ]
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerVendor.includes(keyword) || lowerText.includes(keyword)) {
        return category
      }
    }
  }

  return 'Sonstige Betriebsausgaben'
}
