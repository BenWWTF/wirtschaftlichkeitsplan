# Bill Scanner - Quick Start Guide

## Overview

The Bill Scanner allows you to automatically extract expense data from receipts and invoices using OCR technology. Simply photograph your bill and the system extracts vendor information, amount, and date automatically.

## Getting Started

### Prerequisites
- Access to Ausgaben (Expenses) section
- Bill or receipt image (JPG, PNG, WebP) or PDF
- Stable internet connection (first use only)

### Supported Formats
- **Images**: JPG, JPEG, PNG, WebP
- **Documents**: PDF
- **File Size**: Up to 10MB
- **Recommended**: Clear, well-lit photographs

## Step-by-Step Guide

### 1. Navigate to Bill Scanner

```
Dashboard → Ausgaben → "Neue Ausgabe"
```

A dialog opens with two tabs:
- "Manuell erfassen" (Manual Entry)
- "Rechnung scannen" (Bill Scanner) ← Click here

### 2. Upload Your Bill

**Option A: Click to Upload**
```
Click "Dateien hierher ziehen oder klicken"
→ Select bill image from computer
```

**Option B: Drag and Drop**
```
Drag bill image to the upload area
→ Release to upload
```

### 3. Wait for OCR Processing

First time use:
- System downloads OCR models (~50MB)
- Takes 30-60 seconds
- **Don't close the window**
- Models cache for faster future use

Subsequent scans:
- Takes 5-15 seconds
- Uses cached models

### 4. Review Extracted Data

Once complete, you see:

```
┌─────────────────────────────────┐
│ ✓ Rechnung erfolgreich analysiert │
├─────────────────────────────────┤
│ Anbieter: [Vendor Name]          │
│ Betrag: [Amount] EUR             │
│ Datum: [Date]                    │
│ Kategorie: [Category]            │
│ Erkannter Text: [Full Text]      │
└─────────────────────────────────┘
```

### 5. Adjust Details (Optional)

- **Vendor Name**: Auto-filled, can edit
- **Date**: Auto-detected, can change
- **Amount**: Extracted, can correct
- **Category**: Smart suggestion, click dropdown to change

### 6. Create Expense

Click "Daten übernehmen & Ausgabe erstellen"

The system:
1. Validates all data
2. Creates expense record
3. Uploads bill image to storage
4. Saves extracted text for reference

### 7. Manage Documents

After creation, you can:
- **View**: Click document preview
- **Download**: Access the bill anytime
- **Delete**: Remove if needed
- **See extracted text**: Read OCR results

## How It Works

### OCR (Optical Character Recognition)

The system uses **Tesseract.js** to:

1. **Read Text** - Analyzes bill image for text
2. **Extract Data** - Finds vendor, date, amount
3. **Suggest Category** - Recommends expense type based on content
4. **Structure Data** - Formats for your expense record

### Example

**Input**: Photo of pharmacy receipt
```
                APOTHEKE ZUR STADT
           Wiedner Hauptstr. 12, 1040 Wien

Datum:        15.11.2025
Rechnung Nr:  12345

Ibuprofen 400mg    15,99 EUR
Vitamin D3         12,50 EUR

Summe:           28,49 EUR
```

**Output**: Structured expense data
```
Anbieter: APOTHEKE ZUR STADT
Datum: 2025-11-15
Betrag: 28,49
Währung: EUR
Kategorie: Medical Supplies (Apotheke erkannt)
Text: [Full bill text]
```

## Tips for Best Results

### ✅ Do's
- Use clear, well-lit photos
- Keep bill flat and straight
- Avoid shadows or reflections
- Use good camera focus
- Include entire bill in frame
- Use recent receipt (dates must be realistic)

### ❌ Don'ts
- Don't photograph at an angle
- Don't include hands or objects
- Don't use blurry images
- Don't crop important information
- Don't use very old receipts
- Don't use low resolution images

### Photo Tips
1. **Lighting**: Natural daylight is best
2. **Angle**: Photograph straight on (90°)
3. **Distance**: Fill frame with bill
4. **Focus**: Ensure text is sharp
5. **Background**: Use contrasting surface

## Supported Languages

The scanner understands:
- **German** (Deutsch) - Primary
- **English** (Englisch) - Secondary

For bilingual bills, both languages are processed.

## Common Scenarios

### Pharmacy Receipt
```
Recognized as: Medical Supplies / Apotheke
Common vendors: BIPA, Apotheke, Dr. Lund
```

### Utility Bill
```
Recognized as: Utilities
Common vendors: Verbund, OMV, Wien Energie
```

### Office Supplies
```
Recognized as: Office Supplies / Büro
Common vendors: Pagro, Staples, Office Depot
```

### Restaurant
```
Recognized as: Sonstiges (Other)
Vendors: Various restaurants
Note: Category may need manual adjustment
```

## Troubleshooting

### Issue: OCR Taking Too Long

**First Time**
- Normal behavior (model download)
- Can take 30-60 seconds
- Don't close window
- Check internet connection

**Subsequent Scans**
- Should be faster (5-15 seconds)
- Clear browser cache if slow
- Try different browser

### Issue: Poor Text Recognition

**Improve by:**
1. Take clearer photo
2. Ensure good lighting
3. Keep bill flat
4. Increase image resolution
5. Remove shadows

**Manual Fix:**
- Review extracted text
- Manually adjust vendor/amount
- Check date format

### Issue: Wrong Category Suggested

The system analyzes vendor name and text. If wrong:
1. Click category dropdown
2. Select correct category from list
3. Continue with expense creation

### Issue: Amount Not Detected

Possible causes:
- Amount not clearly visible
- Using unusual currency format
- Image quality too poor

**Fix:**
- Manually enter amount
- Verify currency is EUR
- Re-photograph bill if needed

### Issue: Date Format Issues

System expects: DD.MM.YYYY or DD/MM/YYYY

**If incorrect:**
1. Check bill date carefully
2. Manually enter correct date
3. Use YYYY-MM-DD format in system

## Data Privacy

### Your Bill is Safe
✅ OCR happens in your browser
✅ Image never sent to servers for OCR
✅ Only extracted text sent to server
✅ Bill image encrypted in storage
✅ Only you can access your documents

### Processing
1. Browser processes image locally
2. Extracts text
3. Sends structured data to server
4. You review and confirm
5. Only then saved to database

## Performance

### First Session
- Model download: ~50MB
- Processing time: 30-60 seconds
- Browser cache: ~50MB stored locally

### Subsequent Sessions
- Model available cached
- Processing time: 5-15 seconds
- No additional downloads

### Storage
- Models cached in browser IndexedDB
- Cleared when browser cache cleared
- Survives browser restarts

## Advanced Features

### Batch Processing (Future)
Coming soon: Scan multiple receipts at once

### Line Items (Future)
Coming soon: Extract individual items from receipts

### Multi-Language (Future)
Coming soon: Support more languages

### Receipt Templates (Future)
Coming soon: Special parsing for known vendors

## Getting Help

### Check Documentation
- See `OCR_IMPLEMENTATION.md` for technical details
- See `EXPENSE_CATEGORIES.md` for category list

### Common Questions

**Q: Is my bill data private?**
A: Yes! OCR processing happens locally. Only you can see your documents.

**Q: Do I need an API key?**
A: No! Tesseract.js is completely self-contained.

**Q: What languages are supported?**
A: German and English. More languages coming soon.

**Q: Why is first scan slow?**
A: Tesseract.js downloads language models (~50MB). This happens once, then it's cached.

**Q: Can I edit extracted data?**
A: Yes! Review screen allows editing all fields before saving.

**Q: What file types work?**
A: JPG, PNG, PDF, WebP (max 10MB)

## Best Practices

### Organization
1. **Photograph immediately** - Fresh receipts have clearer text
2. **Organize by category** - Keep related bills together
3. **Review carefully** - Check extracted data before saving
4. **Download backup** - Keep digital copies

### Accuracy
1. **Clear photos** - Better OCR results
2. **Recent dates** - System validates date ranges
3. **Complete bills** - Include all information
4. **Verify amounts** - Check against original

### Efficiency
1. **Batch process** - Multiple bills at once (future)
2. **Use categories** - For filtering and reporting
3. **Add descriptions** - For easy searching
4. **Attach originals** - Store digital bill copy

## Support & Feedback

Having issues or suggestions?

1. **Check this guide** - Most issues covered
2. **Review error messages** - Often explain the problem
3. **Try again** - Temporary network issues possible
4. **Clear browser cache** - Fix slow OCR performance
5. **Contact support** - For persistent issues

## Examples

### ✅ Excellent Bill Photo
- Well-lit
- Straight on angle
- Clear text
- Complete view
- High resolution

### ⚠️ Poor Quality Photo
- Dark/shadowed
- Angled view
- Blurry text
- Cropped
- Low resolution

## FAQ

**Q: Can I scan handwritten receipts?**
A: Not currently. Type-printed text works best.

**Q: What if the date is in English?**
A: System recognizes common English date formats.

**Q: Can I use a PDF instead of photo?**
A: Yes! PDF files are supported up to 10MB.

**Q: Is there a limit to file size?**
A: Yes, maximum 10MB per file.

**Q: Can I scan receipts in other currencies?**
A: EUR is primary. Other currencies detected but marked.

---

**Last Updated:** November 16, 2025
**Status:** Ready to Use
**Support Email:** support@ordinanzen.at (coming soon)
