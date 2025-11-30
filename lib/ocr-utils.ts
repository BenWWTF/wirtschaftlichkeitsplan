'use client'

/**
 * OCR Utilities for bill and receipt text extraction
 * Uses Tesseract.js for client-side OCR
 * Loads from CDN to avoid webpack chunking issues
 * Supports PDF rendering via PDF.js
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
  // If already loading, wait for it
  if (tesseractScriptLoading) {
    return tesseractScriptLoading
  }

  // If already loaded, return immediately
  if (typeof window !== 'undefined' && window.Tesseract) {
    return Promise.resolve()
  }

  tesseractScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js'
    script.async = true
    script.onload = () => {
      tesseractScriptLoading = null
      resolve()
    }
    script.onerror = () => {
      tesseractScriptLoading = null
      reject(new Error('Failed to load Tesseract.js from CDN'))
    }
    document.head.appendChild(script)
  })

  return tesseractScriptLoading
}

let pdfJsLoading: Promise<any> | null = null

async function loadPdfJsScript(): Promise<any> {
  // If already loading, wait for it
  if (pdfJsLoading) {
    return pdfJsLoading
  }

  // If already loaded, return immediately
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    return (window as any).pdfjsLib
  }

  pdfJsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      // Set up worker
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfJsLoading = null
      resolve(pdfjsLib)
    }
    script.onerror = () => {
      pdfJsLoading = null
      reject(new Error('Failed to load PDF.js from CDN'))
    }
    document.head.appendChild(script)
  })

  return pdfJsLoading
}

async function renderPdfToImages(pdfBase64: string): Promise<string[]> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF-Verarbeitung ist nur im Browser verfügbar')
  }

  try {
    console.log('Setting up PDF.js from CDN...')
    const pdfjsLib = await loadPdfJsScript()

    // Convert base64 to binary
    const binaryString = atob(pdfBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log('Loading PDF document...')
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const numPages = pdf.numPages
    console.log(`PDF has ${numPages} pages`)

    const images: string[] = []

    // Process all pages
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`Rendering PDF page ${pageNum}/${numPages} to canvas...`)
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2 }) // 2x scale for better OCR quality

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      canvas.width = viewport.width
      canvas.height = viewport.height

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport
      })

      await renderTask.promise

      // Convert canvas to base64 image
      const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1]
      images.push(imageBase64)
    }

    console.log(`PDF rendered to ${images.length} images successfully`)
    return images
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF-Rendering fehlgeschlagen: ${errorMsg}`)
  }
}

export async function extractTextFromImage(imageBase64: string, fileType: string = 'image/jpeg'): Promise<string> {
  try {
    let ocrBase64Array: string[] = [imageBase64]

    // Handle PDF files by rendering them to images first
    if (fileType === 'application/pdf') {
      console.log('PDF file detected, rendering to images first...')
      ocrBase64Array = await renderPdfToImages(imageBase64)
      fileType = 'image/jpeg'
    }

    // Only image files are supported for OCR
    if (!fileType.startsWith('image/')) {
      throw new Error('Nur Bilddateien (JPG, PNG, WebP) und PDF-Dateien werden unterstützt')
    }

    console.log('Loading Tesseract.js from CDN...')
    await loadTesseractScript()

    if (!window.Tesseract) {
      throw new Error('Tesseract.js library failed to load from CDN')
    }

    console.log('Creating Tesseract worker...')
    const worker = await window.Tesseract.createWorker()

    try {
      const allExtractedTexts: string[] = []

      // Process all images (pages)
      for (let i = 0; i < ocrBase64Array.length; i++) {
        const ocrBase64 = ocrBase64Array[i]
        console.log(`Starting OCR recognition for image ${i + 1}/${ocrBase64Array.length}...`)

        // Ensure we have a proper data URL
        let dataUrl = ocrBase64
        if (!dataUrl.startsWith('data:')) {
          dataUrl = `data:${fileType};base64,${ocrBase64}`
        }

        // Recognize German and English text (common for Austrian businesses)
        const result = await worker.recognize(dataUrl, ['deu', 'eng'])
        const extractedText = (result.data?.text || '').trim()
        console.log(`OCR completed for image ${i + 1}. Text length: ${extractedText.length}`)

        if (extractedText) {
          allExtractedTexts.push(extractedText)
        }
      }

      const combinedText = allExtractedTexts.join('\n\n--- PAGE BREAK ---\n\n')
      console.log('Combined OCR text from all pages. Total length:', combinedText.length)

      if (!combinedText) {
        throw new Error('Keine Textinhalte in der Bilddatei erkannt. Die Bilddatei könnte zu klein, zu unklar oder nicht lesbar sein.')
      }

      return combinedText
    } finally {
      console.log('Terminating Tesseract worker...')
      await worker.terminate()
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('OCR Error details:', {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      fileType
    })
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

  // Extract amount - look for all currency patterns and amounts
  const amountPatterns = [
    // € or EUR before amount: € 123,45 or EUR 123.45
    /(?:€|EUR)[\s]*([0-9]{1,}[.,][0-9]{2})/gi,
    // Amount before € or EUR: 123,45 € or 123.45 EUR
    /([0-9]{1,}[.,][0-9]{2})[\s]*(?:€|EUR)/gi,
    // Keywords followed by amount: Summe: 123,45 or Total 123.45
    /(?:Summe|Total|Gesamt|Endsumme|TOTAL|SUMME)[:\s]+([0-9]{1,}[.,][0-9]{2})/gi,
    // Amount with thousands separator: 1.234,56
    /([0-9]{1,3}(?:\.[0-9]{3})*[,][0-9]{2})/gi,
    // Simple amount: 123,45 or 123.45
    /([0-9]{2,}[.,][0-9]{2})/gi,
  ]

  const amounts: number[] = []
  for (const pattern of amountPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      let amountStr = match[1] || match[0]
      // Clean up the amount string
      amountStr = amountStr
        .replace(/[€EUR\s]/gi, '')
        .replace(/\.(?=\d{3})/g, '') // Remove thousands separator (dots before 3 digits)
        .replace(/,/, '.') // Convert comma to period for decimal

      const amount = parseFloat(amountStr)
      if (!isNaN(amount) && amount > 0 && amount < 1000000) {
        amounts.push(amount)
      }
    }
  }

  // Use the largest amount (usually the total)
  if (amounts.length > 0) {
    result.amount = Math.max(...amounts)
  }

  // Extract date patterns (DD.MM.YYYY or DD/MM/YYYY format common in Austria/Germany)
  // Prioritize dates near date-related keywords
  const dateKeywords = ['datum', 'ausstellungsdatum', 'rechnungsdatum', 'date', 'invoice date', 'issued', 'ausgestellt']

  let foundDate: string | null = null

  // First, try to find dates near keywords (more likely to be invoice date)
  for (const keyword of dateKeywords) {
    const keywordIndex = text.toLowerCase().indexOf(keyword)
    if (keywordIndex !== -1) {
      // Look for dates within 50 characters after keyword
      const contextWindow = text.substring(keywordIndex, keywordIndex + 100)
      const dateMatch = contextWindow.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})|(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/)
      if (dateMatch) {
        foundDate = dateMatch[0]
        break
      }
    }
  }

  // Fallback: if no date found near keywords, get first date from text
  if (!foundDate) {
    const datePatterns = [
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/g, // DD.MM.YYYY
      /(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/g, // YYYY.MM.DD
    ]
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        foundDate = match[0]
        break
      }
    }
  }

  if (foundDate) {
    result.invoice_date = formatDateToISO(foundDate)
  }

  // Extract vendor name - look for company indicators and take longest reasonable line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Filter out lines that are clearly not company names
  const potentialNames = lines.filter(line => {
    const len = line.length
    // Skip very short lines (< 3 chars) and very long lines (probably descriptions)
    if (len < 3 || len > 150) return false
    // Skip lines that are mostly numbers
    if (/^\d+$/.test(line)) return false
    // Skip common non-name keywords
    if (/^(rechnung|invoice|datum|date|betrag|amount|summe|total|page|seite|tel|fax|www|http|@|€|eur|\d{2,}\.?\d*[,-]\d{2})/i.test(line)) return false
    return true
  })

  // Prefer the first reasonable line as vendor name
  if (potentialNames.length > 0) {
    result.vendor_name = potentialNames[0].substring(0, 100)
  }

  console.log('Parsed invoice - Amounts found:', amounts.length, 'Selected amount:', result.amount, 'Vendor:', result.vendor_name, 'Date:', result.invoice_date)

  return result
}

/**
 * Debug function to dump extracted text
 */
export function debugExtractedText(text: string): void {
  const lines = text.split('\n')
  console.log('=== DEBUG: EXTRACTED TEXT ANALYSIS ===')
  console.log('Total characters:', text.length)
  console.log('Total lines:', lines.length)
  console.log('')
  console.log('=== RAW TEXT (first 500 chars): ===')
  console.log(text.substring(0, 500))
  console.log('')
  console.log('=== LINE BY LINE: ===')
  lines.forEach((line, idx) => {
    if (line.trim()) {
      console.log(`Line ${idx}: "${line}"`)
    }
  })
  console.log('')
  console.log('=== LOOKING FOR PATTERNS: ===')
  console.log('Amounts:', text.match(/([0-9]{1,}[.,][0-9]{2})/g) || 'NONE FOUND')
  console.log('Dates:', text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/g) || 'NONE FOUND')
  console.log('Currency symbols:', text.match(/[€$]/g) || 'NONE FOUND')
  console.log('=====================================')
}

/**
 * Convert date string to ISO format (YYYY-MM-DD)
 */
function formatDateToISO(dateStr: string): string | null {
  try {
    const parts = dateStr.split(/[.\/-]/)

    if (parts.length !== 3) return null

    let year, month, day

    // Handle YYYY-MM-DD format
    if (parts[0].length === 4) {
      year = parseInt(parts[0])
      month = parseInt(parts[1])
      day = parseInt(parts[2])
    } else {
      // Handle DD.MM.YYYY format
      day = parseInt(parts[0])
      month = parseInt(parts[1])
      year = parseInt(parts[2])
    }

    // Validate date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null
    }

    // Validate year (must be recent)
    if (year < 1990 || year > new Date().getFullYear() + 1) {
      return null
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  } catch (error) {
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

  // Map keywords to actual Austrian expense categories
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

  return 'Sonstige Betriebsausgaben' // Default to "Other Operating Costs"
}
