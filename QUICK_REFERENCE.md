# ⚡ Quick Reference - Wirtschaftlichkeitsplan

Schnelle Übersicht für häufig benötigte Befehle und Patterns.

## 🚀 Häufige Befehle

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:3000)

# Building
pnpm build                  # Production build
pnpm start                  # Production server

# Code Quality
pnpm lint                   # Run ESLint

# Package Management
pnpm add <package>          # Add dependency
pnpm remove <package>       # Remove dependency
pnpm update                 # Update all packages

# shadcn/ui
pnpm dlx shadcn@latest add <component>  # Add UI component
```

## 📁 Wichtige Dateien

| File | Purpose |
|------|---------|
| `.env.local` | Supabase Konfiguration |
| `supabase/migrations/001_create_tables.sql` | Database Schema |
| `lib/validations.ts` | Zod Schemas |
| `lib/types.ts` | TypeScript Interfaces |
| `lib/utils.ts` | Utility Functions |
| `tailwind.config.ts` | Design System |

## 🔐 Authentifizierung Patterns

### Server Component (Daten laden)
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  // ...
}
```

### Server Action (Datenmutation)
```typescript
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ... validate & update ...

  revalidatePath('/path')
  return { success: true }
}
```

### Protected Route
```typescript
// In any page.tsx
const user = await getUser()
if (!user) redirect('/login')
```

## 💾 Datenbank Patterns

### Query (Select)
```typescript
const { data, error } = await supabase
  .from('therapy_types')
  .select('*')
  .eq('user_id', userId)
```

### Insert
```typescript
const { error } = await supabase
  .from('therapy_types')
  .insert({
    user_id: userId,
    name: 'Therapieart',
    price_per_session: 150
  })
```

### Update
```typescript
const { error } = await supabase
  .from('therapy_types')
  .update({ name: 'Updated' })
  .eq('id', id)
```

### Delete
```typescript
const { error } = await supabase
  .from('therapy_types')
  .delete()
  .eq('id', id)
```

## 📝 Validation Patterns

### Zod Schema
```typescript
import { z } from 'zod'

const TherapySchema = z.object({
  name: z.string().min(1),
  price: z.number().positive()
})

type TherapyInput = z.infer<typeof TherapySchema>
```

### Form mit Validation
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function TherapyForm() {
  const form = useForm({
    resolver: zodResolver(TherapySchema),
    defaultValues: { name: '', price: 0 }
  })

  async function onSubmit(data: TherapyInput) {
    const result = await therapyAction(data)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Fields */}
      </form>
    </Form>
  )
}
```

## 🎨 Styling Patterns

### Responsive Classes
```typescript
<div className="p-4 md:p-6 lg:p-8">
  // Padding: 4 on mobile, 6 on tablet, 8 on desktop
</div>
```

### Dark Mode
```typescript
<div className="bg-white dark:bg-neutral-900">
  // White on light, dark-neutral on dark
</div>
```

### Utility Functions
```typescript
import { formatEuro, formatDate } from '@/lib/utils'

formatEuro(1234.56)    // €1.234,56
formatDate('2024-11-05') // 05.11.2024
```

## 🧮 Financial Calculations

```typescript
import { calculateBreakEven } from '@/lib/utils'

const breakEven = calculateBreakEven(
  pricePerSession,      // 150
  variableCostPerSession, // 20
  fixedCostsMonthly     // 8000
)

// Result: {
//   sessionsNeeded: 62,
//   revenueNeeded: 9300,
//   contributionMarginPercent: 86.67,
//   isViable: true
// }
```

## 🗂 Folder Structure at a Glance

```
app/
  ├── (auth)/           ← Login/Signup routes
  ├── (dashboard)/      ← Protected dashboard routes
  └── page.tsx          ← Landing page

components/
  ├── ui/               ← shadcn/ui components
  ├── dashboard/        ← Dashboard components (Phase 3+)
  └── providers.tsx     ← Theme provider

lib/
  ├── actions/          ← Server actions
  ├── queries/          ← Data fetching
  ├── types.ts          ← Interfaces
  ├── validations.ts    ← Zod schemas
  ├── constants.ts      ← App constants
  └── utils.ts          ← Utility functions

utils/
  └── supabase/         ← Supabase clients

supabase/
  └── migrations/       ← Database migrations
```

## 🐛 Debugging Tips

### Error in Server Action?
```typescript
try {
  // code
} catch (error) {
  console.error('Detailed error:', error)
  return { error: 'User friendly message' }
}
```

### RLS Policy Problem?
1. Check Supabase Console → Table → RLS
2. Make sure policy uses correct `auth.uid()`
3. Verify user_id column exists

### TypeScript Error?
```bash
pnpm build  # Shows all errors
```

### Form Validation Issue?
```typescript
// In browser console:
form.formState.errors  // See all validation errors
```

## 📦 Dependencies at a Glance

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | 15.x |
| react | Library | 19.x |
| supabase | Backend | 2.x |
| tailwindcss | Styling | 3.x |
| react-hook-form | Forms | 7.x |
| zod | Validation | 3.x |
| sonner | Notifications | 1.x |
| date-fns | Date Utils | 3.x |

## 🎓 Learning Checklist

### Basics
- [ ] Understand Server vs Client Components
- [ ] Know how Server Actions work
- [ ] Can read Supabase data
- [ ] Can write/update data

### Intermediate
- [ ] RLS Policies konfigurieren
- [ ] Form Validation meistern
- [ ] Error Handling implementieren
- [ ] Responsive Design verstehen

### Advanced
- [ ] Cache invalidation mit `revalidatePath`
- [ ] Optimistic UI updates
- [ ] Complex SQL queries
- [ ] Performance optimization

## 🔗 Quick Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs)
- [Tailwind Classes](https://tailwindcss.com/docs)
- [Zod Validator](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)

## ⚠️ Common Mistakes

```typescript
// ❌ WRONG: Fetching data in client component
'use client'
async function getData() {
  const data = await fetch(...) // Expensive on client!
}

// ✅ CORRECT: Fetch in server component
async function getData() {
  const data = await fetch(...)
}

// ❌ WRONG: Hardcoding user ID
const userId = 'some-uuid' // Could access other user's data!

// ✅ CORRECT: Get from auth
const { data: { user } } = await supabase.auth.getUser()

// ❌ WRONG: No error handling
const { data } = await supabase.from('table').select()

// ✅ CORRECT: Handle errors
const { data, error } = await supabase.from('table').select()
if (error) return { error: error.message }
```

## 📋 Before Committing

```bash
pnpm build          # ✅ No build errors
pnpm lint           # ✅ No linting issues
# Test your feature manually
git add .
git commit -m "feat: description"
git push
```

## 🎯 Phase 3 Checklist (Quick)

- [ ] `pnpm dlx shadcn@latest add table`
- [ ] `pnpm dlx shadcn@latest add dialog`
- [ ] Create `lib/actions/therapies.ts`
- [ ] Create `components/dashboard/therapy-list.tsx`
- [ ] Create `components/dashboard/therapy-table.tsx`
- [ ] Create `components/dashboard/therapy-dialog.tsx`
- [ ] Create `app/(dashboard)/therapien/page.tsx`
- [ ] Test CRUD operations
- [ ] Test RLS policies

---

**Pro Tip**: Bookmark diese Seite! 📌
