/**
 * OCR Utilities for bill and receipt text extraction
 * Uses Tesseract.js for client-side OCR
 * Loads from CDN to avoid webpack chunking issues
 */

declare global {
  interface Window {
    Tesseract: {
      createWorker: (options?: any) => Promise<{
        recognize: (source: string, languages: string[]) => Promise<{ data: { text: string } }>
        terminate: () => Promise<void>
      }>
    }
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

export async function extractTextFromImage(imageBase64: string, fileType: string = 'image/jpeg'): Promise<string> {
  try {
    // PDF files require manual conversion to images (not supported directly)
    if (fileType === 'application/pdf') {
      throw new Error('PDF-Dateien werden von der OCR nicht direkt unterstützt. Bitte konvertieren Sie die PDF zu einem Bild (JPG oder PNG) und versuchen Sie es erneut.')
    }

    // Only image files are supported for direct OCR
    if (!fileType.startsWith('image/')) {
      throw new Error('Nur Bilddateien (JPG, PNG, WebP) werden unterstützt')
    }

    console.log('Loading Tesseract.js from CDN...')
    await loadTesseractScript()

    if (!window.Tesseract) {
      throw new Error('Tesseract.js library failed to load from CDN')
    }

    console.log('Creating Tesseract worker...')
    const worker = await window.Tesseract.createWorker({
      logger: (m: any) => console.log('[Tesseract]', m)
    })

    try {
      // Ensure we have a proper data URL
      let dataUrl = imageBase64
      if (!dataUrl.startsWith('data:')) {
        dataUrl = `data:${fileType};base64,${imageBase64}`
      }

      console.log('Starting OCR recognition...')
      // Recognize German and English text (common for Austrian businesses)
      const result = await worker.recognize(dataUrl, ['deu', 'eng'])

      const extractedText = (result.data?.text || '').trim()
      console.log('OCR completed. Text length:', extractedText.length)

      if (!extractedText) {
        throw new Error('Keine Textinhalte in der Bilddatei erkannt. Die Bilddatei könnte zu klein, zu unklar oder nicht lesbar sein.')
      }

      return extractedText
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

  // Extract currency and amount - look for EUR/€ patterns with numbers
  const amountPatterns = [
    /(?:€|EUR)[\s]*([\d.]+(?:[,]\d{2})?)/gi,
    /([\d.]+(?:[,]\d{2})?)\s*(?:€|EUR)/gi,
    /(?:Summe|Total|Gesamt).*?(?:€|EUR)?\s*([\d.]+(?:[,]\d{2})?)/gi,
    /(?:Betrag|Amount).*?([\d.]+(?:[,]\d{2})?)/gi,
  ]

  for (const pattern of amountPatterns) {
    const match = text.match(pattern)
    if (match) {
      const amountStr = match[0]
        .replace(/[€EUR\s]/gi, '')
        .replace(/\./, '') // Remove thousands separator
        .replace(/,/, '.') // Convert comma to period for decimal

      result.amount = parseFloat(amountStr)
      if (!isNaN(result.amount)) break
    }
  }

  // Extract date patterns (DD.MM.YYYY or DD/MM/YYYY format common in Austria/Germany)
  const datePatterns = [
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/g, // DD.MM.YYYY
    /(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/g, // YYYY.MM.DD
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      const dateStr = match[0]
      result.invoice_date = formatDateToISO(dateStr)
      if (result.invoice_date) break
    }
  }

  // Extract vendor name - usually appears at the beginning
  const lines = text.split('\n')
  if (lines.length > 0) {
    const firstNonEmptyLine = lines.find(line => line.trim().length > 3)
    if (firstNonEmptyLine) {
      result.vendor_name = firstNonEmptyLine.trim().substring(0, 100)
    }
  }

  return result
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
 */
export function suggestCategory(vendorName: string, text: string): string {
  const lowerVendor = vendorName.toLowerCase()
  const lowerText = text.toLowerCase()

  const categoryKeywords: Record<string, string[]> = {
    'Utilities': ['strom', 'wasser', 'gas', 'energie', 'electricity', 'water'],
    'Office Supplies': ['büro', 'office', 'papier', 'drucker', 'tinte', 'printer', 'paper'],
    'Professional Services': ['beratung', 'consulting', 'accounting', 'steuer', 'tax'],
    'Medical Supplies': ['apotheke', 'pharma', 'medizin', 'medicine', 'pharmacy'],
    'Rent': ['miete', 'rent', 'pacht', 'lease'],
    'Insurance': ['versicherung', 'insurance', 'haftung'],
    'Travel': ['hotel', 'lufthansa', 'taxi', 'uber', 'flug', 'bahn', 'travel'],
    'Marketing': ['werbung', 'marketing', 'advertising', 'anzeige'],
    'Maintenance': ['wartung', 'reparatur', 'maintenance', 'repair'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerVendor.includes(keyword) || lowerText.includes(keyword)) {
        return category
      }
    }
  }

  return 'Sonstiges' // Default to "Other"
}
