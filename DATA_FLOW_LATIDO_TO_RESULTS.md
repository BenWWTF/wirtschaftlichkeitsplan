# Data Flow: Latido Import → Results

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        1️⃣  LATIDO EXCEL UPLOAD                              │
│  User uploads Latido "Honorarnoten" (invoices) Excel file                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       2️⃣  PARSE LATIDO EXCEL                                │
│  File: latido-import.ts → parseLatidoExcel()                                │
│                                                                              │
│  ✓ Read Excel file (base64 → buffer)                                        │
│  ✓ Extract columns: Rechnungsdatum, Gesamtbetrag, Zahlungsstatus           │
│  ✓ For each row:                                                            │
│    - Parse date (DD.MM.YYYY format)                                         │
│    - Parse amount (Netto or Brutto)                                         │
│    - Skip cancellations (negative amount OR status="Storno")                │
│    - Skip duplicates (by Rechnungsnummer)                                   │
│  ✓ Create temporary "price marker": __price:250.00                          │
│                                                                              │
│  Each valid invoice = 1 session                                              │
│  Output: SessionImportRow[] with therapy_type = "__price:X.XX"              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3️⃣  SHOW PREVIEW & MONTHLY BREAKDOWN                     │
│  latido-import-form.tsx shows:                                              │
│  - Total invoices found                                                     │
│  - Valid invoices                                                           │
│  - Cancelled invoices                                                       │
│  - Monthly breakdown (Jan 5 sessions · €1,250 | Feb 3 sessions · €750)     │
│  - Any parsing errors/warnings                                              │
│                                                                              │
│  User clicks "Importieren" button                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    4️⃣  MATCH PRICE → THERAPY TYPE                           │
│  File: latido-import.ts → processLatidoSessions()                           │
│                                                                              │
│  For each parsed session:                                                   │
│  1. Get user's therapy_types from database                                  │
│  2. Create price map: 250.00 € → [Psychiatrische Erstordination]           │
│  3. Match invoice price to therapy type                                     │
│                                                                              │
│  Example:                                                                   │
│  Invoice amount: €250.00                                                    │
│     ↓                                                                        │
│  Price lookup: priceMap.get(250.00)                                         │
│     ↓                                                                        │
│  Therapy ID: "abc123" (Psychiatrische Erstordination)                       │
│     ↓                                                                        │
│  Result: { therapy_id: "abc123", sessions: 1, revenue: 250.00 }            │
│                                                                              │
│  ⚠️  No match? → Warning: "No therapy type found with price €250"           │
│  ⚠️  Multiple matches? → Use first one, show warning                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                  5️⃣  GROUP BY MONTH & THERAPY TYPE                          │
│                                                                              │
│  Latido Invoices (raw):                                                     │
│  ┌─────────────┬──────────┬─────────┐                                       │
│  │ Date        │ Amount   │ Status  │                                       │
│  ├─────────────┼──────────┼─────────┤                                       │
│  │ 2026-01-15  │ 250.00 € │ Bezahlt │ ──→ therapy_id: abc123               │
│  │ 2026-01-20  │ 250.00 € │ Bezahlt │ ──→ therapy_id: abc123               │
│  │ 2026-02-10  │ 250.00 € │ Bezahlt │ ──→ therapy_id: abc123               │
│  └─────────────┴──────────┴─────────┘                                       │
│                                                                              │
│  Grouped by month + therapy:                                                │
│  2026-01: { therapy_id: abc123, sessions: 2, revenue: 500.00 }              │
│  2026-02: { therapy_id: abc123, sessions: 1, revenue: 250.00 }              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              6️⃣  UPDATE monthly_plans TABLE IN DATABASE                     │
│  Supabase PostgreSQL                                                        │
│                                                                              │
│  For each (month, therapy_id) group:                                        │
│                                                                              │
│  Check if monthly_plan exists:                                              │
│  ✓ If exists: UPDATE actual_sessions = old + new                           │
│  ✓ If not: INSERT new row with actual_sessions                             │
│                                                                              │
│  Table: monthly_plans                                                       │
│  ┌──────────┬────────────────────┬─────────────┬────────────────┐          │
│  │ month    │ therapy_type_id    │ planned_    │ actual_        │          │
│  │          │                    │ sessions    │ sessions       │          │
│  ├──────────┼────────────────────┼─────────────┼────────────────┤          │
│  │ 2026-01  │ abc123             │ 5           │ 5 → 7 (import) │          │
│  │ 2026-02  │ abc123             │ 3           │ 0 → 1 (import) │          │
│  └──────────┴────────────────────┴─────────────┴────────────────┘          │
│                                                                              │
│  Also track import in imported_invoices table:                              │
│  - invoice_number: "INV-2026-001"                                           │
│  - date: "2026-01-15"                                                       │
│  - amount: 250.00                                                           │
│  - therapy_type_id: "abc123"                                                │
│  (Used for duplicate detection on next import)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   7️⃣  DISPLAY RESULTS IN UI                                 │
│  Route: /dashboard/ergebnisse                                               │
│  Component: MergedResultsTable                                              │
│                                                                              │
│  Load: getMonthlyPlansWithTherapies(month)                                  │
│     ↓                                                                        │
│  Query: SELECT * FROM monthly_plans JOIN therapy_types                      │
│     ↓                                                                        │
│  For each row calculate:                                                    │
│  - Geplant (planned_sessions): 5                                            │
│  - Tatsächlich (actual_sessions): 7 ← FROM IMPORT                           │
│  - Abweichung: 7 - 5 = +2 sessions                                          │
│  - Erreichung: 7/5 = 140%                                                   │
│                                                                              │
│  Table displayed to user:                                                   │
│  ┌───────────────────┬──────┬─────────┬────────────┬──────────┬───────┐   │
│  │ Therapieart       │Preis │Geplant  │Tatsächlich │Abweichung│Err.%  │   │
│  ├───────────────────┼──────┼─────────┼────────────┼──────────┼───────┤   │
│  │Psychiatrische ... │ 250  │ 5       │ 7          │ +2 (40%) │ 140%  │   │
│  │GESAMT             │  -   │ 5       │ 7          │ +2 (40%) │ 140%  │   │
│  └───────────────────┴──────┴─────────┴────────────┴──────────┴───────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Code Flow Summary

### 1. Upload Phase (React Client)
**File:** `components/dashboard/latido-import-form.tsx`
```typescript
handleFile(file)
  → convert file to base64
  → call parseLatidoExcel(base64)
  → show preview to user
```

### 2. Parsing Phase (Server Action)
**File:** `lib/actions/latido-import.ts::parseLatidoExcel()`
```typescript
// Read Excel, extract columns
const worksheet = XLSX.read(fileBuffer)
const rows = sheet_to_json(worksheet)

// For each row:
for (row of rows) {
  amount = parseFloat(row[amountCol])
  date = parseDate(row[dateCol])
  status = row[statusCol]

  // Skip cancellations
  if (amount < 0 || status === "Storno") skip

  // Create temporary session with price marker
  sessions.push({
    date: "2026-01-15",
    therapy_type: "__price:250.00",  // ← temporary
    sessions: 1,
    revenue: 250.00,
    invoice_number: "INV-2026-001"
  })
}

return { sessions, errors, warnings, summary }
```

### 3. Processing Phase (Server Action)
**File:** `lib/actions/latido-import.ts::processLatidoSessions()`
```typescript
// 3a. Get user's therapy types
const therapyTypes = await supabase
  .from('therapy_types')
  .select('id, name, price_per_session')

// 3b. Create price-to-therapy lookup map
priceMap = new Map()
for (therapy of therapyTypes) {
  priceMap.set(250.00, therapy)  // Match by price
}

// 3c. For each session, match price → therapy
for (session of sessions) {
  price = parseFloat(session.therapy_type.replace("__price:", ""))
  therapy = priceMap.get(price)  // Find matching therapy
  therapyId = therapy.id  // ← Replace price marker with ID
}

// 3d. Group by month and therapy
monthlyData["2026-01"][therapyId] = {
  actual: 2,      // 2 invoices in Jan
  revenue: 500.00 // 2 × €250
}

// 3e. Update database
for (month, therapy_id in monthlyData) {
  // Check if monthly_plan exists
  existing = await supabase
    .from('monthly_plans')
    .select()
    .eq('month', month)
    .eq('therapy_type_id', therapy_id)

  if (existing) {
    // Add to actual sessions (incremental)
    UPDATE monthly_plans
    SET actual_sessions = old + data.actual
  } else {
    // Create new row
    INSERT INTO monthly_plans (month, therapy_type_id, actual_sessions)
  }
}
```

### 4. Display Phase (React Component)
**File:** `components/dashboard/merged-results-table.tsx`
```typescript
// Load data from database
const plans = await getMonthlyPlansWithTherapies(month)

// For each plan, calculate metrics
for (plan of plans) {
  planned = plan.planned_sessions      // 5
  actual = plan.actual_sessions        // 7 (from import)
  variance = actual - planned          // 7 - 5 = +2
  achievement = actual / planned * 100 // 7/5 = 140%
}

// Display table
<table>
  <tr>
    <td>Therapieart</td>
    <td>Geplant: 5</td>
    <td>Tatsächlich: 7</td>  ← FROM LATIDO IMPORT
    <td>Abweichung: +2</td>
    <td>Erreichung: 140%</td>
  </tr>
</table>
```

---

## Key Points

### 🔄 How actual_sessions gets populated:
1. **User manually enters** via edit dialog → `updateActualSessions()`
2. **Latido import** → `processLatidoSessions()` increments `actual_sessions`
3. Both paths update the same `monthly_plans.actual_sessions` column

### 🎯 Price Matching Logic:
- Latido doesn't include therapy type names in invoices
- **Solution**: Match by invoice price to therapy price
- Example: €250.00 invoice → find therapy_type with price=250.00
- Handles multiple therapies with same price (shows warning, uses first match)

### 🔐 Duplicate Detection:
- Tracks imported invoices in `imported_invoices` table
- Uses Rechnungsnummer (invoice number) as unique identifier
- On next import, skips already-imported invoices

### 📊 Monthly Breakdown:
- Groups all invoices by month (YYYY-MM)
- Sums sessions and revenue per month
- Shown in preview before import

### ✏️ Editing Results:
- Users can manually edit `actual_sessions` in the results table
- Clicking pencil icon → inline editor → save
- Updates `monthly_plans.actual_sessions` directly

---

## Data Model

```
Latido Excel File
    ↓
Parsed SessionImportRow[]
    ├─ date: "2026-01-15"
    ├─ therapy_type: "__price:250.00"  (temporary price marker)
    ├─ sessions: 1
    ├─ revenue: 250.00
    └─ invoice_number: "INV-2026-001"

    ↓ (processLatidoSessions)

monthly_plans table (Supabase)
    ├─ user_id
    ├─ therapy_type_id  ← matched from price
    ├─ month: "2026-01"
    ├─ planned_sessions: 5   (user planned)
    └─ actual_sessions: 7    ← IMPORTED from Latido

    ↓ (MergedResultsTable)

Results Table (UI)
    ├─ Therapieart: Psychiatrische Erstordination
    ├─ Geplant: 5
    ├─ Tatsächlich: 7
    ├─ Abweichung: +2 (40%)
    └─ Erreichung: 140%
```

---

## File References

| Step | Component | File |
|------|-----------|------|
| 1. Upload | UI Form | `components/dashboard/latido-import-form.tsx` |
| 2. Parse | Server Action | `lib/actions/latido-import.ts::parseLatidoExcel()` |
| 3. Match & Process | Server Action | `lib/actions/latido-import.ts::processLatidoSessions()` |
| 4. Display | React Component | `components/dashboard/merged-results-table.tsx` |
| 5. Database | Supabase | `monthly_plans` table, `imported_invoices` table |
