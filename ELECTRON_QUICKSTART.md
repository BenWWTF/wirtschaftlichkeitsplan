# Wirtschaftlichkeitsplan Electron App - Quick Start

## 🚀 Development

### Prerequisites
- Node.js 18+
- pnpm (already installed)

### Getting Started

1. **Install dependencies** (already done):
```bash
pnpm install
```

2. **Start development server**:
```bash
pnpm dev
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Launch Electron app
- Open DevTools automatically

3. **Build for production**:
```bash
pnpm build
```

## 📊 Architecture

### Main Components
- **Electron Main Process**: `electron/main.js`
  - SQLite database initialization
  - IPC handlers for all data operations
  - Window management

- **React Frontend**: `src/App.tsx`
  - Pages: Dashboard, Settings, Placeholder pages
  - Components: UI system (Button, Input, Card), Layouts (AppShell, BottomNavigation)
  - State: Zustand stores for dashboard data

- **Database**: `src/lib/database.ts`
  - TypeScript interfaces for data models
  - CRUD operations for therapy types, monthly plans, expenses
  - Monthly summary calculations

### IPC Channels
- `therapy-types:list|create|update|delete`
- `monthly-plans:list|create|update|delete`
- `expenses:list|create|update|delete`
- `summary:monthly`

## 💾 Data

### Database
- **Location**: `~/.config/Wirtschaftlichkeitsplan/wirtschaftlichkeitsplan.db` (macOS)
- **Pre-migrated data**: 6 therapy types, 119 monthly plans, 9 expenses
- **Schema**: Tables for therapy_types, monthly_plans, expenses, sync_log

### All-inkl Sync (TODO)
- Remote MariaDB for backup
- Configure in Settings page
- Auto-sync every 5 minutes (stub ready)

## 🎨 Design System

Colors (from hinterbuchinger.com):
- **Primary**: Charcoal `#101010`
- **Accent**: Taubenblau `#7A9BA8`
- **Secondary**: Light Gray `#F1F1F1`

Components:
- Button (primary/secondary/ghost)
- Input (with validation)
- Card
- BottomNavigation
- AppShell (main layout)

## 📝 File Structure

```
wirtschaftlichkeitsplan/
├── electron/
│   ├── main.js          # Electron entry + IPC handlers
│   └── preload.js       # IPC bridge to renderer
├── src/
│   ├── components/      # UI components
│   │   ├── ui/          # Button, Input, Card
│   │   └── layout/      # AppShell, BottomNavigation
│   ├── pages/           # Dashboard, Settings
│   ├── lib/
│   │   └── database.ts  # Database layer
│   ├── stores/          # Zustand state
│   ├── hooks/           # useIpc hook
│   └── styles/          # Design tokens
├── index.html           # HTML entry
├── main.tsx             # React entry
├── App.tsx              # Router setup
├── vite.config.ts       # Vite frontend config
└── vite.config.electron.js  # Electron build config
```

## 🔧 Next Steps

1. **Setup Alle-inkl sync**:
   - Create API endpoint for webhook receiver
   - Implement sync logic in `src/lib/sync.ts`
   - Configure in Settings

2. **Add remaining pages**:
   - Plans management
   - Reports generation
   - Export to PDF/CSV

3. **Testing**:
   - Unit tests for database layer
   - Integration tests for IPC
   - E2E tests for pages

4. **Build & distribute**:
   - `pnpm build` to create app bundle
   - Use electron-builder for .dmg/installer

## 📞 Support

- All data persists locally in SQLite
- DevTools available in dev mode
- Check `wirtschaftlichkeitsplan.db` directly if needed
