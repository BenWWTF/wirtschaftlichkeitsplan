# Phase 6 Implementation Plan
## Dashboard Analytics & Advanced Reporting Features

**Date:** November 12, 2025
**Scope:** Enhanced analytics and reporting capabilities

---

## 🎯 Goals

1. **Add Advanced KPI Cards** - New analytics metrics for better insights
2. **Implement Advanced Reporting** - More detailed financial and operational reports
3. **Enhance Data Visualization** - Better charts and comparisons
4. **Add Export/Sharing** - More export formats and options

---

## 📊 New KPI Cards to Add

### 1. **Occupancy Rate** 💼
- Planned sessions vs. actual sessions
- Percentage of planned sessions completed
- Trend indicator

### 2. **Revenue per Session** 💰
- Average revenue per session across all therapies
- Comparison to target/previous period
- Help identify pricing optimization

### 3. **Cost per Session** 💸
- Total variable costs / total sessions
- Helps with profitability analysis
- Track cost trends

### 4. **Profit Margin %** 📈
- Net profit / total revenue * 100
- Color coded (green/yellow/red)
- Shows financial health

### 5. **Sessions Completed** 🎯
- Total actual sessions in period
- Comparison to planned
- Growth trend

### 6. **Best Performing Therapy** ⭐
- Top therapy by revenue or margin
- Quick reference card
- Click to view details

### 7. **Revenue Forecast** 🔮
- Based on current trajectory
- Next month projection
- Confidence level

### 8. **Break-Even Distance** 📍
- How far from break-even (€ or sessions)
- Visual progress indicator
- Days/weeks to break-even

---

## 📋 Advanced Reporting Features

### 1. **Therapy Performance Report**
- Revenue by therapy type
- Occupancy rate by therapy
- Profitability ranking
- Growth trends

### 2. **Financial Summary Report**
- Monthly revenue trends (12-month view)
- Expense breakdown
- Profit/loss progression
- YTD metrics

### 3. **Operational Report**
- Session capacity utilization
- Planned vs. actual comparison
- Variance analysis
- Performance deviations

### 4. **Forecast & Goals Report**
- Next 3 months projection
- Goal tracking
- Variance from forecast
- Recommendations

---

## 🏗️ Implementation Structure

### New Files to Create
```
lib/actions/
  └── analytics.ts         # Advanced KPI calculations

lib/utils/
  └── kpi-helpers.ts      # KPI calculation utilities

components/dashboard/
  ├── kpi-card.tsx        # Reusable KPI card component
  ├── occupancy-card.tsx  # Occupancy KPI
  ├── cost-analysis.tsx   # Cost per session analysis
  ├── forecast-card.tsx   # Revenue forecast
  ├── therapy-performance.tsx  # Therapy comparison
  └── analytics-dashboard.tsx  # Main analytics view

components/reports/
  ├── therapy-report.tsx
  ├── financial-report.tsx
  ├── operational-report.tsx
  ├── forecast-report.tsx
  └── report-exporter.tsx
```

---

## 📈 New Calculations Needed

### KPI Formulas

1. **Occupancy Rate** = (Actual Sessions / Planned Sessions) × 100
2. **Revenue per Session** = Total Revenue / Total Sessions
3. **Cost per Session** = Total Variable Costs / Total Sessions
4. **Profit Margin %** = (Net Income / Total Revenue) × 100
5. **Revenue Forecast** = Last 3 months avg × growth factor
6. **Break-Even Distance** = Fixed Costs / Contribution Margin per Session
7. **Best Therapy** = MAX(Revenue or Margin by therapy)
8. **Cost Trend** = (Current Cost - Previous Cost) / Previous Cost × 100

---

## 🎨 UI Components

### Enhanced Dashboard Layout
```
┌─────────────────────────────────────────┐
│  Dashboard Analytics                     │
├─────────────────────────────────────────┤
│ [Gesamtumsatz] [Gewinn] [Marge] [Kosten]│
├─────────────────────────────────────────┤
│ [Auslastung] [Rev/Sitzung] [Best Therapy]│
├─────────────────────────────────────────┤
│ [Prognose] [Deckungsbeitrag] [Trend]    │
├─────────────────────────────────────────┤
│ Charts & Visualization                   │
├─────────────────────────────────────────┤
│ Advanced Reports                         │
└─────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

- [ ] Create analytics.ts with KPI functions
- [ ] Create kpi-helpers.ts with calculation utilities
- [ ] Build reusable KPI card component
- [ ] Implement 8 new KPI cards
- [ ] Create advanced reporting dashboard
- [ ] Add therapy performance report
- [ ] Add financial summary report
- [ ] Add operational report
- [ ] Add forecast report
- [ ] Enhance data export functionality
- [ ] Add report scheduling (optional)
- [ ] Test all features
- [ ] Commit to git

---

## 🚀 Priority Order

**Must Have (Phase 6.1):**
1. Occupancy Rate card
2. Revenue per Session card
3. Profit Margin card
4. Therapy Performance Report
5. Enhanced exports

**Nice to Have (Phase 6.2):**
1. Cost per Session
2. Revenue Forecast
3. Best Performing Therapy
4. Break-Even Distance
5. Advanced Forecasting

---

## 📊 Expected Improvements

- **User Insights:** 3x more metrics available
- **Data Depth:** Detailed breakdowns by therapy type
- **Forecasting:** Ability to project future performance
- **Decision Making:** Data-driven insights for optimization
- **Reporting:** Professional export formats

---

**Status:** Ready for Implementation
**Est. Time:** 60-90 minutes
**Complexity:** Medium

