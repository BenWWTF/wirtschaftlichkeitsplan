# Sprint 7 & 8 Integration Guide

**Status**: Sprints 1-6 Complete ✅ | Sprint 7-8 Ready for Implementation

---

## Overview

Sprints 1-6 have created all the foundational mobile components. Sprints 7-8 focus on integrating these components into the actual dashboard pages and comprehensive testing.

---

## SPRINT 7: Component Integration & Page Refinement

### Objective
Integrate all mobile components into 8 dashboard pages and refine layouts for mobile-first experience.

### Pages to Update

#### 1. **Dashboard Home** (`app/dashboard/page.tsx`)
**Current**: KPI cards layout
**Changes**:
- Make KPI cards responsive (1 column on mobile, 2-3 on desktop)
- Reduce heading sizes using `mobile-h2` utility
- Add `mobile-pad` for consistent padding
- Charts mobile optimization (ensure no horizontal scroll)

**Components Used**:
- Responsive grid system
- `mobile-h2`, `mobile-body` typography
- `mobile-pad` spacing

---

#### 2. **Therapien Page** (`app/dashboard/therapien/page.tsx`)
**Current**: Table layout for therapy types
**Changes**:
- Replace table with `MobileCard` components on mobile
- Desktop: Keep existing table
- Conditional rendering: `md:hidden` for cards, `hidden md:block` for table
- Add action buttons (Edit/Delete) to mobile cards
- Use `CollapsibleSection` for therapy details

**Components Used**:
- `MobileCard`
- `CollapsibleSection`
- Responsive visibility classes

**Example**:
```tsx
{/* Mobile: Card View */}
<div className="md:hidden space-y-3">
  {therapies.map(therapy => (
    <MobileCard
      key={therapy.id}
      title={therapy.name}
      primary={`${therapy.price}€ / Sitzung`}
      secondary={`Ca. ${therapy.sessions}/Monat`}
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => editTherapy(therapy.id)}>Bearbeiten</Button>
          <Button size="sm" variant="ghost" onClick={() => deleteTherapy(therapy.id)}>Löschen</Button>
        </div>
      }
    />
  ))}
</div>

{/* Desktop: Table View */}
<div className="hidden md:block">
  {/* Existing table code */}
</div>
```

---

#### 3. **Ausgaben Page** (`app/dashboard/ausgaben/page.tsx`)
**Current**: Expense table
**Changes**:
- Replace table with `MobileCard` for each expense
- Show: Category, Amount, Date, Type
- Action buttons: Edit, Delete
- Filter/search should remain accessible on mobile
- Summary cards above list

**Components Used**:
- `MobileCard`
- `mobile-pad`, `mobile-gap` spacing
- Responsive filter layout

---

#### 4. **Planung Page** (`app/dashboard/planung/page.tsx`)
**Current**: Planning session grid
**Changes**:
- Responsive grid: 1 column mobile, 2+ desktop
- Month navigation should be touch-friendly
- Session cards with `MobileCard`
- Period selector mobile-optimized

**Components Used**:
- `MobileCard`
- Responsive grid (`mobile-grid-2`)
- Mobile period selector

---

#### 5. **Steuerprognose Page** (`app/dashboard/steuerprognose/page.tsx`)
**Current**: Form with tabs
**Changes**:
- Form should use mobile-responsive layout
- Full-width inputs on mobile
- Tabs should be mobile-friendly (consider stacked on mobile)
- Sticky submit button using `MobileForm` wrapper

**Components Used**:
- `MobileForm` (if applicable)
- Mobile form utilities
- Responsive grid

---

#### 6. **Berichte Page** (`app/dashboard/berichte/page.tsx`)
**Current**: Report list with export options
**Changes**:
- Report cards layout
- Export buttons mobile-friendly
- Filter drawer using `MoreMenuDrawer` pattern
- Report cards with actions

**Components Used**:
- `MobileCard`
- Export button sizing
- Filter integration

---

#### 7. **Einstellungen Page** (`app/dashboard/einstellungen/page.tsx`)
**Current**: Settings form
**Changes**:
- Full-screen form experience on mobile
- Settings grouped in sections
- Save button sticky at bottom (using safe area)
- Use `MobileForm` wrapper on mobile

**Components Used**:
- `MobileForm`
- Grouped settings sections
- Form utilities

---

#### 8. **Import Page** (`app/dashboard/import/page.tsx`)
**Current**: File upload interface
**Changes**:
- Upload area mobile-responsive
- Progress indicator mobile-friendly
- Results displayed as cards
- Touch-friendly file input

**Components Used**:
- Upload responsive layout
- Progress mobile styling
- Result `MobileCard` display

---

### Implementation Checklist

- [ ] Dashboard: Responsive KPI cards, `mobile-h2` headers
- [ ] Therapien: Mobile card + desktop table toggle
- [ ] Ausgaben: Mobile expense cards, responsive filters
- [ ] Planung: Responsive grid, touch-friendly month nav
- [ ] Steuerprognose: Mobile form layout, responsive tabs
- [ ] Berichte: Report cards, export button layout
- [ ] Einstellungen: Full-screen form, sticky save button
- [ ] Import: Responsive upload, card results

---

## SPRINT 8: Testing, Polish & Final Optimization

### Testing Checklist

#### Device Testing (using Chrome DevTools or actual devices)
- [ ] iPhone 12 (6.1") - Portrait & Landscape
- [ ] iPhone 15 (6.7") - Portrait & Landscape (notched device)
- [ ] Samsung A13 (6.5") - Portrait & Landscape
- [ ] iPad (10") - Portrait & Landscape
- [ ] Android tablet - Portrait & Landscape

#### Screen Sizes
- [ ] 320px (small phone)
- [ ] 375px (iPhone)
- [ ] 480px (small phone landscape)
- [ ] 768px (tablet - md breakpoint)
- [ ] 1024px+ (desktop)

#### Touch Testing
- [ ] All buttons 44px+ height ✅
- [ ] No overlapping touch targets ✅
- [ ] Tap feedback visible ✅
- [ ] Double-tap zoom disabled (16px font) ✅
- [ ] Swipe gestures working (drawer) ✅

#### Keyboard Navigation
- [ ] Tab navigation through all controls
- [ ] Escape key closes modals/drawers ✅
- [ ] Enter/Space toggles buttons and collapsibles ✅
- [ ] Focus rings visible and clear ✅

#### Performance Testing
- [ ] LCP < 3s on 3G throttle
- [ ] TTI < 5s on 3G throttle
- [ ] CLS = 0 (no layout shifts)
- [ ] No janky animations (60fps)
- [ ] Smooth scrolling on mobile

#### Accessibility (WCAG 2.1 AA)
- [ ] Color contrast 4.5:1 for normal text ✅
- [ ] Color contrast 3:1 for large text ✅
- [ ] Focus visible on all interactive elements ✅
- [ ] ARIA labels present ✅
- [ ] Screen reader compatible ✅

#### Dark Mode Testing
- [ ] All components tested in dark mode ✅
- [ ] Colors maintain contrast ✅
- [ ] Icons visible in dark mode ✅
- [ ] Proper `dark:` class coverage ✅

#### Edge Cases
- [ ] Long page titles (text truncation)
- [ ] Notched devices (safe area padding) ✅
- [ ] Keyboard visible + scrolling
- [ ] Network offline handling
- [ ] Landscape orientation layout
- [ ] Font size increase (browser zoom)

#### Network Throttling
- [ ] 3G slow: LCP < 3s
- [ ] 4G: LCP < 2s
- [ ] 5G: LCP < 1.5s

---

### Polish Checklist

#### Visual Refinement
- [ ] Consistent spacing (mobile-pad, mobile-gap) ✅
- [ ] Proper typography hierarchy ✅
- [ ] Icon sizes consistent
- [ ] Button styles uniform
- [ ] Loading states clear
- [ ] Error states clear
- [ ] Empty states friendly

#### Interaction Polish
- [ ] Smooth page transitions
- [ ] Drawer animations smooth
- [ ] Card expand/collapse smooth ✅
- [ ] Form validation real-time
- [ ] Success/error feedback clear
- [ ] Tap feedback haptic (if supported)

#### Content Polish
- [ ] All text readable on mobile
- [ ] No text cutoff
- [ ] Images responsive
- [ ] Tables readable (or converted to cards)
- [ ] Forms easy to fill
- [ ] Labels clear and helpful

---

### Performance Optimization (Optional)

- [ ] Image lazy loading
- [ ] Code splitting by route
- [ ] Service worker caching
- [ ] Preload critical resources
- [ ] Minimize CSS/JS bundles
- [ ] Optimize font loading

---

### Sign-Off Criteria

✅ **All implemented when**:
1. All 8 pages work on mobile without horizontal scroll
2. All touch targets are 44px+
3. Forms are easy to use on mobile
4. Dark mode works properly
5. No accessibility violations (axe DevTools scan)
6. LCP < 3s on 3G
7. CLS = 0
8. WCAG 2.1 AA compliant
9. Tested on at least 3 device sizes
10. All components integrated and working

---

### Testing Tools

**Browser DevTools**:
- Chrome DevTools (mobile simulation)
- Firefox Mobile Emulation

**Accessibility**:
- axe DevTools (Chrome extension)
- WAVE (Wave.webaim.org)
- Lighthouse (Chrome DevTools)

**Performance**:
- Lighthouse (Chrome DevTools)
- WebPageTest.org
- GTmetrix

**Device Testing**:
- Physical devices (if available)
- BrowserStack (cloud devices)
- Chrome Remote Debugging

---

### Lighthouse Targets

- **Performance**: > 85
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

---

## Summary

Sprints 7-8 convert the mobile foundation (Sprints 1-6) into a complete mobile experience across all dashboard pages. Focus on:

1. **Sprint 7**: Integrate components into pages
2. **Sprint 8**: Comprehensive testing and refinement

All components are ready and tested. Integration should be straightforward following the patterns established in Sprints 1-6.

---

**Last Updated**: December 8, 2025
**Status**: Ready for Implementation
**Estimated Timeline**: 2-3 days for complete integration and testing
