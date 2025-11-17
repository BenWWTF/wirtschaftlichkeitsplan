# OCR Bill Scanner Implementation

## Overview

The Ausgaben (Expenses) module includes an intelligent bill scanner that uses OCR (Optical Character Recognition) to automatically extract data from receipts and invoices. The implementation uses **Tesseract.js** for client-side text extraction.

## Architecture

### 1. **Client-Side OCR** (lib/ocr-utils.ts)
- **extractTextFromImage()** - Uses Tesseract.js to extract text from bill images
- **parseInvoiceText()** - Parses extracted text to find vendor, date, and amount
- **suggestCategory()** - Intelligently suggests expense category based on content
- Supports German and English text recognition
- Works directly in the browser (no server required for OCR)

### 2. **Server-Side Processing** (lib/actions/documents.ts)
- **parseBillImage()** - Processes extracted text and formats for database
- Structures data: vendor_name, invoice_date, amount, currency, description
- Integrates with Supabase for storage and authentication

### 3. **UI Components**
- **BillScanner** - User interface for uploading and scanning bills
- **DocumentViewer** - Display and manage attached documents
- **ExpenseFormEnhanced** - Form with document attachment support

## Technology Stack

### Dependencies
- **tesseract.js** (v5.1.1) - JavaScript OCR engine
  - Supports 100+ languages including German and English
  - Runs in browser (no external API calls)
  - Automatic caching of models

### Infrastructure
- Supabase Storage - Document storage
- Supabase Database - Document metadata (expense_documents table)
- Next.js 15 - Frontend and API routes

## Features

### ✅ Intelligent Text Extraction
- Recognizes German and English text
- Handles various document qualities
- Extracts:
  - Vendor/company name
  - Invoice date (DD.MM.YYYY format)
  - Amount (with EUR/€ detection)
  - Currency information

### ✅ Smart Category Suggestion
- Analyzes text content
- Suggests relevant expense category
- Supports Austrian expense categories
- Keywords for:
  - Utilities (Strom, Wasser, Gas)
  - Office Supplies (Büro, Papier, Drucker)
  - Professional Services (Beratung, Steuer)
  - Medical Supplies (Apotheke, Pharma)
  - Rent, Insurance, Travel, Marketing, Maintenance

### ✅ Document Management
- Upload multiple document formats (JPG, PNG, PDF, WebP)
- Store extracted text for future reference
- View, download, and delete documents
- Full audit trail with timestamps

### ✅ Privacy & Performance
- 100% client-side OCR (no external API calls)
- Data stays on user's device during processing
- No dependency on cloud APIs
- Fast processing with browser caching

## Usage Flow

### 1. Upload Bill
```
User clicks "Rechnung scannen"
→ Selects bill image/PDF
→ File validated (max 10MB)
```

### 2. Extract Text
```
Tesseract.js processes image in browser
→ Extracts German/English text
→ Text cached locally for performance
```

### 3. Parse & Structure
```
Server receives extracted text
→ parseInvoiceText() finds vendor, date, amount
→ suggestCategory() recommends category
→ Returns structured data
```

### 4. Review & Create
```
User reviews suggested data
→ Can adjust category and details
→ Confirms and creates expense
→ Document saved to Supabase Storage
```

## Date Format Handling

The implementation handles Austrian/German date formats:
- **Input**: DD.MM.YYYY or DD/MM/YYYY
- **Output**: ISO format YYYY-MM-DD
- **Validation**: Ensures date is realistic (1990 - current year + 1)

## Amount Parsing

Detects currency and amount patterns:
- Format: `€ 123.45` or `EUR 123,45`
- Handles both dot (.) and comma (,) as decimal separators
- Supports both thousand and decimal separators
- Returns as numeric value for database

## Error Handling

### Graceful Degradation
- If OCR fails, allows manual entry
- Partial text extraction still useful
- User can manually adjust any values

### Validation
- File size validation (max 10MB)
- File type validation (JPG, PNG, PDF, WebP)
- Date sanity checking
- Amount format validation

## Performance Considerations

### Browser Caching
- Tesseract.js downloads language models (~50MB)
- Models cached in browser IndexedDB
- Subsequent scans much faster (no redownload)
- User sees progress during first use

### Processing Time
- First OCR: ~30-60 seconds (includes model download)
- Subsequent OCR: ~5-15 seconds
- Varies based on image quality and size

## File Structure

```
lib/
├── ocr-utils.ts                 # OCR utilities
├── actions/
│   └── documents.ts             # Server actions for documents
├── types.ts                      # ExpenseDocument type

components/dashboard/
├── bill-scanner.tsx             # Bill upload & OCR UI
├── document-viewer.tsx          # Document preview & management
├── expense-form-enhanced.tsx    # Form with attachments

app/api/ocr/
└── parse-bill/route.ts          # API endpoint for parsing

supabase/migrations/
└── 003_create_expense_documents_table.sql  # Database schema

docs/
└── OCR_IMPLEMENTATION.md        # This file
```

## Database Schema

### expense_documents Table
```sql
- id (UUID)
- user_id (UUID) - FK to auth.users
- expense_id (UUID) - FK to expenses
- file_name (TEXT)
- file_path (TEXT) - Storage path
- file_size (INTEGER)
- file_type (TEXT)
- extracted_text (TEXT) - OCR output
- upload_date (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Security

### Row-Level Security (RLS)
- Users can only access their own documents
- Enforced at database level
- All operations authenticated via Supabase Auth

### File Storage
- Files stored in Supabase Storage bucket
- User-scoped paths (user_id/expense_id/...)
- Public URLs generated on-demand

### Privacy
- OCR processing happens in browser
- Text never sent to external APIs
- All data encrypted in transit and at rest

## Future Enhancements

### Potential Improvements
1. **Server-side OCR** - Use PaddleOCR or similar for higher accuracy
2. **Handwriting Support** - Extend to handwritten receipts
3. **Receipt Templates** - Custom parsing for known vendors
4. **Batch Processing** - Scan multiple receipts at once
5. **Line Item Extraction** - Extract individual items from receipts
6. **Language Detection** - Auto-detect document language

### Integration Options
- PaddleOCR for improved accuracy
- Claude Vision API for intelligent parsing
- Custom ML models for specific receipt types

## Testing

### Manual Testing
1. Navigate to Dashboard → Ausgaben
2. Click "Neue Ausgabe" → "Rechnung scannen"
3. Upload bill image
4. Wait for OCR processing
5. Verify extracted data
6. Adjust as needed and create expense

### Test Cases
- Clear bill images ✓
- Low quality receipts ✓
- Multi-currency documents
- Long receipts (multiple items)
- Different languages (German/English)

## Troubleshooting

### OCR Not Working
1. Check browser console for errors
2. Verify Tesseract.js is loaded
3. Check network for model downloads
4. Try different image format

### Poor Text Extraction
1. Improve image quality
2. Ensure good lighting
3. Keep document flat and straight
4. Use higher resolution images

### Large File Sizes
- Optimize images before upload
- Convert to JPEG format
- Maximum 10MB per file
- Consider image compression tools

## Environment Variables

No environment variables required for OCR!
- Tesseract.js is self-contained
- Models downloaded on-demand
- Cached locally in browser

Optional for future enhancements:
```bash
# For server-side OCR (future)
PADDLEOCR_API_KEY=...
```

## References

- [Tesseract.js Documentation](https://tesseract.js.org/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [Austrian Expense Categories](./EXPENSE_CATEGORIES.md)

## Support

For issues or feature requests related to OCR:
1. Check error messages in browser console
2. Review this documentation
3. Test with different bill images
4. Contact development team with specific error details
