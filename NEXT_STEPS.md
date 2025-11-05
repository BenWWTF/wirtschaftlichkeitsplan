# 🚀 Nächste Schritte - Phase 3 und darüber hinaus

Das Foundation-Setup ist abgeschlossen! Ihr Next.js + Supabase Projekt mit Authentifizierung läuft erfolgreich.

## Status-Übersicht

✅ **Completed**
- Next.js 14 Projekt mit TypeScript
- Supabase Integration (EU-hosted für DSGVO)
- Authentication System (Login/Signup)
- Tailwind CSS mit Apple-Design
- Database Schema mit RLS Policies
- shadcn/ui Components Setup
- Form Validation mit React Hook Form + Zod

🚀 **Next: Phase 3 - Therapiearten Management**

## Phase 3: Therapiearten Management (Empfohlen für diese Woche)

Das ist Ihre erste sichtbare Feature! Dies wird zeigen, wie Sie:
- Server Actions für Mutations schreiben
- shadcn/ui Table Components nutzen
- Formular-Dialoge implementieren
- Optimistic UI Updates machen

### 3.1 Komponenten erstellen

**Zu erstellende Dateien:**

```
components/
├── dashboard/
│   ├── therapy-list.tsx         # Liste aller Therapiearten
│   ├── therapy-dialog.tsx       # Form Dialog zum Hinzufügen/Bearbeiten
│   ├── therapy-actions.tsx      # Delete/Edit Buttons
│   └── therapy-empty-state.tsx  # Leerer Zustand
```

### 3.2 Server Actions

```
lib/
└── actions/
    └── therapies.ts            # createTherapy, updateTherapy, deleteTherapy
```

### 3.3 UI Components (noch zu erstellen)

```bash
# Diese shadcn/ui Components benötigen Sie noch:
pnpm dlx shadcn@latest add table dialog textarea select
```

### 3.4 Struktur des Therapiearten-Pages

```typescript
// app/(dashboard)/therapien/page.tsx
// - Server Component
// - Lädt Therapiearten mit getTherapyTypes()
// - Rendert TherapyList Component
// - TherapyList rendert Table + Dialog
```

## Implementation Path für Phase 3

### Schritt 1: shadcn/ui Components installieren

```bash
cd wirtschaftlichkeitsplan
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add select
```

### Schritt 2: Server Actions für Therapiearten

**Datei: `lib/actions/therapies.ts`**

```typescript
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TherapyTypeSchema } from '@/lib/validations'

export async function createTherapyAction(input: TherapyTypeInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const validated = TherapyTypeSchema.parse(input)

  const { error } = await supabase
    .from('therapy_types')
    .insert({
      user_id: user.id,
      ...validated
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/therapien')
  return { success: true }
}
```

### Schritt 3: Components bauen

**Datei: `components/dashboard/therapy-list.tsx`**

```typescript
'use client'

import { TherapyType } from '@/lib/types'
import { TherapyDialog } from './therapy-dialog'
import { TherapyTable } from './therapy-table'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function TherapyList({ therapies }: { therapies: TherapyType[] }) {
  const [open, setOpen] = useState(false)
  const [selectedTherapy, setSelectedTherapy] = useState<TherapyType | null>(null)

  const handleEdit = (therapy: TherapyType) => {
    setSelectedTherapy(therapy)
    setOpen(true)
  }

  const handleCreate = () => {
    setSelectedTherapy(null)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Therapiearten</h1>
        <Button onClick={handleCreate}>
          + Neue Therapieart
        </Button>
      </div>

      <TherapyTable
        therapies={therapies}
        onEdit={handleEdit}
      />

      <TherapyDialog
        open={open}
        onOpenChange={setOpen}
        therapy={selectedTherapy}
      />
    </div>
  )
}
```

### Schritt 4: Page zusammenstellen

**Datei: `app/(dashboard)/therapien/page.tsx`**

```typescript
import { getTherapyTypes } from '@/lib/queries/therapies'
import { TherapyList } from '@/components/dashboard/therapy-list'
import { getUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export default async function TherapienPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const therapies = await getTherapyTypes()

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <TherapyList therapies={therapies} />
    </main>
  )
}
```

## Lerninhalte für Phase 3

- **Server Components**: Lesen von Datenbanken ohne API
- **Server Actions**: `'use server'` Functions für Mutations
- **Optimistic UI**: Sofortiges Feedback beim Benutzer
- **revalidatePath**: Cache-Invalidierung nach Datenänderungen
- **Dialog Components**: Modal Forms mit shadcn/ui
- **Data Tables**: Tabellen mit React + shadcn/ui
- **Error Handling**: Graceful Error Messages

## Nach Phase 3: Vorschau der nächsten Phasen

### Phase 4: Monatliche Planung
- Monats-Selector
- Editable Grid mit Sessions pro Therapieart
- Real-time Revenue Calculation
- "Copy from previous month" Feature

### Phase 5: Break-Even Analyse
- Settings Page für Fixkosten
- Break-Even Berechnung
- KPI Card Komponente
- Visuelle Indikatoren (grün/rot)

### Phase 6: Dashboards & Charts
- KPI Cards Grid
- Tremor Charts (AreaChart, BarChart)
- 12-Monats Forecast
- Expense Breakdown

## Timing und Meilensteine

| Phase | Features | Timing | Status |
|-------|----------|--------|--------|
| 1-2 | Foundation, Auth | ✅ Fertig | Done |
| 3 | Therapiearten CRUD | Diese Woche | 🚀 Next |
| 4 | Monthly Planning | Woche 2 | Pending |
| 5 | Break-Even Analysis | Woche 2-3 | Pending |
| 6 | Dashboards & Charts | Woche 3-4 | Pending |
| 7-10 | Polish, Mobile, Deploy | Woche 4-5 | Pending |

## Best Practices Reminder

- ✅ Immer `'use client'` für interaktive Components
- ✅ Server Components als Default
- ✅ `revalidatePath()` nach Mutations
- ✅ Zod Validation auf Server
- ✅ TypeScript strict mode aktiviert
- ✅ Error Handling mit `try/catch`
- ✅ Toast Notifications für Feedback
- ✅ Loading States für Async Operations

## Häufige Anfängerfehler zu vermeiden

❌ **Nicht**: API Routes für simple Queries (nutzen Sie Server Components)
❌ **Nicht**: Client-seitige Datenbanklogik (nutzen Sie Server Actions)
❌ **Nicht**: Hardcoded User IDs (nutzen Sie `getUser()`)
❌ **Nicht**: Fehlende Error Handling (immer try/catch)

✅ **Besser**: Server Components für Queries
✅ **Besser**: Server Actions für Mutations
✅ **Besser**: Zod Validation überall
✅ **Besser**: Benutzerfreundliche Error Messages

## Debugging-Tipps

```bash
# Logs in Server Actions sehen
console.log('Debug:', value)

# Supabase RLS Fehler überprüfen
# Schauen Sie in Supabase Console → Logs

# TypeScript Fehler finden
pnpm build

# Development Mode mit Details
NODE_OPTIONS='--inspect' pnpm dev
```

## Support und Ressourcen

### Offizieller Dokumentation
- [Next.js Server Actions](https://nextjs.org/docs/app-router/server-actions-and-mutations)
- [Supabase JavaScript Library](https://supabase.com/docs/reference/javascript)
- [shadcn/ui Dokumentation](https://ui.shadcn.com)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Dokumentation](https://zod.dev)

### Video Tutorials
- Next.js App Router Crash Course
- Building Full-Stack Apps with Next.js and Supabase
- React Hook Form & Zod Validation

## Fragen Sie sich selbst

Bevor Sie mit Phase 3 starten:

- [ ] Habe ich das Setup Guide durchgelesen?
- [ ] Läuft mein Dev Server? (`pnpm dev`)
- [ ] Kann ich mich registrieren und anmelden?
- [ ] Sehe ich die Therapy Types Tabelle in Supabase?
- [ ] Verstehe ich Server Components vs Client Components?
- [ ] Habe ich die TypeScript Types verstanden?

---

**Bereit zu starten?** Öffnen Sie `Phase-3-Implementation.md` für detaillierte Code-Examples! 🎯

Viel Erfolg beim Bauen! 🚀
