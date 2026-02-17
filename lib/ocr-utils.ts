'use client'

/**
 * OCR Utilities for bill and receipt text extraction
 *
 * Strategy:
 * 1. For PDFs: Try PDF.js text extraction first (instant, accurate for digital PDFs)
 * 2. If PDF has no embedded text (<50 chars), fall back to OCR
 * 3. For images: Use Tesseract.js OCR directly
 */

declare global {
  interface Window {
    Tesseract: {
      createWorker: (options?: any) => Promise<{
        recognize: (source: string, languages: string[]) => Promise<{ data: { text: string } }>
        terminate: () => Promise<void>
      }>
    }
    pdfjsWorker?: any
  }
}

let tesseractScriptLoading: Promise<void> | null = null

function loadTesseractScript(): Promise<void> {
  if (tesseractScriptLoading) return tesseractScriptLoading
  if (typeof window !== 'undefined' && window.Tesseract) return Promise.resolve()

  tesseractScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js'
    script.async = true
    script.onload = () => { tesseractScriptLoading = null; resolve() }
    script.onerror = () => { tesseractScriptLoading = null; reject(new Error('Failed to load Tesseract.js from CDN')) }
    document.head.appendChild(script)
  })
  return tesseractScriptLoading
}

let pdfJsLoading: Promise<any> | null = null

async function loadPdfJsScript(): Promise<any> {
  if (pdfJsLoading) return pdfJsLoading
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) return (window as any).pdfjsLib

  pdfJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfJsLoading = null
      resolve(pdfjsLib)
    }
    script.onerror = () => { pdfJsLoading = null; reject(new Error('Failed to load PDF.js from CDN')) }
    document.head.appendChild(script)
  })
  return pdfJsLoading
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Extract embedded text from PDF using PDF.js getTextContent()
 * This is instant and 100% accurate for digital PDFs
 */
async function extractPdfText(pdfBase64: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('PDF-Verarbeitung ist nur im Browser verfügbar')
  }

  const pdfjsLib = await loadPdfJsScript()
  const bytes = base64ToBytes(pdfBase64)
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  const numPages = pdf.numPages
  console.log(`[PDF Text] Extracting text from ${numPages} page(s)...`)

  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) pageTexts.push(pageText)
  }

  const fullText = pageTexts.join('\n')
  console.log(`[PDF Text] Extracted ${fullText.length} characters from embedded text`)
  return fullText
}

/**
 * Render PDF pages to images for OCR fallback
 */
async function renderPdfToImages(pdfBase64: string): Promise<string[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF-Verarbeitung ist nur im Browser verfügbar')
  }

  const pdfjsLib = await loadPdfJsScript()
  const bytes = base64ToBytes(pdfBase64)
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  const numPages = pdf.numPages
  const images: string[] = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    console.log(`[OCR] Rendering PDF page ${pageNum}/${numPages} to canvas...`)
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Failed to get canvas context')

    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg').split(',')[1])
  }

  return images
}

/**
 * Run Tesseract OCR on base64 images
 */
async function runOcr(imageBase64Array: string[], fileType: string): Promise<string> {
  console.log('[OCR] Loading Tesseract.js...')
  await loadTesseractScript()

  if (!window.Tesseract) {
    throw new Error('Tesseract.js konnte nicht geladen werden')
  }

  const worker = await window.Tesseract.createWorker()
  try {
    const texts: string[] = []
    for (let i = 0; i < imageBase64Array.length; i++) {
      console.log(`[OCR] Processing image ${i + 1}/${imageBase64Array.length}...`)
      let dataUrl = imageBase64Array[i]
      if (!dataUrl.startsWith('data:')) {
        dataUrl = `data:${fileType};base64,${imageBase64Array[i]}`
      }
      const result = await worker.recognize(dataUrl, ['deu', 'eng'])
      const text = (result.data?.text || '').trim()
      console.log(`[OCR] Image ${i + 1}: ${text.length} chars extracted`)
      if (text) texts.push(text)
    }
    return texts.join('\n\n')
  } finally {
    await worker.terminate()
  }
}

/**
 * Main extraction function - handles both PDFs and images
 */
export async function extractTextFromImage(imageBase64: string, fileType: string = 'image/jpeg'): Promise<string> {
  try {
    // PDF handling: try text extraction first, fall back to OCR
    if (fileType === 'application/pdf') {
      console.log('[Extract] PDF detected - trying embedded text extraction first...')

      try {
        const pdfText = await extractPdfText(imageBase64)

        // If we got meaningful text (>50 chars), use it directly
        if (pdfText.length > 50) {
          console.log('[Extract] Got embedded text from PDF, skipping OCR')
          return pdfText
        }

        console.log('[Extract] PDF has little/no embedded text, falling back to OCR...')
      } catch (e) {
        console.log('[Extract] PDF text extraction failed, falling back to OCR...', e)
      }

      // Fallback: render PDF to images and OCR
      const images = await renderPdfToImages(imageBase64)
      const ocrText = await runOcr(images, 'image/jpeg')
      if (!ocrText) {
        throw new Error('Kein Text im PDF erkannt. Das PDF könnte ein Bild-Scan mit schlechter Qualität sein.')
      }
      return ocrText
    }

    // Image handling: straight to OCR
    if (!fileType.startsWith('image/')) {
      throw new Error('Nur Bilddateien (JPG, PNG, WebP) und PDF-Dateien werden unterstützt')
    }

    const ocrText = await runOcr([imageBase64], fileType)
    if (!ocrText) {
      throw new Error('Kein Text im Bild erkannt. Das Bild könnte zu unscharf oder zu klein sein.')
    }
    return ocrText
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[Extract] Error:', errorMsg)
    throw new Error(`OCR Fehler: ${errorMsg}`)
  }
}

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

  console.log('[Parse] Input text length:', text.length)
  console.log('[Parse] First 300 chars:', text.substring(0, 300))

  // ──────────────────────────────────────────────
  // AMOUNT EXTRACTION - keyword-aware scoring
  // ──────────────────────────────────────────────

  // Match amounts in European format: 123,45 or 1.234,56 or with € symbol
  const amountRegex = /(?:€\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(?:\s*€)?/g
  // Also match dot-decimal format: 123.45 (less common in Austria but used in some systems)
  const amountRegexDot = /(?:€\s*)?(\d+\.\d{2})(?:\s*€)?/g

  const candidates: { amount: number; score: number; position: number; matchText: string }[] = []

  const totalKeywords = [
    'endsumme', 'gesamtbetrag', 'gesamtsumme', 'rechnungsbetrag',
    'zahlbetrag', 'zu zahlen', 'total', 'summe', 'gesamt',
    'brutto', 'bruttobetrag', 'endbetrag', 'fällig', 'netto',
    'gesamtpreis', 'rechnungssumme', 'zwischensumme', 'betrag'
  ]

  function scoreAmount(matchText: string, amountStr: string, pos: number) {
    // Parse the amount
    let cleaned = amountStr
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3})/g, '') // Remove thousands dots
      .replace(/,/, '.') // Comma to period

    const amount = parseFloat(cleaned)
    if (isNaN(amount) || amount <= 0 || amount >= 1000000) return

    // Get context around the match
    const contextStart = Math.max(0, pos - 120)
    const contextEnd = Math.min(text.length, pos + matchText.length + 60)
    const context = text.substring(contextStart, contextEnd).toLowerCase()

    let score = 0

    // Near a total keyword?
    for (const keyword of totalKeywords) {
      if (context.includes(keyword)) {
        score += 50
        break
      }
    }

    // Has € symbol?
    if (/€/.test(matchText)) score += 25

    // Position bonus (later = more likely total)
    score += (pos / Math.max(text.length, 1)) * 15

    // Penalize tiny amounts
    if (amount < 1) score -= 20
    else if (amount < 5) score -= 10

    // Tiebreaker: slightly favor larger amounts
    score += Math.min(amount / 100, 8)

    candidates.push({ amount, score, position: pos, matchText: matchText.trim() })
  }

  // Scan with comma-decimal regex (standard Austrian/German format)
  let match
  while ((match = amountRegex.exec(text)) !== null) {
    scoreAmount(match[0], match[1], match.index)
  }

  // Scan with dot-decimal regex (fallback for international formats)
  // Only use if no comma-decimal amounts found
  if (candidates.length === 0) {
    while ((match = amountRegexDot.exec(text)) !== null) {
      scoreAmount(match[0], match[1], match.index)
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score)
    result.amount = candidates[0].amount
    console.log('[Parse] Amount candidates:', candidates.slice(0, 5).map(c =>
      `${c.amount} (score: ${c.score.toFixed(0)}, match: "${c.matchText}")`
    ))
  } else {
    console.log('[Parse] No amounts found in text')
  }

  // ──────────────────────────────────────────────
  // DATE EXTRACTION - keyword-aware
  // ──────────────────────────────────────────────

  const dateKeywords = [
    'rechnungsdatum', 'datum', 'ausstellungsdatum', 'date',
    'invoice date', 'issued', 'ausgestellt', 'vom', 'rechnungstag'
  ]

  let foundDate: string | null = null

  // Try to find dates near keywords first
  const lowerText = text.toLowerCase()
  for (const keyword of dateKeywords) {
    const idx = lowerText.indexOf(keyword)
    if (idx !== -1) {
      const window = text.substring(idx, idx + 80)
      const dateMatch = window.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/)
      if (dateMatch) {
        foundDate = dateMatch[0]
        break
      }
    }
  }

  // Fallback: first date in text
  if (!foundDate) {
    const dateMatch = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/)
    if (dateMatch) foundDate = dateMatch[0]
  }

  // Also try YYYY-MM-DD format
  if (!foundDate) {
    const isoMatch = text.match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/)
    if (isoMatch) foundDate = isoMatch[0]
  }

  if (foundDate) {
    result.invoice_date = formatDateToISO(foundDate)
  }
  console.log('[Parse] Date found:', foundDate, '→', result.invoice_date)

  // ──────────────────────────────────────────────
  // VENDOR NAME EXTRACTION
  // ──────────────────────────────────────────────

  // Split into lines and clean up
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 2)

  // Company legal form indicators (Austria/Germany/international)
  const companyIndicators = /\b(gmbh|g\.m\.b\.h|ag|e\.?\s?u\.?|og|kg|gmbh\s*&\s*co|gesellschaft|co\.?\s*kg|ohg|verein|stiftung|ltd|inc|corp|ges\.?\s*m\.?\s*b\.?\s*h)\b/i

  // Lines that are definitely NOT vendor names
  const notNamePattern = /^(rechnung|invoice|datum|date|betrag|amount|summe|total|page|seite|tel\.?|fax|www\.|http|@|€|eur|mwst|ust|uid|iban|bic|blz|konto|nr\.|art\.?\s*nr|pos\.|menge|preis|stück|stk|netto|brutto|zwischensumme|rechnungsnummer|kundennummer|bestellnummer|lieferschein|\d{2,}[.,\/-]\d)/i

  const potentialNames = lines.filter(line => {
    if (line.length > 120) return false
    if (/^\d+$/.test(line)) return false
    if (notNamePattern.test(line)) return false
    // Skip lines that are just numbers with separators (dates, amounts, IDs)
    if (/^[\d.,\/-\s€%]+$/.test(line)) return false
    return true
  })

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

  console.log('[Parse] Vendor:', result.vendor_name)
  console.log('[Parse] Result:', JSON.stringify(result))

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
  console.log('--- Amounts found ---')
  console.log(text.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || 'NONE')
  console.log('--- Dates found ---')
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
      // YYYY-MM-DD
      year = parseInt(parts[0])
      month = parseInt(parts[1])
      day = parseInt(parts[2])
    } else {
      // DD.MM.YYYY
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
 * Maps keywords to actual Austrian expense categories for medical practices
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
