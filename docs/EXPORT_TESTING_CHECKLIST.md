# Phase 3.2 Export Features - Testing Checklist

**Status**: In Progress
**Date**: 2025-11-30
**Version**: 1.0

---

## 1. PDF Export Testing

### Basic Functionality
- [ ] PDF generation from break-even report
- [ ] PDF generation from monthly planning
- [ ] PDF generation from therapy performance
- [ ] PDF generation from expense summary
- [ ] PDF file downloads correctly
- [ ] PDF filename includes timestamp

### Layout & Formatting
- [ ] Portrait orientation renders correctly
- [ ] Landscape orientation renders correctly
- [ ] Page breaks occur at appropriate points
- [ ] Margins are consistent (10mm)
- [ ] Headers and footers appear correctly
- [ ] Tables format properly in PDF
- [ ] Charts/images display with good quality
- [ ] Text is readable (not too small)

### Styling
- [ ] Tailwind CSS styles preserved
- [ ] Dark mode colors handled correctly
- [ ] Colors are print-friendly
- [ ] Fonts are embedded correctly
- [ ] Line spacing is appropriate

### Metadata
- [ ] PDF title is set correctly
- [ ] Creator is "Wirtschaftlichkeitsplan"
- [ ] Creation date is included
- [ ] Subject line is descriptive

### Edge Cases
- [ ] Empty dataset generates PDF
- [ ] Very large dataset (5000+ rows) handles pagination
- [ ] Special characters (€, %, ä/ö/ü) render correctly
- [ ] Long text wraps appropriately

---

## 2. Excel/XLSX Export Testing

### Basic Functionality
- [ ] Data exports to Excel format
- [ ] Multiple worksheets created correctly
- [ ] Summary sheet is generated
- [ ] Metadata sheet includes export info
- [ ] File downloads correctly
- [ ] File can be opened in Excel, LibreOffice, Google Sheets

### Formatting
- [ ] Column widths auto-fit content
- [ ] Headers are bold
- [ ] First row is frozen
- [ ] Text is left-aligned
- [ ] Numbers are right-aligned
- [ ] Dates are formatted as DD.MM.YYYY
- [ ] Currency shows € symbol
- [ ] Percentages show % symbol

### Number Formatting
- [ ] Currency format: #,##0.00 "€"
- [ ] Percentage format: 0.0%
- [ ] Decimal places correct (2 for money, 1 for percent)
- [ ] Thousand separators appear
- [ ] Negative numbers display correctly

### Data Integrity
- [ ] All data is exported (no truncation)
- [ ] Decimal precision maintained
- [ ] Special characters preserved
- [ ] German umlauts (ä, ö, ü) display correctly
- [ ] NULL/empty values handled

### Conditional Formatting
- [ ] Positive values show in green
- [ ] Negative values show in red
- [ ] Header row has background color
- [ ] Alternating row colors for readability

---

## 3. CSV Export Testing

### Basic Functionality
- [ ] Data exports to CSV format
- [ ] File downloads correctly
- [ ] File can be opened in Excel, LibreOffice, Google Sheets

### Delimiter Options
- [ ] Comma (,) delimiter exports correctly
- [ ] Semicolon (;) delimiter exports correctly
- [ ] Tab delimiter exports correctly
- [ ] Pipe (|) delimiter exports correctly
- [ ] Data with commas is quoted properly

### Encoding Options
- [ ] UTF-8 encoding works
- [ ] UTF-8 with BOM encoding works
- [ ] ISO-8859-1 encoding works
- [ ] Special characters survive encoding

### Formatting Options
- [ ] Headers included when selected
- [ ] Headers excluded when deselected
- [ ] Date format: DD.MM.YYYY
- [ ] Date format: YYYY-MM-DD
- [ ] Decimal separator: period (.)
- [ ] Decimal separator: comma (,)
- [ ] Double quotes work correctly
- [ ] Single quotes work correctly

### Data Integrity
- [ ] All records exported
- [ ] Fields with special characters quoted
- [ ] Newlines in fields handled
- [ ] Empty fields preserved
- [ ] German umlauts display correctly

### Reimport Testing
- [ ] Exported CSV can be reimported
- [ ] Data integrity maintained after reimport
- [ ] Date formats preserved
- [ ] Number formats preserved

---

## 4. ZIP/Batch Export Testing

### Basic Functionality
- [ ] Multiple reports combine into ZIP
- [ ] ZIP file downloads correctly
- [ ] ZIP can be extracted
- [ ] All selected reports are included

### File Structure
- [ ] /monthly/ folder for monthly reports
- [ ] /reports/ folder for analysis reports
- [ ] /therapies/ folder for therapy reports
- [ ] README.txt included
- [ ] Folder structure is logical

### Compression
- [ ] ZIP is compressed (smaller than original)
- [ ] Compression ratio is reasonable
- [ ] Files decompress without errors

### Metadata
- [ ] README.txt contains export date
- [ ] README.txt lists included reports
- [ ] README.txt has correct structure
- [ ] Export timestamp in filename

### Format Combinations
- [ ] PDF + Excel combination works
- [ ] PDF + CSV combination works
- [ ] Excel + CSV combination works
- [ ] All three formats together works

### Edge Cases
- [ ] Empty selection shows error
- [ ] Single report selection works
- [ ] Large file count (50+ files) handles gracefully
- [ ] Large total size (500MB+) compresses

---

## 5. Email Delivery Testing

### Basic Functionality
- [ ] Export can be sent via email
- [ ] Email arrives in inbox
- [ ] Attachment is included
- [ ] Attachment is readable

### Email Template
- [ ] Subject line is descriptive
- [ ] Subject includes report type
- [ ] HTML email displays correctly
- [ ] Plain text fallback works
- [ ] German language correct

### Email Content
- [ ] Report type listed correctly
- [ ] Export date included
- [ ] Filename shown
- [ ] Instructions provided
- [ ] Company branding included

### Recipients
- [ ] Single recipient works
- [ ] Multiple recipients work
- [ ] Invalid emails rejected
- [ ] Email validation works

### Attachments
- [ ] PDF attachment works
- [ ] Excel attachment works
- [ ] CSV attachment works
- [ ] ZIP attachment works
- [ ] Attachment size reasonable

---

## 6. Scheduled Exports Testing

### Schedule Creation
- [ ] Daily schedule creates successfully
- [ ] Weekly schedule creates successfully
- [ ] Monthly schedule creates successfully
- [ ] Schedule validation works
- [ ] Error messages clear

### Schedule Timing
- [ ] Daily runs every day at specified time
- [ ] Weekly runs on specified day
- [ ] Monthly runs on specified date
- [ ] Next export time calculated correctly
- [ ] Time zone handled correctly

### Schedule Management
- [ ] Schedule can be edited
- [ ] Schedule can be deleted
- [ ] Schedule can be toggled active/inactive
- [ ] Schedule list displays correctly
- [ ] Active schedules highlighted

### Schedule Execution
- [ ] Scheduled export executes automatically
- [ ] Export completes successfully
- [ ] Status updates correctly
- [ ] Error handling works
- [ ] Retry on failure works

### Email Delivery for Scheduled Exports
- [ ] Email sent when configured
- [ ] Recipients notified correctly
- [ ] Schedule name in email subject
- [ ] Execution timestamp included

---

## 7. Export History Testing

### History Display
- [ ] All exports listed in history
- [ ] Sorted by date (newest first)
- [ ] Export type shown
- [ ] File format shown
- [ ] File size shown

### Status Tracking
- [ ] Pending status shows
- [ ] Processing status shows
- [ ] Completed status shows
- [ ] Failed status shows
- [ ] Status colors correct

### History Actions
- [ ] Download completed export works
- [ ] Retry failed export works
- [ ] Delete export works
- [ ] View details works
- [ ] Pagination works

### History Management
- [ ] Old exports auto-archive
- [ ] Archived exports hidden
- [ ] Very old exports deleted
- [ ] Storage limits respected
- [ ] Performance acceptable with many exports

---

## 8. Special Characters & Internationalization

### German Umlauts
- [ ] Ä displays correctly in all formats
- [ ] Ö displays correctly in all formats
- [ ] Ü displays correctly in all formats
- [ ] ä displays correctly in all formats
- [ ] ö displays correctly in all formats
- [ ] ü displays correctly in all formats
- [ ] ß displays correctly in all formats

### Currency Formatting
- [ ] € symbol displays correctly
- [ ] Amounts format with 2 decimals
- [ ] Thousand separators show
- [ ] Negative amounts show correctly

### Date Formatting
- [ ] German date format (DD.MM.YYYY) works
- [ ] ISO format (YYYY-MM-DD) works
- [ ] Localization respects user setting

### Numbers
- [ ] Decimal separator varies by locale
- [ ] Thousand separator varies by locale
- [ ] Percentages format correctly
- [ ] Large numbers handle correctly

---

## 9. Performance Testing

### PDF Generation
- [ ] Small report (<10 pages) generates in <5 seconds
- [ ] Medium report (10-50 pages) generates in <10 seconds
- [ ] Large report (50+ pages) generates in <30 seconds
- [ ] Memory usage is reasonable
- [ ] No browser crash with large documents

### Excel Generation
- [ ] Small dataset (<1000 rows) generates in <2 seconds
- [ ] Medium dataset (1000-5000 rows) generates in <5 seconds
- [ ] Large dataset (5000+ rows) generates in <15 seconds
- [ ] File size is reasonable

### CSV Generation
- [ ] Small dataset generates instantly
- [ ] Large dataset (10000+ rows) generates in <5 seconds
- [ ] File size minimal
- [ ] Memory usage low

### Batch Export
- [ ] 5 reports combine in <10 seconds
- [ ] 10 reports combine in <20 seconds
- [ ] ZIP compression completes in reasonable time

### Download
- [ ] Small file (<5MB) downloads immediately
- [ ] Medium file (5-50MB) downloads smoothly
- [ ] Large file (50+ MB) shows progress

---

## 10. Error Handling & Edge Cases

### Invalid Data
- [ ] Empty dataset handled gracefully
- [ ] NULL values don't cause crashes
- [ ] Very large numbers format correctly
- [ ] Very small numbers (0.01) format correctly

### File System
- [ ] Insufficient disk space handled
- [ ] File permission errors handled
- [ ] Invalid filename characters replaced
- [ ] Duplicate filename gets suffix

### Network Issues
- [ ] Email send timeout handled
- [ ] Retry logic works
- [ ] Error messages clear

### Browser Issues
- [ ] Works in Chrome/Chromium
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Works on mobile browsers

---

## 11. Data Security Testing

### Access Control
- [ ] User can only see own exports
- [ ] User cannot access other user's exports
- [ ] RLS policies enforced
- [ ] Unauthorized access rejected

### Sensitive Data
- [ ] Exports don't contain passwords
- [ ] Exports don't expose user IDs (except owner)
- [ ] Exports properly authenticated
- [ ] Export URLs require auth

### Data Retention
- [ ] Exports expire after 30 days
- [ ] Expired exports auto-delete
- [ ] User can delete exports manually
- [ ] Archive function works

---

## 12. Documentation & Help

- [ ] Export feature is documented
- [ ] Email templates documented
- [ ] Schedule format explained
- [ ] Troubleshooting guide provided
- [ ] FAQ covers common issues

---

## Test Results Summary

| Category | Status | Notes | Tester | Date |
|----------|--------|-------|--------|------|
| PDF Export | [ ] | | | |
| Excel Export | [ ] | | | |
| CSV Export | [ ] | | | |
| ZIP/Batch | [ ] | | | |
| Email Delivery | [ ] | | | |
| Scheduled Exports | [ ] | | | |
| Export History | [ ] | | | |
| Special Characters | [ ] | | | |
| Performance | [ ] | | | |
| Error Handling | [ ] | | | |
| Data Security | [ ] | | | |
| Documentation | [ ] | | | |

---

## Known Issues

(Document any known issues found during testing)

1. ...
2. ...
3. ...

---

## Recommendations

(Document any recommendations for improvements)

1. ...
2. ...
3. ...

---

## Sign-Off

- **Tested By**:
- **Date Completed**:
- **Overall Result**: ☐ PASS ☐ FAIL ☐ CONDITIONAL PASS

---
