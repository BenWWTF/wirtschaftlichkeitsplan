/**
 * Invoice Parser - Server-side functions for parsing OCR-extracted text
 * These functions run on the server and extract structured data from invoice text
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
