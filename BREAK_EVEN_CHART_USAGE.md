# Break-Even Chart Component - Usage Guide

## Overview

The `BreakEvenChart` component provides interactive visualizations for break-even analysis in the financial planning dashboard. It includes three main chart types:

1. **Break-Even Point Visualization** - Shows revenue, costs, and profit lines
2. **Contribution Margin by Therapy Type** - Bar chart comparing profitability
3. **What-If Scenario Comparison** - Interactive scenario analysis

## Installation

The component has been created at:
```
/components/dashboard/break-even-chart.tsx
```

And integrated into:
```
/components/dashboard/break-even-calculator.tsx
```

## Dependencies

The component uses:
- **Recharts** (already installed: ^2.10.3)
- **lucide-react** for icons
- **@/lib/types** for TypeScript types
- **@/lib/utils** for formatEuro utility

## Component API

### Props

```typescript
interface BreakEvenChartProps {
  therapies: BreakEvenAnalysis[]
  fixedCosts: number
  onScenarioChange?: (
    scenario: 'pessimistic' | 'realistic' | 'optimistic',
    fixedCosts: number
  ) => void
}
```

#### `therapies`
Array of therapy types with their contribution margins.

**Type:** `BreakEvenAnalysis[]`

**Structure:**
```typescript
{
  therapy_type_id: string
  therapy_type_name: string
  price_per_session: number
  variable_cost_per_session: number
  contribution_margin: number
  contribution_margin_percent: number
}
```

#### `fixedCosts`
Monthly fixed costs for the practice.

**Type:** `number`

#### `onScenarioChange` (optional)
Callback function triggered when the user adjusts fixed costs in the what-if analysis.

**Type:** `(scenario: 'pessimistic' | 'realistic' | 'optimistic', fixedCosts: number) => void`

## Usage Examples

### Basic Usage

```tsx
import { BreakEvenChart } from '@/components/dashboard/break-even-chart'

const therapies = [
  {
    therapy_type_id: '1',
    therapy_type_name: 'Physiotherapy',
    price_per_session: 80,
    variable_cost_per_session: 20,
    contribution_margin: 60,
    contribution_margin_percent: 75
  },
  // ... more therapies
]

export function MyComponent() {
  return (
    <BreakEvenChart
      therapies={therapies}
      fixedCosts={2000}
    />
  )
}
```

### With Scenario Change Handler

```tsx
import { BreakEvenChart } from '@/components/dashboard/break-even-chart'
import { useState } from 'react'

export function MyComponent() {
  const [selectedScenario, setSelectedScenario] = useState('realistic')
  const [adjustedCosts, setAdjustedCosts] = useState(2000)

  const handleScenarioChange = (scenario, fixedCosts) => {
    console.log(`Scenario changed to: ${scenario}`)
    console.log(`Fixed costs adjusted to: ${fixedCosts}`)
    setSelectedScenario(scenario)
    setAdjustedCosts(fixedCosts)
  }

  return (
    <BreakEvenChart
      therapies={therapies}
      fixedCosts={adjustedCosts}
      onScenarioChange={handleScenarioChange}
    />
  )
}
```

### Integration in break-even-calculator.tsx

The component is already integrated in `break-even-calculator.tsx`:

```tsx
export function BreakEvenCalculator({
  therapies,
  initialFixedCosts = 2000
}: BreakEvenCalculatorProps) {
  const [showCharts, setShowCharts] = useState(true)
  const fixedCosts = form.watch('monthly_fixed_costs')

  return (
    <div className="space-y-6">
      {/* ... other content ... */}

      {/* Toggle button */}
      <button onClick={() => setShowCharts(!showCharts)}>
        {showCharts ? 'Verberge Diagramme' : 'Zeige Interaktive Diagramme'}
      </button>

      {/* Charts section */}
      {showCharts && (
        <BreakEvenChart therapies={therapies} fixedCosts={fixedCosts} />
      )}
    </div>
  )
}
```

## Features

### 1. Break-Even Point Visualization

**Chart Type:** Composed Chart (Line + Area)

**Features:**
- Revenue line (blue)
- Fixed costs line (red, dashed)
- Profit line (green)
- Shaded profit/loss areas
- Break-even point marker (amber)
- Interactive tooltips

**Data Points:**
- Sessions (0 to 1.5x break-even point)
- Revenue = sessions × average contribution margin
- Profit = revenue - fixed costs

### 2. Contribution Margin by Therapy Type

**Chart Type:** Bar Chart

**Features:**
- Color-coded bars by contribution margin percentage
  - Green: ≥70% margin
  - Blue: 50-69% margin
  - Amber: 30-49% margin
  - Red: <30% margin
- Angled X-axis labels
- Interactive tooltips showing price and margin details

### 3. What-If Scenario Comparison

**Chart Type:** Bar Chart + Interactive Controls

**Features:**
- Three scenarios: Pessimistic, Realistic, Optimistic
- Adjustable fixed costs with +/- buttons
- Reset to original costs
- Scenario cards with color-coding
- Real-time chart updates

**Scenarios:**
- **Pessimistic:** Based on lowest contribution margin
- **Realistic:** Based on average contribution margin
- **Optimistic:** Based on highest contribution margin

## Styling & Theming

### Dark Mode Support

The component fully supports dark mode with Tailwind CSS classes:
- Light mode: White backgrounds, neutral text
- Dark mode: Neutral-800/900 backgrounds, lighter text

### Responsive Design

The component is responsive across all screen sizes:
- **Mobile:** Stacked layout, simplified labels
- **Tablet:** 2-column grids
- **Desktop:** Full 3-column layouts

### Color Palette

**Chart Colors:**
- Revenue: `#3b82f6` (blue-500)
- Fixed Costs: `#ef4444` (red-500)
- Profit: `#10b981` (green-500)
- Break-Even: `#f59e0b` (amber-500)

**Contribution Margin Colors:**
- High (≥70%): `#10b981` (green-500)
- Medium-High (50-69%): `#3b82f6` (blue-500)
- Medium-Low (30-49%): `#f59e0b` (amber-500)
- Low (<30%): `#ef4444` (red-500)

## Accessibility

### ARIA Support

- Buttons have `aria-label` attributes
- Charts are keyboard-navigable via Recharts
- Tooltips provide context on hover/focus

### Semantic HTML

- Proper heading hierarchy
- Meaningful button text
- Color is not the only indicator (text labels included)

### Keyboard Navigation

- Tab through interactive elements
- Enter/Space to activate buttons
- Tooltips appear on focus

## Customization

### Adjusting Chart Height

Change the height in the `ResponsiveContainer`:

```tsx
<div className="h-[400px]"> {/* Change this value */}
  <ResponsiveContainer width="100%" height="100%">
    {/* ... chart ... */}
  </ResponsiveContainer>
</div>
```

### Custom Color Scheme

Modify the `getBarColor` function:

```tsx
const getBarColor = (percent: number) => {
  if (percent >= 70) return '#your-color' // Custom green
  if (percent >= 50) return '#your-color' // Custom blue
  if (percent >= 30) return '#your-color' // Custom amber
  return '#your-color' // Custom red
}
```

### Chart Data Density

Adjust the step size in `breakEvenChartData`:

```tsx
for (let sessions = 0; sessions <= maxSessions; sessions += Math.max(1, Math.floor(maxSessions / 50))) {
  // Change '/50' to control density
  // Higher number = fewer data points
  // Lower number = more data points
}
```

## Performance Considerations

### Optimization Features

1. **useMemo for calculations** - Memoized expensive calculations
2. **Conditional rendering** - Charts only render when visible
3. **Animation control** - Can disable with `isAnimationActive={false}`

### Best Practices

- Keep therapy array size reasonable (<50 items)
- Use the toggle to hide charts when not needed
- Consider lazy loading for large datasets

## Troubleshooting

### Charts not displaying

**Issue:** Blank chart area

**Solutions:**
1. Check that `therapies` array is not empty
2. Verify `fixedCosts` is a valid number (>0)
3. Check browser console for errors
4. Ensure Recharts is properly installed

### Tooltip not showing

**Issue:** Tooltips don't appear on hover

**Solutions:**
1. Check z-index conflicts in CSS
2. Verify `Tooltip` component is rendered
3. Test in different browsers
4. Check for overlapping elements

### Dark mode styling issues

**Issue:** Charts don't match dark mode theme

**Solutions:**
1. Verify Tailwind dark mode is enabled
2. Check parent containers have proper dark mode classes
3. Ensure `ThemeProvider` is configured correctly

### Performance issues

**Issue:** Slow rendering or laggy interactions

**Solutions:**
1. Reduce number of data points in charts
2. Disable animations: `isAnimationActive={false}`
3. Use production build (not development)
4. Check for unnecessary re-renders with React DevTools

## Browser Support

The component works in all modern browsers:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android)

## Future Enhancements

Potential features to add:

1. **Export to PNG/PDF** - Download charts as images
2. **Print-friendly styles** - Optimized for printing
3. **Data export** - Export chart data to CSV/Excel
4. **More chart types** - Pie charts, scatter plots
5. **Comparison mode** - Compare multiple months
6. **Trend analysis** - Show historical trends
7. **Forecasting** - Predictive analytics

## Support & Contributing

For issues or questions:
- Check this documentation first
- Review component source code
- Test with minimal reproduction case
- Check Recharts documentation: https://recharts.org

## License

Same as parent project.
