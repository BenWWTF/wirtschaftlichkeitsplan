# Wirtschaftlichkeitsplan - Financial Dashboard für österreichische Arztpraxen

Ein modernes, DSGVO-konformes Financial-Planning Dashboard für österreichische Arztpraxen mit Next.js, Supabase und React.

## Features

- 🏥 **Therapiearten-Management** - Verwalten Sie verschiedene Therapiearten mit individuellen Preisen und Kosten
- 📅 **Monatliche Planung** - Planen Sie Sitzungen pro Therapieart und verfolgen Sie Umsatzprognosen
- 💰 **Break-Even-Analyse** - Berechnen Sie Ihre Break-Even-Punkte und Rentabilität
- 📊 **Finanzielle Dashboards** - Visualisieren Sie Ihre Einnahmen, Ausgaben und Prognosen
- 🇦🇹 **Österreich-Spezifisch** - Vordefinierte Ausgabenkategorien nach österreichischem Standard
- 🔐 **DSGVO-Konform** - EU-gehostet auf Supabase mit vollständiger Datensicherheit
- 🌙 **Dark Mode** - Augenschonend für tägliche Nutzung

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Backend/Database**: Supabase (PostgreSQL, EU-Region)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Tremor + Recharts
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

## Schnellstart

### 1. Supabase Projekt erstellen

1. Gehen Sie auf [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. **Wichtig**: Wählen Sie als Region **EU-West-1 (Irland)** für DSGVO-Compliance
4. Kopieren Sie die Projekt-URL und den Publishable Key

### 2. Projekt klonen und Dependencies installieren

```bash
git clone <repository-url>
cd wirtschaftlichkeitsplan
pnpm install
```

### 3. Environment Variablen konfigurieren

```bash
cp .env.local.example .env.local
```

Bearbeiten Sie `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### 4. Datenbank-Schema erstellen

Gehen Sie in die Supabase Console und führen Sie das SQL-Script aus:

1. Öffnen Sie Ihr Supabase Projekt
2. Navigieren Sie zu **SQL Editor**
3. Erstellen Sie eine neue Query
4. Kopieren Sie den Inhalt von `supabase/migrations/001_create_tables.sql`
5. Führen Sie das Script aus

### 5. Development Server starten

```bash
pnpm dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) in Ihrem Browser.

## Projektstruktur

```
wirtschaftlichkeitsplan/
├── app/
│   ├── (auth)/               # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/          # Dashboard route group
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard/            # Dashboard components
│   └── providers.tsx
├── lib/
│   ├── actions/              # Server actions
│   ├── queries/              # Data fetching
│   ├── types.ts              # TypeScript types
│   ├── validations.ts        # Zod schemas
│   ├── constants.ts          # App constants
│   └── utils.ts              # Utility functions
├── utils/
│   └── supabase/             # Supabase clients
├── supabase/
│   └── migrations/           # Database migrations
├── middleware.ts             # Auth middleware
└── public/                   # Static assets
```

## Phased Development

Das Projekt ist in Phasen aufgebaut:

### Phase 1-2: Foundation ✅
- Next.js Projekt Setup
- Supabase Konfiguration
- Tailwind CSS mit Apple-Design

### Phase 3: Therapiearten Management 🚀
- CRUD für Therapiearten
- Form Validierung
- Data Tables

### Phase 4: Monatliche Planung
- Monats-Planner Interface
- Revenue Calculations
- Optimistic Updates

### Phase 5: Break-Even Analysis
- Financial Calculations
- Break-Even Formulas
- Visual Indicators

### Phase 6: Dashboards & Charts
- KPI Cards
- Tremor Charts
- Forecasting

## Österreichische Ausgabenkategorien

Das System beinhaltet vordefinierte Kategorien nach österreichischem Standard:

- Räumlichkeiten (Miete, Betriebskosten, Energie)
- Personal (Gehälter, Lohnnebenkosten)
- Medizinischer Bedarf
- Ausstattung & Geräte
- Versicherungen
- IT & Digital
- Beratung & Verwaltung
- Pflichtbeiträge
- Sonstige Betriebsausgaben

## DSGVO-Compliance

Dieses Projekt ist DSGVO-konform:

- ✅ EU-Hosting (Supabase, EU-West-1)
- ✅ Row-Level Security (RLS) für Datenschutz
- ✅ Benutzergesteuerter Datenzugriff
- ✅ Datenlöschung auf Anfrage
- ✅ Verschlüsselte Übertragung (TLS)

### Rechtliche Anforderungen

Sie benötigen:
1. Datenschutzerklärung (wird bereitgestellt)
2. Auftragsverarbeitungsvertrag (AVV) mit Supabase
   - Kontaktieren Sie: support@supabase.io

## Available Scripts

```bash
# Development
pnpm dev          # Start dev server

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Quality
pnpm lint         # Run ESLint
```

## Wichtige Hinweise

### Supabase Service Role Key
**Speichern Sie den Service Role Key NICHT in `.env.local`!**

Er wird nur für Backend-Operationen benötigt und muss sicher verwahrt werden.

### Datenbankmigrationen
Nach Updates des Schemas:
1. Erstellen Sie eine neue Migration in `supabase/migrations/`
2. Führen Sie die SQL in der Supabase Console aus
3. Testen Sie gründlich in der Dev-Umgebung

## Sicherheit

- Alle Abfragen nutzen Row-Level Security
- Validierung mit Zod auf Client und Server
- Server Actions für sichere Mutations
- CORS-Richtlinien korrekt konfiguriert

## Zukunfts-Features

- 🔄 Recurring Expenses Automation
- 📈 AI-powered Financial Forecasting
- 📤 PDF/Excel Export
- 🔗 ELGA-Integration
- 💳 Payment Gateway Integration
- 📱 Native Mobile Apps

## Support & Kontakt

Für Fragen oder Probleme:

1. Überprüfen Sie die [Supabase Dokumentation](https://supabase.com/docs)
2. Konsultieren Sie die [Next.js Dokumentation](https://nextjs.org/docs)
3. Erstellen Sie ein Issue im Repository

## Lizenz

Dieses Projekt ist für österreichische Arztpraxen konzipiert.

## Danksagungen

- Supabase für die exzellente Backend-Infrastruktur
- Vercel für Next.js und Deployment
- shadcn/ui für großartige UI-Komponenten
- Tremor für finanzielle Dashboard-Templates

---

Viel Erfolg mit Ihrer Praxis! 🏥📊
