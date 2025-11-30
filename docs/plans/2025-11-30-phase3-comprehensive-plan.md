# Phase 3: Comprehensive Feature Implementation Plan
## Mobile Optimization, Export Features, Analytics, Search/Filtering & Accessibility

**Status**: Ready for Review & Execution
**Date**: 2025-11-30
**Total Tasks**: 40 (8 per phase)

---

## PHASE 3.1: MOBILE OPTIMIZATION

### Overview
Enhance mobile experience with touch optimization, gesture support, improved layout, and landscape handling.

### 8 Tasks

#### Task 1: Implement Touch Target Optimization
- **Goal**: Ensure all interactive elements meet 44x44px minimum touch target
- **Files to modify**:
  - `components/ui/button.tsx` - update size classes
  - `components/dashboard/expense-list.tsx` - touch padding on cards
  - `components/dashboard/therapy-list.tsx` - touch padding on items
  - `components/dashboard/mobile-bottom-nav.tsx` - tab sizing
- **Implementation**:
  - Add `min-h-[44px] min-w-[44px]` to all button/link/interactive elements
  - Create `@/components/ui/touch-target.tsx` utility component
  - Audit all clickable areas in dashboard pages
- **Verification**: Manual testing on iPhone/Android, dev tools mobile emulation

#### Task 2: Add Swipe Gesture Support
- **Goal**: Enable swipe navigation for mobile (left/right to navigate pages)
- **New files**:
  - `@/hooks/useSwipe.ts` - gesture hook using pointer events
  - `@/components/dashboard/swipe-navigator.tsx` - wrapper component
- **Implementation**:
  - Create custom swipe hook (threshold: 50px, velocity checking)
  - Navigate between related pages on swipe
  - Integrate with RelatedPages component
  - Add visual feedback (haptic feedback on iOS if available)
- **Verification**: Test on real devices, iPhone/Android physical testing

#### Task 3: Optimize Bottom Navigation Height
- **Goal**: Reduce bottom nav from 80px to 64px (standard mobile tab height)
- **Files to modify**:
  - `components/dashboard/mobile-bottom-nav.tsx`
  - `app/dashboard/layout.tsx` (adjust pb-20 spacing)
- **Implementation**:
  - Reduce icon size from 24px to 20px
  - Reduce padding from 3 to 2.5
  - Keep safe-area-inset-bottom intact
  - Adjust main content pb-20 to pb-16
- **Testing**: Verify safe area still works on notched devices

#### Task 4: Implement Landscape Orientation Handling
- **Goal**: Support landscape mode with optimized layout
- **New component**:
  - `@/components/dashboard/landscape-nav.tsx` - horizontal sidebar
- **Implementation**:
  - Detect landscape orientation with media query `orientation: landscape`
  - Collapse desktop sidebar to horizontal nav on landscape mobile
  - Horizontal nav: 64px height, icons only (tooltips on hover)
  - Adjust main content margin: `md:ml-64` → `landscape:ml-0 landscape:mt-16`
- **CSS**:
  ```css
  @media (orientation: landscape) and (max-width: 768px) {
    nav { height: 64px; width: 100%; flex-direction: row; }
    main { margin-left: 0; margin-top: 64px; }
  }
  ```

#### Task 5: Create Mobile Table/Card Components
- **Goal**: Replace tables with optimized card layout for mobile
- **New components**:
  - `@/components/dashboard/mobile-expense-card.tsx`
  - `@/components/dashboard/mobile-therapy-card.tsx`
  - `@/components/dashboard/mobile-result-card.tsx`
- **Implementation**:
  - Card-based layout: `flex flex-col gap-3 p-4 border rounded-lg`
  - Show key data (amount, date, status) prominently
  - Secondary info in collapsed section (click to expand)
  - Swipe actions for common operations (delete, edit)
- **Data density**: Balance readability vs. scrolling

#### Task 6: Optimize Form Inputs for Mobile
- **Goal**: Improve form usability on mobile devices
- **Files to modify**:
  - `components/dashboard/settings-form.tsx`
  - `components/dashboard/expense-form.tsx`
  - `components/dashboard/therapy-form.tsx`
- **Implementation**:
  - Increase input height: `h-10` → `h-12` on mobile
  - Full-width inputs on mobile (`w-full` below md)
  - Stack labels above inputs (not beside)
  - Larger select dropdown targets
  - Mobile-appropriate keyboard types (`inputMode="numeric"` for amounts)
- **Testing**: iOS keyboard behavior, Android keyboard appearance

#### Task 7: Add Responsive Image & Chart Handling
- **Goal**: Ensure charts and images display correctly on mobile
- **Files to modify**:
  - `components/dashboard/analytics-dashboard.tsx`
  - `components/dashboard/break-even-export.tsx`
  - All visualization components
- **Implementation**:
  - Charts: use `flexSize` for responsive sizing
  - Images: max-width 100%, height auto
  - Reduce chart legend size on mobile
  - Stack chart metrics vertically on mobile
  - Add mobile-friendly tooltips (touch-friendly)

#### Task 8: Test & Verify Mobile Experience
- **Goal**: Comprehensive mobile testing across devices
- **Test matrix**:
  - Devices: iPhone 12/14/15, Samsung Galaxy S20/S23
  - Browsers: Safari iOS, Chrome Android, Samsung Internet
  - Orientations: Portrait, landscape, rotation changes
  - Connectivity: 4G, 3G (throttled), WiFi
  - Scenarios: Form submission, filtering, navigation, exports
- **Performance targets**:
  - First Contentful Paint: < 2s on 4G
  - Largest Contentful Paint: < 3.5s on 4G
  - Cumulative Layout Shift: < 0.1
- **Deliverable**: Mobile testing report with fixes for any issues found

---

## PHASE 3.2: EXPORT FEATURES (PDF/EXCEL)

### Overview
Expand export capabilities with native PDF export, enhanced Excel formatting, and scheduled exports.

### 8 Tasks

#### Task 1: Implement Native PDF Export
- **Goal**: Add jsPDF-based PDF export for all reports
- **Dependencies**: Install `jspdf` and `html2canvas`
  ```bash
  npm install jspdf html2canvas
  ```
- **New files**:
  - `@/lib/utils/pdf-export.ts` - PDF generation utilities
  - `@/components/dashboard/pdf-export-button.tsx` - export UI
- **Implementation**:
  - Create `generatePDF(htmlElement, filename)` function
  - Support for: break-even reports, monthly planning, expense summaries
  - Styling: preserve Tailwind classes, handle dark mode
  - Metadata: add title, creation date, user info
  - Quality: A4 size, 300 DPI equivalent
- **Export formats**:
  - Break-even analysis PDF
  - Monthly planning PDF
  - Therapy performance PDF
  - Expense report PDF

#### Task 2: Enhance Excel Export Formatting
- **Goal**: Improve existing XLSX exports with advanced formatting
- **Files to modify**:
  - `@/lib/utils/excel-export.ts` (create if doesn't exist)
  - All export action files
- **Implementation**:
  - Column auto-sizing based on content
  - Number formatting: currency (€), percentages (%)
  - Date formatting: DD.MM.YYYY
  - Conditional formatting: color-code positive/negative values
  - Freeze first row (headers)
  - Add summary sheet with KPIs
  - Worksheet tabs for different sections (monthly, therapy, expenses)
  - Print setup: fit to page, margins, page breaks
- **Libraries**: Use `exceljs` for advanced formatting
  ```bash
  npm install exceljs
  ```

#### Task 3: Add CSV Export with Custom Delimiter
- **Goal**: Create flexible CSV export with configurable options
- **New files**:
  - `@/lib/utils/csv-export.ts` - CSV generation
  - `@/components/dashboard/csv-export-dialog.tsx` - CSV options UI
- **Implementation**:
  - Delimiter options: comma, semicolon, tab
  - Encoding: UTF-8, UTF-8 with BOM, ISO-8859-1
  - Include headers: yes/no
  - Date format selection: DD.MM.YYYY, YYYY-MM-DD, etc.
  - Number format: comma or period as decimal separator
  - Quote style: double-quote, single-quote, none
- **Testing**: Import exported CSV back into app, validate data integrity

#### Task 4: Create Multi-Format Batch Export
- **Goal**: Export multiple reports in one operation (ZIP archive)
- **New files**:
  - `@/lib/utils/batch-export.ts` - orchestrate multiple exports
  - `@/components/dashboard/batch-export-dialog.tsx` - selection UI
- **Dependencies**: Use existing `zip-utils` or install `jszip`
- **Implementation**:
  - Checkbox selection: which reports to include
  - Format selection per report (PDF, XLSX, CSV)
  - Organization: folder structure in ZIP
    ```
    /exports/
      /monthly/
        planning-nov-2025.xlsx
        results-nov-2025.pdf
      /reports/
        break-even.pdf
        expense-summary.csv
      /therapies/
        therapy-performance.xlsx
    ```
  - Metadata: README.txt with export date, version
  - Compression: ZIP file download with timestamp filename

#### Task 5: Implement Scheduled Exports
- **Goal**: Set up automatic exports on a schedule
- **New files**:
  - `@/lib/actions/export-schedule.ts` - server action for scheduling
  - `@/components/dashboard/export-scheduler.tsx` - schedule UI
  - Database schema: create `export_schedules` table
- **Implementation**:
  - UI to set schedule: daily, weekly (day selection), monthly (date)
  - Time selection: 08:00 - 20:00
  - Report selection: which reports to export
  - Storage: save to cloud bucket or local storage
  - Email delivery option (if auth available)
  - History: track last exports, next scheduled export
- **Database migration**:
  ```sql
  CREATE TABLE export_schedules (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    schedule_type TEXT (daily|weekly|monthly),
    schedule_time TIME,
    schedule_day INT (for weekly: 0-6),
    selected_reports JSONB,
    export_format TEXT (pdf|xlsx|csv),
    last_exported_at TIMESTAMP,
    next_export_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```

#### Task 6: Add Email Delivery for Exports
- **Goal**: Send exported files via email automatically
- **New files**:
  - `@/lib/actions/email-export.ts` - email sending logic
  - `@/components/dashboard/email-export-form.tsx` - email UI
- **Dependencies**: Use existing email service (Supabase functions or external)
- **Implementation**:
  - Email template with company branding
  - Attachment: ZIP file or multiple files
  - Subject: "Monthly Export - November 2025"
  - Body: summary of what's included, date range, link to web version
  - Recipient validation: allow multiple emails
  - Scheduling: send immediately or at scheduled time
- **Template example**:
  ```html
  Hallo [PracticeName],

  Anbei finden Sie Ihre monatlichen Berichte für November 2025.

  Enthaltene Berichte:
  - Monatliche Planung
  - Break-Even-Analyse
  - Ausgabenübersicht

  Diese Datei wird nach 14 Tagen gelöscht. Bitte speichern Sie sie lokal.

  Beste Grüße,
  Wirtschaftlichkeitsplan
  ```

#### Task 7: Create Export History & Management
- **Goal**: Track all exports, allow retrieval of past exports
- **New files**:
  - `@/components/dashboard/export-history.tsx` - history view
  - `@/lib/actions/export-history.ts` - server actions
  - Database schema: create `export_history` table
- **Implementation**:
  - Table: export date, type, format, file size, status
  - Actions: download, delete, resend (email)
  - Filters: date range, type, format
  - Pagination: 10/25/50 per page
  - Retention: auto-delete after 30 days
  - Search: by date or description
- **Database migration**:
  ```sql
  CREATE TABLE export_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    export_type TEXT,
    export_format TEXT,
    file_name TEXT,
    file_size INT,
    file_path TEXT,
    status TEXT (completed|failed|pending),
    created_at TIMESTAMP,
    expires_at TIMESTAMP
  );
  ```

#### Task 8: Test & Validate All Export Formats
- **Goal**: Comprehensive testing of all export features
- **Test cases**:
  - PDF: layout preservation, image quality, page breaks
  - XLSX: formula integrity, formatting (colors, fonts), large datasets
  - CSV: encoding, delimiter handling, special characters (Umlaute)
  - ZIP: file structure, compression ratio, file count limits
  - Email: delivery, attachments, template rendering
  - Scheduled exports: timing accuracy, failure recovery
  - File size limits: test with large datasets (5000+ rows)
- **Edge cases**:
  - Empty datasets
  - Very large numbers (formatting)
  - Special characters (€, %, ä/ö/ü)
  - Decimal precision for currency
  - Date format consistency
- **Deliverable**: Export testing checklist with all formats verified

---

## PHASE 3.3: ANALYTICS DASHBOARD ENHANCEMENT

### Overview
Expand analytics with real-time updates, custom date ranges, alerts, comparisons, and cohort analysis.

### 8 Tasks

#### Task 1: Implement Real-Time Data Updates
- **Goal**: Add live metric updates without page refresh
- **New files**:
  - `@/hooks/useRealtimeMetrics.ts` - custom hook for live data
  - `@/components/dashboard/analytics-refresh-indicator.tsx` - status indicator
- **Dependencies**: Supabase Realtime subscriptions
- **Implementation**:
  - Subscribe to changes in `monthly_metrics`, `expenses`, `therapies`
  - Auto-refresh every 30 seconds (configurable)
  - Manual refresh button with loading state
  - Last updated timestamp
  - Connection status indicator (connected/disconnected)
  - Graceful fallback if realtime unavailable
- **Code structure**:
  ```typescript
  const useRealtimeMetrics = () => {
    const [metrics, setMetrics] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    useEffect(() => {
      const channel = supabase
        .channel('metrics')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          refetchMetrics()
        })
        .subscribe()

      return () => supabase.removeChannel(channel)
    }, [])
  }
  ```

#### Task 2: Add Custom Date Range Selection
- **Goal**: Allow users to select any date range for analysis
- **New component**:
  - `@/components/dashboard/date-range-picker.tsx` - date selection UI
- **Implementation**:
  - Calendar picker for start/end dates
  - Presets: This month, Last month, Last 3 months, Last year, Custom
  - Year/month selectors for quick navigation
  - Validate: start date ≤ end date
  - Apply button to update dashboard
  - URL query params: `?startDate=2025-01-01&endDate=2025-11-30`
- **Features**:
  - Save frequently used ranges
  - Compare ranges: "Nov 2024 vs Nov 2025"
  - Mobile-friendly calendar (date picker library like `react-day-picker`)

#### Task 3: Implement KPI Alert Thresholds
- **Goal**: Set targets and get alerts when KPIs fall below/above thresholds
- **New files**:
  - `@/components/dashboard/kpi-alert-settings.tsx` - threshold UI
  - `@/lib/actions/kpi-alerts.ts` - server actions
  - Database schema: create `kpi_alerts` table
- **Implementation**:
  - Set thresholds for key metrics:
    - Occupancy rate (minimum %)
    - Profit margin (minimum %)
    - Revenue per session (minimum €)
    - Cost ratio (maximum %)
  - Alert types: low, high, critical
  - Notification channels: in-app badge, email (optional)
  - Visual indicator: red/yellow/green on metric cards
  - History: track when alerts were triggered
- **Database schema**:
  ```sql
  CREATE TABLE kpi_alerts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    metric_name TEXT,
    threshold_value NUMERIC,
    alert_type TEXT (below|above),
    notification_channels JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMP
  );
  ```

#### Task 4: Add Year-over-Year Comparison
- **Goal**: Compare current year metrics with previous year
- **New component**:
  - `@/components/dashboard/yoy-comparison.tsx` - YoY view
- **Implementation**:
  - Side-by-side metric comparison: Nov 2024 vs Nov 2025
  - Percentage change indicator: ↑ +15%, ↓ -5%
  - Color coding: green (improvement), red (decline), grey (neutral)
  - Charts: line/bar chart showing 12-month trends both years
  - Therapy breakdown: YoY for each therapy type
  - Cumulative: YTD comparison (Jan-Nov current year vs last year)
- **Data structure**:
  ```typescript
  YoYComparison {
    metric: string
    currentYear: number
    previousYear: number
    changePercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  ```

#### Task 5: Implement Cohort Analysis
- **Goal**: Analyze metrics by therapy type, month cohorts, and segments
- **New component**:
  - `@/components/dashboard/cohort-analysis.tsx` - cohort view
- **Implementation**:
  - Cohort matrix: rows = therapy types, columns = months
  - Cell values: revenue, sessions, margin, occupancy
  - Heat map coloring: darker = better performance
  - Hover tooltip: detailed breakdown
  - Filtering: by therapy, by metric
  - Time period: last 12 months, 24 months, custom range
- **Table structure**:
  ```
  Therapietyp | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Okt | Nov | Dez
  Massage     | 45% | 48% | 52% | 50% | 55% | 60% | 62% | 65% | 63% | 66% | 68% | -
  Physiother. | 38% | 40% | 42% | 45% | 46% | 48% | 50% | 52% | 54% | 56% | 58% | -
  ```

#### Task 6: Add Forecasting & Predictions
- **Goal**: Predict future metrics based on trends
- **New component**:
  - `@/components/dashboard/forecast-prediction.tsx` - forecast view
- **Implementation**:
  - Linear regression forecast for next 3/6/12 months
  - Confidence interval (95% CI)
  - Comparison with targets (if set)
  - Charts: actual + forecast line
  - Highlight breakeven point
  - Export forecast data
  - Assumptions: based on last 6 months data
- **Calculation**:
  ```typescript
  // Simple linear regression
  const forecast = (data, periods) => {
    const n = data.length
    const slope = /* calculate */
    const intercept = /* calculate */
    return Array(periods).fill(0).map((_, i) =>
      slope * (n + i) + intercept
    )
  }
  ```

#### Task 7: Create Custom Dashboard Widgets
- **Goal**: Allow users to customize which metrics are displayed
- **New files**:
  - `@/components/dashboard/dashboard-customizer.tsx` - customization UI
  - `@/lib/actions/dashboard-layout.ts` - save preferences
  - Database schema: create `dashboard_preferences` table
- **Implementation**:
  - Drag-and-drop widget ordering
  - Show/hide widgets: toggle visibility
  - Widget sizing: small (1 col), medium (2 col), large (3 col)
  - Save layout per user
  - Preset layouts: "Executive View", "Detailed Analytics", "Mobile Optimized"
  - Reset to default option
- **Database schema**:
  ```sql
  CREATE TABLE dashboard_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    layout_name TEXT,
    widgets JSONB,
    is_default BOOLEAN,
    created_at TIMESTAMP
  );
  ```

#### Task 8: Test & Validate Analytics Enhancements
- **Goal**: Comprehensive testing of all analytics features
- **Test scenarios**:
  - Real-time updates: verify data refreshes within 30 seconds
  - Date ranges: test leap years, month boundaries, year transitions
  - Thresholds: trigger alerts manually, verify notifications
  - YoY comparison: test with partial data (Nov only)
  - Cohort analysis: test with missing therapy data, empty months
  - Forecasting: validate regression accuracy with known datasets
  - Customization: save/load layouts, test persistence
- **Performance targets**:
  - Dashboard load: < 2s
  - Real-time update: < 1s
  - Chart rendering: < 1.5s
- **Data validation**:
  - Check calculations for accuracy
  - Verify sorting and filtering
  - Test with edge case data (zeros, negatives, very large numbers)
- **Deliverable**: Analytics testing report with all features verified

---

## PHASE 3.4: SEARCH & FILTERING ENHANCEMENT

### Overview
Add advanced search, saved filters, server-side filtering, and full-text search capabilities.

### 8 Tasks

#### Task 1: Implement Full-Text Search
- **Goal**: Add ability to search across expenses, therapies, documents
- **New component**:
  - `@/components/dashboard/global-search.tsx` - search UI
  - `@/lib/actions/global-search.ts` - search server action
- **Implementation**:
  - Search box with real-time suggestions (debounced)
  - Multi-field search: therapy name, expense category, description
  - Search bills by filename, OCR text
  - Results grouped by type (expenses, therapies, documents)
  - Highlighting: matched terms highlighted in results
  - Keyboard shortcut: Cmd+K / Ctrl+K to focus search
  - Search history: recent searches saved (last 10)
- **Database**: Create full-text search index on relevant columns
  ```sql
  CREATE INDEX idx_expenses_search ON expenses USING GIN(
    to_tsvector('german', description || ' ' || category)
  );
  ```
- **API endpoint**:
  ```typescript
  async function searchGlobal(query: string, userId: string) {
    return supabase
      .from('expenses')
      .select('*')
      .textSearch('description', query)
      .eq('user_id', userId)
  }
  ```

#### Task 2: Add Advanced Filtering UI
- **Goal**: Create sophisticated filter panel for complex queries
- **New component**:
  - `@/components/dashboard/advanced-filter.tsx` - filter builder UI
  - `@/lib/utils/filter-builder.ts` - filter logic
- **Implementation**:
  - Multi-criteria filters: AND/OR logic
  - Filter types:
    - **Expense**: Category, amount range, date range, recurring, paid status
    - **Therapy**: Type, price range, occupancy range, performance tier
    - **Results**: Planned vs actual variance, date range, therapy type
  - Visual builder: add/remove filter rows
  - Save filters: "My Regular Expenses", "High-Income Therapies"
  - Apply/clear buttons
  - Active filter count badge
  - Mobile: collapsible filter panel
- **Filter structure**:
  ```typescript
  type FilterCriteria = {
    field: string
    operator: 'eq' | 'gt' | 'lt' | 'between' | 'contains'
    value: any
    logic: 'AND' | 'OR'
  }
  ```

#### Task 3: Implement Server-Side Filtering
- **Goal**: Move filtering logic to backend for performance and security
- **New files**:
  - `@/lib/actions/filtered-expenses.ts` - server-side filtering
  - `@/lib/actions/filtered-therapies.ts` - server-side filtering
- **Implementation**:
  - Build Supabase query from filter criteria
  - Server-side pagination: cursor-based (better for large datasets)
  - Sorting: by any column, ascending/descending
  - Security: validate filter criteria on server
  - Query optimization: only select needed columns
  - Streaming: return results as they load (for large datasets)
- **Query example**:
  ```typescript
  const buildFilterQuery = (filters: FilterCriteria[]) => {
    let query = supabase.from('expenses').select('*')

    filters.forEach(f => {
      if (f.operator === 'between') {
        query = query.gte(f.field, f.value[0]).lte(f.field, f.value[1])
      } else if (f.operator === 'contains') {
        query = query.ilike(f.field, `%${f.value}%`)
      } else {
        query = query.filter(f.field, f.operator, f.value)
      }
    })

    return query
  }
  ```

#### Task 4: Create Saved Filters & Collections
- **Goal**: Allow users to save and reuse filter combinations
- **New files**:
  - `@/components/dashboard/saved-filters.tsx` - saved filters UI
  - `@/lib/actions/saved-filters.ts` - server actions
  - Database schema: create `saved_filters` table
- **Implementation**:
  - Save current filters with a name
  - Edit/delete saved filters
  - Quick apply buttons
  - Organize into collections: "Monthly Review", "Tax Preparation"
  - Share filters (optional): allow sharing filter set
  - Import/export: JSON format for backup
  - Default filter: set one as default for page
- **Database schema**:
  ```sql
  CREATE TABLE saved_filters (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    name TEXT NOT NULL,
    collection TEXT,
    filter_criteria JSONB NOT NULL,
    page_type TEXT (expenses|therapies|results),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(user_id, name)
  );
  ```

#### Task 5: Add Date Range Quick Filters
- **Goal**: Quick access to common date ranges with one click
- **New component**:
  - `@/components/dashboard/quick-date-filters.tsx` - quick filter buttons
- **Implementation**:
  - Preset buttons: Today, This Week, This Month, Last Month, This Year, YTD
  - Dynamic calculation: adjust for current date
  - Custom range: click "Custom" to open date picker
  - Mobile: horizontal scroll if needed
  - Active state: highlight selected range
  - Keyboard shortcuts: 1=Today, 2=Week, 3=Month, etc.
- **Code structure**:
  ```typescript
  const quickFilters = [
    { label: 'Today', range: [today, today] },
    { label: 'This Week', range: [weekStart, today] },
    { label: 'This Month', range: [monthStart, today] },
    { label: 'Last Month', range: [lastMonthStart, lastMonthEnd] },
    { label: 'Custom', showPicker: true }
  ]
  ```

#### Task 6: Implement Filter Suggestions & Autocomplete
- **Goal**: Smart filter suggestions based on data and usage patterns
- **Implementation**:
  - Suggest filter values as user types: "Massage", "Physiotherapy"
  - Recently used filters: "Show recently filtered therapies"
  - Popular filters: show filters other users commonly use
  - Smart suggestions: "Filter by high-income months" based on patterns
  - Fuzzy matching: typo tolerance "Massge" → "Massage"
- **Performance**:
  - Cache common values (therapy types, categories)
  - Debounce suggestions (300ms)
  - Limit suggestions to 10 results
  - Prefetch top 100 values for each filterable field

#### Task 7: Add Filter Analytics
- **Goal**: Track and optimize filter usage
- **New component**:
  - `@/components/dashboard/filter-analytics.tsx` - usage analytics
- **Implementation**:
  - Log each filter application (user, filter, date)
  - Report: most used filters, most used combinations
  - Performance: identify slow filters
  - Suggestions: recommend filters based on usage
  - Storage: keep last 100 filters per user
- **Database schema**:
  ```sql
  CREATE TABLE filter_analytics (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    filter_criteria JSONB,
    results_count INT,
    execution_time_ms INT,
    created_at TIMESTAMP
  );
  ```

#### Task 8: Test & Validate Search & Filtering
- **Goal**: Comprehensive testing of all search and filter features
- **Test scenarios**:
  - Full-text search: test with various query terms, special characters, German umlauts
  - Advanced filters: test AND/OR combinations, complex logic
  - Server-side filtering: verify pagination, sorting, performance
  - Saved filters: test save/load/edit/delete, persistence across sessions
  - Date filters: test edge cases (leap years, month boundaries)
  - Autocomplete: test fuzzy matching, performance with large datasets
  - Filter performance: load time with 5000+ expenses filtered
- **Performance targets**:
  - Search response: < 500ms
  - Filter apply: < 1s
  - Autocomplete: < 200ms
- **Data validation**:
  - Verify filter accuracy (correct rows returned)
  - Test with empty results
  - Test with special characters in search
- **Deliverable**: Search/filtering testing report with all features verified

---

## PHASE 3.5: ACCESSIBILITY AUDIT & FIXES

### Overview
Comprehensive accessibility improvements to meet WCAG 2.1 AA standards.

### 8 Tasks

#### Task 1: Add Missing ARIA Labels & Descriptions
- **Goal**: Complete ARIA attribute coverage for all interactive elements
- **Files to audit**:
  - All components with icons, buttons, dropdowns
  - Form fields without labels
  - Status indicators
- **Implementation**:
  - Add `aria-label` to all icon-only buttons:
    ```tsx
    <button aria-label="Filter expenses">
      <FilterIcon />
    </button>
    ```
  - Add `aria-describedby` to form fields with hints:
    ```tsx
    <input aria-describedby="password-hint" />
    <span id="password-hint">Min 8 characters</span>
    ```
  - Add `aria-current="page"` to active nav links (already done, verify)
  - Add `aria-expanded` to collapsible sections:
    ```tsx
    <button aria-expanded={isOpen} aria-controls="menu-id">
      Menu
    </button>
    <div id="menu-id">{children}</div>
    ```
  - Add `role="alert"` for error messages and alerts
- **Audit tool**: Use axe DevTools browser extension to find missing labels

#### Task 2: Implement Visible Focus Indicators
- **Goal**: Ensure keyboard users can see where they are navigating
- **CSS changes**:
  - Add `:focus-visible` styles to all focusable elements
  - Focus ring: 2-3px solid color (not default browser outline)
  - Contrast: ensure focus ring contrasts with background
  - Consistency: same style across all elements
- **Implementation**:
  ```css
  button:focus-visible,
  input:focus-visible,
  a:focus-visible {
    outline: 3px solid #0066cc;
    outline-offset: 2px;
  }
  ```
- **Apply to**:
  - All buttons, links, inputs, selects, textareas
  - Custom components (tabs, dialogs, dropdowns)
  - Navigation elements
  - Check boxes and radio buttons

#### Task 3: Add Live Regions for Dynamic Content
- **Goal**: Announce dynamic updates to screen reader users
- **Implementation**:
  - Add `aria-live="polite"` to notification areas
  - Add `aria-live="assertive"` for critical alerts
  - Add `role="status"` for status messages
  - Add `role="alert"` for urgent alerts
- **Components to update**:
  ```tsx
  // Filter results update
  <div aria-live="polite" aria-label="Filter results">
    Showing {count} results
  </div>

  // Loading state
  <div aria-live="assertive" aria-busy={isLoading}>
    {isLoading ? 'Loading...' : 'Ready'}
  </div>

  // Error message
  <div role="alert" className="error">
    Error: Failed to save settings
  </div>
  ```

#### Task 4: Improve Form Accessibility
- **Goal**: Ensure all forms are fully accessible
- **Implementation**:
  - Every input must have associated `<label>`
  - Use `htmlFor` to link labels to inputs
  - Mark required fields: `aria-required="true"` or `required` attribute
  - Error messages linked with `aria-describedby`
  - Group related inputs with `<fieldset>` and `<legend>`
  - Keyboard navigation: Tab order should be logical
  - Error communication: announce errors with role="alert"
- **Example**:
  ```tsx
  <div>
    <label htmlFor="expense-amount">Amount *</label>
    <input
      id="expense-amount"
      type="number"
      required
      aria-required="true"
      aria-describedby="amount-error"
    />
    {error && (
      <span id="amount-error" role="alert" className="error">
        {error}
      </span>
    )}
  </div>
  ```

#### Task 5: Fix Color Contrast Issues
- **Goal**: Ensure all text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- **Tool**: Use WebAIM Contrast Checker or online tools
- **Audit process**:
  - Test dark mode colors
  - Test light mode colors
  - Test hover/active states
  - Test disabled states
- **Common issues to fix**:
  - Placeholder text: currently too light in dark mode
  - Inactive tab text: may not meet ratio
  - Borders: if used for information (add text too)
  - Status colors: don't rely on color alone (add symbols)
- **Changes needed**:
  - Placeholder: `placeholder:text-neutral-400` → `dark:placeholder:text-neutral-300`
  - Secondary text: review all `text-neutral-500/600` in dark mode
  - Links: ensure sufficient contrast from surrounding text
  - Buttons: verify text contrast on all button colors

#### Task 6: Add Keyboard Navigation & Shortcuts
- **Goal**: Ensure complete keyboard accessibility
- **Implementation**:
  - Tab through all interactive elements in logical order
  - Escape key closes dialogs/dropdowns (already done)
  - Enter key submits forms
  - Space bar activates buttons
  - Arrow keys navigate lists/dropdowns
  - Existing shortcuts: Alt+H, Alt+T, Alt+P, Alt+S, Alt+R - document these
  - Add new shortcuts: Cmd+K / Ctrl+K for search, Cmd+/ for help
- **Test**:
  - Navigate entire app with keyboard only (no mouse)
  - Check focus order makes sense (top-to-bottom, left-to-right)
  - No focus traps (can always Tab away)

#### Task 7: Create Accessibility Statement & Help
- **Goal**: Document accessibility features and provide support
- **New files**:
  - `pages/accessibility.tsx` - accessibility statement
  - `@/components/dashboard/keyboard-shortcuts.tsx` - shortcuts reference
- **Content**:
  - WCAG 2.1 AA compliance statement
  - List of keyboard shortcuts
  - Screen reader compatibility note
  - Contact info for accessibility issues
  - Feature descriptions for screen reader users
- **Page structure**:
  ```markdown
  # Accessibility Statement

  ## Compliance
  This app aims for WCAG 2.1 AA compliance...

  ## Keyboard Shortcuts
  - Cmd+K: Open search
  - Alt+H: Home
  - Alt+T: Therapies
  - Alt+P: Planning
  - Alt+S: Tax forecast
  - Alt+R: Reports
  - Escape: Close menus

  ## Screen Readers
  Tested with: NVDA, JAWS, VoiceOver...

  ## Known Issues
  None currently.

  ## Feedback
  Please report accessibility issues to...
  ```

#### Task 8: Comprehensive Accessibility Testing
- **Goal**: Validate WCAG 2.1 AA compliance across entire app
- **Tools to use**:
  - axe DevTools (browser extension)
  - WAVE (WebAIM's tool)
  - Lighthouse (Chrome DevTools)
  - Manual testing with screen readers
- **Testing checklist**:
  ```
  ☐ Keyboard navigation: Can I use Tab/Shift+Tab to navigate?
  ☐ Focus visible: Can I see the current focus position?
  ☐ Forms accessible: All inputs have labels
  ☐ Color contrast: At least 4.5:1 ratio for text
  ☐ Alt text: All images have descriptive alt text
  ☐ ARIA complete: No missing labels or roles
  ☐ Semantic HTML: Proper heading hierarchy, landmarks
  ☐ Mobile accessibility: Works with mobile screen readers (TalkBack, VoiceOver)
  ☐ No flashing: No content flashes more than 3x/second
  ☐ Error handling: Errors are announced and recoverable
  ☐ Time limits: No content with <2 second time limits
  ☐ Links meaningful: Link text clearly describes destination
  ☐ Lists structured: Proper `<ul>`, `<ol>`, `<li>` markup
  ☐ Tables semantic: Proper `<table>`, `<th>`, `<td>` markup
  ```
- **Screen reader testing**:
  - Test with NVDA (Windows) - test 3 pages minimum
  - Test with JAWS (Windows) - quick smoke test
  - Test with VoiceOver (macOS/iOS) - test 3 pages minimum
  - Test with TalkBack (Android) - test critical flows
- **Mobile accessibility**:
  - iPhone + VoiceOver: test all pages
  - Android + TalkBack: test critical flows
  - Zoom testing: text at 200% zoom should be readable
- **Deliverable**: Accessibility testing report with:
  - WCAG 2.1 AA compliance checklist (✓/✗)
  - Issues found and severity
  - Fixes applied
  - Remaining known limitations
  - Recommendations for future improvements

---

## EXECUTION STRATEGY

### Sequential vs. Parallel Execution
- **Recommended sequence**:
  1. Phase 3.5 (Accessibility) first - foundational to good UX
  2. Phase 3.1 (Mobile) next - affects many users
  3. Phase 3.4 (Search/Filtering) - core functionality
  4. Phase 3.2 (Export) - value-add feature
  5. Phase 3.3 (Analytics) - advanced feature

- **Parallel opportunities**:
  - 3.1 & 3.5 can run in parallel (both improve UX)
  - 3.4 & 3.3 can run in parallel (independent features)
  - 3.2 runs best after 3.3 (uses analytics data)

### Development Approach
- **Task 1-7**: Code development + unit testing
- **Task 8**: Comprehensive testing + bug fixes
- **Each phase**: Create feature branch, PR review, merge to main

### Estimated Effort
- **Phase 3.1** (Mobile): 4-5 days
- **Phase 3.2** (Export): 3-4 days
- **Phase 3.3** (Analytics): 5-6 days
- **Phase 3.4** (Search/Filtering): 4-5 days
- **Phase 3.5** (Accessibility): 3-4 days
- **Total**: 19-24 days of development (2-3 weeks)

### Success Criteria
- All test cases passing (Task 8 of each phase)
- Zero critical accessibility violations
- Mobile performance metrics met
- Export formats validated
- Search performance targets met
- Analytics calculations accurate

---

## NEXT STEPS

1. Review this plan
2. Select execution order and team/priority
3. Create feature branches per phase
4. Begin with Phase execution
5. PR reviews and feedback integration
6. Merge to production with testing

**Ready to proceed?** Choose:
- Execute all phases sequentially
- Execute specific phases first
- Execute all phases in parallel with multiple developers
