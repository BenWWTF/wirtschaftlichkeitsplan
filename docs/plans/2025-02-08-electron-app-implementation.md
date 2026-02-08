# Wirtschaftlichkeitsplan Electron App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a sleek Electron desktop app with local SQLite + All-inkl MariaDB sync, matching hinterbuchinger.com design aesthetic.

**Architecture:** IPC-based (Main Process handles DB/sync, Renderer runs React UI). Local-first approach: all data in SQLite, background sync to MariaDB. Single-user, no Supabase needed.

**Tech Stack:** Electron 27+, React 19, TypeScript, SQLite3, axios, tailwindcss (hinterbuchinger design tokens), IPC bridge pattern

---

## Phase 1: Project Setup & Infrastructure

### Task 1: Initialize Electron + React Project Structure

**Files:**
- Create: `electron/main.js` (entry point)
- Create: `electron/preload.js` (IPC bridge)
- Modify: `package.json` (add Electron + scripts)
- Create: `vite.config.electron.js` (Vite + Electron config)
- Create: `src/electron/ipc.ts` (IPC channel definitions)

**Step 1: Update package.json with Electron dependencies**

Replace the scripts section in `package.json`:

```json
{
  "name": "wirtschaftlichkeitsplan",
  "version": "1.0.0",
  "description": "Business planning app for therapists",
  "type": "module",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && vite build -c vite.config.electron.js",
    "preview": "vite preview",
    "electron-dev": "electron .",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "sqlite3": "^5.1.7",
    "axios": "^1.7.0",
    "zustand": "^4.4.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "concurrently": "^8.2.0",
    "wait-on": "^7.0.0"
  }
}
```

Run: `pnpm install`
Expected: All dependencies install successfully

**Step 2: Create Electron main process**

Create `electron/main.js`:

```javascript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.on('ready', () => {
  // Initialize SQLite database
  const dbPath = path.join(app.getPath('userData'), 'wirtschaftlichkeitsplan.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers (defined in next task)

export { db };
```

Run: `pnpm install better-sqlite3`
Expected: Module installs

**Step 3: Create IPC preload bridge**

Create `electron/preload.js`:

```javascript
import { contextBridge, ipcRenderer } from 'electron';

const ipcApi = {
  // Business Plans
  createBusinessPlan: (data) => ipcRenderer.invoke('business-plan:create', data),
  getBusinessPlans: () => ipcRenderer.invoke('business-plan:list'),
  updateBusinessPlan: (id, data) => ipcRenderer.invoke('business-plan:update', { id, data }),
  deleteBusinessPlan: (id) => ipcRenderer.invoke('business-plan:delete', id),

  // Therapy Types
  getTherapyTypes: () => ipcRenderer.invoke('therapy-types:list'),
  createTherapyType: (data) => ipcRenderer.invoke('therapy-types:create', data),

  // Monthly Plans
  getMonthlyPlans: (month) => ipcRenderer.invoke('monthly-plans:list', month),
  createMonthlyPlan: (data) => ipcRenderer.invoke('monthly-plans:create', data),

  // Expenses
  getExpenses: (month) => ipcRenderer.invoke('expenses:list', month),
  createExpense: (data) => ipcRenderer.invoke('expenses:create', data),

  // Reports
  generateReport: (type, params) => ipcRenderer.invoke('reports:generate', { type, params }),

  // Sync
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),
  syncNow: () => ipcRenderer.invoke('sync:now'),
};

contextBridge.exposeInMainWorld('api', ipcApi);
```

**Step 4: Define IPC channel constants**

Create `src/electron/ipc.ts`:

```typescript
// Business Plan Channels
export const BUSINESS_PLAN_CHANNELS = {
  CREATE: 'business-plan:create',
  LIST: 'business-plan:list',
  UPDATE: 'business-plan:update',
  DELETE: 'business-plan:delete',
};

// Therapy Type Channels
export const THERAPY_TYPE_CHANNELS = {
  LIST: 'therapy-types:list',
  CREATE: 'therapy-types:create',
  UPDATE: 'therapy-types:update',
  DELETE: 'therapy-types:delete',
};

// Monthly Plan Channels
export const MONTHLY_PLAN_CHANNELS = {
  LIST: 'monthly-plans:list',
  CREATE: 'monthly-plans:create',
  UPDATE: 'monthly-plans:update',
  DELETE: 'monthly-plans:delete',
};

// Expense Channels
export const EXPENSE_CHANNELS = {
  LIST: 'expenses:list',
  CREATE: 'expenses:create',
  UPDATE: 'expenses:update',
  DELETE: 'expenses:delete',
};

// Report Channels
export const REPORT_CHANNELS = {
  GENERATE_PDF: 'reports:generate-pdf',
  GENERATE_CSV: 'reports:generate-csv',
  GENERATE_CHART: 'reports:generate-chart',
};

// Sync Channels
export const SYNC_CHANNELS = {
  STATUS: 'sync:status',
  SYNC_NOW: 'sync:now',
  SET_REMOTE_CONFIG: 'sync:set-config',
};

export type IpcApi = typeof window.api;
```

**Step 5: Create React hook for IPC**

Create `src/hooks/useIpc.ts`:

```typescript
import { useCallback } from 'react';

declare global {
  interface Window {
    api: {
      createBusinessPlan: (data: any) => Promise<any>;
      getBusinessPlans: () => Promise<any[]>;
      updateBusinessPlan: (id: string, data: any) => Promise<any>;
      deleteBusinessPlan: (id: string) => Promise<void>;
      getTherapyTypes: () => Promise<any[]>;
      createTherapyType: (data: any) => Promise<any>;
      getMonthlyPlans: (month: string) => Promise<any[]>;
      createMonthlyPlan: (data: any) => Promise<any>;
      getExpenses: (month: string) => Promise<any[]>;
      createExpense: (data: any) => Promise<any>;
      generateReport: (type: string, params: any) => Promise<any>;
      getSyncStatus: () => Promise<any>;
      syncNow: () => Promise<void>;
    };
  }
}

export function useIpc() {
  return window.api;
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "setup: initialize Electron + React project structure with IPC bridge"
```

---

### Task 2: Design System & Component Library (Hinterbuchinger Aesthetic)

**Files:**
- Create: `src/styles/design-tokens.css` (colors, spacing, typography)
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/layout/BottomNavigation.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Modify: `tailwind.config.ts` (extend with design tokens)

**Step 1: Create design tokens CSS**

Create `src/styles/design-tokens.css`:

```css
:root {
  /* Colors - Grayscale (Light Mode) */
  --color-black: #000000;
  --color-charcoal: #101010;
  --color-dark-gray: #606060;
  --color-medium-gray: #AAAAAA;
  --color-silver: #D0D0D0;
  --color-light-gray: #F1F1F1;
  --color-pale-gray: #F7F7F7;
  --color-white: #FFFFFF;

  /* Accent Colors - Taubenblau */
  --color-accent-primary: #7A9BA8;
  --color-accent-light: #A8C5D1;
  --color-accent-dark: #5A7B88;

  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-size-h1: 48px;
  --font-size-h2: 36px;
  --font-size-h3: 28px;
  --font-size-body: 16px;
  --font-size-small: 14px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 600;

  /* Spacing */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;

  /* Transitions */
  --transition-fast: 200ms cubic-bezier(0.11, 0.82, 0.39, 0.92);
  --transition-normal: 300ms cubic-bezier(0.11, 0.82, 0.39, 0.92);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15);
}

body {
  font-family: var(--font-family-base);
  background-color: var(--color-white);
  color: var(--color-charcoal);
  line-height: 1.5;
}
```

**Step 2: Create Button component**

Create `src/components/ui/Button.tsx`:

```typescript
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    />
  );
}
```

Create `src/components/ui/Button.module.css`:

```css
.button {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.button:focus {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* Primary variant */
.primary {
  background-color: var(--color-charcoal);
  color: var(--color-white);
}

.primary:hover {
  background-color: var(--color-black);
}

.primary:active {
  transform: scale(0.98);
}

/* Secondary variant */
.secondary {
  background-color: var(--color-light-gray);
  color: var(--color-charcoal);
  border: 1px solid var(--color-silver);
}

.secondary:hover {
  background-color: var(--color-pale-gray);
}

/* Ghost variant */
.ghost {
  background-color: transparent;
  color: var(--color-accent-primary);
}

.ghost:hover {
  background-color: var(--color-pale-gray);
}

/* Sizes */
.sm {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-small);
}

.md {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-body);
}

.lg {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-body);
}
```

**Step 3: Create Input component**

Create `src/components/ui/Input.tsx`:

```typescript
import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.error : ''}`} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
```

Create `src/components/ui/Input.module.css`:

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-charcoal);
}

.input {
  padding: var(--space-2) var(--space-2);
  border: 1px solid var(--color-silver);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-family: var(--font-family-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px rgba(122, 155, 168, 0.1);
}

.input.error {
  border-color: #dc2626;
}

.errorText {
  font-size: var(--font-size-small);
  color: #dc2626;
}
```

**Step 4: Create Card component**

Create `src/components/ui/Card.tsx`:

```typescript
import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}
```

Create `src/components/ui/Card.module.css`:

```css
.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-silver);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

**Step 5: Create BottomNavigation component**

Create `src/components/layout/BottomNavigation.tsx`:

```typescript
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './BottomNavigation.module.css';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Pläne', icon: '📋', path: '/plans' },
  { label: 'Berichte', icon: '📈', path: '/reports' },
  { label: 'Einstellungen', icon: '⚙️', path: '/settings' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`${styles.item} ${location.pathname === item.path ? styles.active : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

Create `src/components/layout/BottomNavigation.module.css`:

```css
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: var(--color-charcoal);
  border-top: 1px solid var(--color-silver);
  padding: var(--space-1) 0;
  gap: var(--space-2);
  z-index: 100;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: none;
  background: none;
  color: var(--color-silver);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.item:hover {
  color: var(--color-white);
}

.item.active {
  color: var(--color-accent-light);
}

.icon {
  font-size: 24px;
}

.label {
  font-weight: var(--font-weight-medium);
}
```

**Step 6: Create AppShell layout**

Create `src/components/layout/AppShell.tsx`:

```typescript
import React from 'react';
import { BottomNavigation } from './BottomNavigation';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <BottomNavigation />
    </div>
  );
}
```

Create `src/components/layout/AppShell.module.css`:

```css
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-white);
}

.main {
  flex: 1;
  padding: var(--space-4);
  padding-bottom: 120px; /* Space for bottom nav */
  overflow-y: auto;
}

@media (max-width: 640px) {
  .main {
    padding: var(--space-2);
    padding-bottom: 100px;
  }
}
```

**Step 7: Update Tailwind config**

Modify `tailwind.config.ts`:

```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'wb-black': '#000000',
        'wb-charcoal': '#101010',
        'wb-dark-gray': '#606060',
        'wb-medium-gray': '#AAAAAA',
        'wb-silver': '#D0D0D0',
        'wb-light-gray': '#F1F1F1',
        'wb-pale-gray': '#F7F7F7',
        'wb-white': '#FFFFFF',
        'wb-accent-primary': '#7A9BA8',
        'wb-accent-light': '#A8C5D1',
        'wb-accent-dark': '#5A7B88',
      },
      spacing: {
        'space-1': '8px',
        'space-2': '16px',
        'space-3': '24px',
        'space-4': '32px',
        'space-5': '40px',
        'space-6': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
      },
    },
  },
  plugins: [],
};
```

**Step 8: Commit**

```bash
git add src/styles src/components/ui src/components/layout tailwind.config.ts
git commit -m "design: create design system and component library with hinterbuchinger aesthetic"
```

---

### Task 3: Setup SQLite Database Layer

**Files:**
- Create: `src/lib/database.ts` (SQLite wrapper)
- Create: `src/lib/queries.ts` (SQL query builder)
- Modify: `electron/main.js` (add IPC handlers)

**Step 1: Create database wrapper**

Create `src/lib/database.ts`:

```typescript
import Database from 'better-sqlite3';
import path from 'path';

export interface TherapyType {
  id: string;
  name: string;
  price_per_session: number;
  variable_cost_per_session: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPlan {
  id: string;
  therapy_type_id: string;
  month: string;
  planned_sessions: number;
  actual_sessions: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: string;
  subcategory: string | null;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurrence_interval: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

let db: Database.Database | null = null;

export function initializeDatabase(dbPath: string): Database.Database {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getAllTherapyTypes(): TherapyType[] {
  const database = getDatabase();
  const stmt = database.prepare('SELECT * FROM therapy_types ORDER BY created_at DESC');
  return stmt.all() as TherapyType[];
}

export function createTherapyType(data: Omit<TherapyType, 'id' | 'created_at' | 'updated_at'>): TherapyType {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.price_per_session, data.variable_cost_per_session, now, now);

  return {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
}

export function getMonthlyPlans(month: string): MonthlyPlan[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM monthly_plans
    WHERE strftime('%Y-%m', month) = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(month.substring(0, 7)) as MonthlyPlan[];
}

export function createMonthlyPlan(data: Omit<MonthlyPlan, 'id' | 'created_at' | 'updated_at'>): MonthlyPlan {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.therapy_type_id,
    data.month,
    data.planned_sessions,
    data.actual_sessions,
    data.notes,
    now,
    now
  );

  return {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
}

export function getExpenses(month: string): Expense[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM expenses
    WHERE strftime('%Y-%m', expense_date) = ?
    ORDER BY expense_date DESC
  `);
  return stmt.all(month.substring(0, 7)) as Expense[];
}

export function createExpense(data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Expense {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.category,
    data.subcategory,
    data.amount,
    data.expense_date,
    data.is_recurring ? 1 : 0,
    data.recurrence_interval,
    data.description,
    now,
    now
  );

  return {
    id,
    ...data,
    created_at: now,
    updated_at: now,
  };
}
```

**Step 2: Add IPC handlers to main.js**

Modify `electron/main.js` to add these handlers before app.on('ready'):

```javascript
// IPC Handlers - Therapy Types
ipcMain.handle('therapy-types:list', async () => {
  return getAllTherapyTypes();
});

ipcMain.handle('therapy-types:create', async (event, data) => {
  return createTherapyType(data);
});

// IPC Handlers - Monthly Plans
ipcMain.handle('monthly-plans:list', async (event, month) => {
  return getMonthlyPlans(month);
});

ipcMain.handle('monthly-plans:create', async (event, data) => {
  return createMonthlyPlan(data);
});

// IPC Handlers - Expenses
ipcMain.handle('expenses:list', async (event, month) => {
  return getExpenses(month);
});

ipcMain.handle('expenses:create', async (event, data) => {
  return createExpense(data);
});
```

**Step 3: Commit**

```bash
git add src/lib/database.ts electron/main.js electron/preload.js
git commit -m "feat: setup SQLite database layer with IPC handlers"
```

---

## Phase 2: Core Features

### Task 4: Create Dashboard Page

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/pages/Dashboard.module.css`
- Create: `src/stores/dashboardStore.ts` (Zustand)

**Step 1: Create Zustand dashboard store**

Create `src/stores/dashboardStore.ts`:

```typescript
import { create } from 'zustand';

interface DashboardState {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;

  therapyTypes: any[];
  setTherapyTypes: (types: any[]) => void;

  monthlyPlans: any[];
  setMonthlyPlans: (plans: any[]) => void;

  expenses: any[];
  setExpenses: (expenses: any[]) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentMonth: new Date().toISOString().substring(0, 7),
  setCurrentMonth: (month) => set({ currentMonth: month }),

  therapyTypes: [],
  setTherapyTypes: (types) => set({ therapyTypes: types }),

  monthlyPlans: [],
  setMonthlyPlans: (plans) => set({ monthlyPlans: plans }),

  expenses: [],
  setExpenses: (expenses) => set({ expenses }),

  loading: false,
  setLoading: (loading) => set({ loading }),
}));
```

**Step 2: Create Dashboard component**

Create `src/pages/Dashboard.tsx`:

```typescript
import React, { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDashboardStore } from '../stores/dashboardStore';
import { useIpc } from '../hooks/useIpc';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const api = useIpc();
  const {
    currentMonth,
    setCurrentMonth,
    therapyTypes,
    setTherapyTypes,
    monthlyPlans,
    setMonthlyPlans,
    expenses,
    setExpenses,
    loading,
    setLoading,
  } = useDashboardStore();

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const [types, plans, expensesData] = await Promise.all([
        api.getTherapyTypes(),
        api.getMonthlyPlans(currentMonth),
        api.getExpenses(currentMonth),
      ]);

      setTherapyTypes(types);
      setMonthlyPlans(plans);
      setExpenses(expensesData);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = monthlyPlans.reduce((sum, plan) => {
    const therapyType = therapyTypes.find(t => t.id === plan.therapy_type_id);
    return sum + (plan.planned_sessions * (therapyType?.price_per_session || 0));
  }, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.monthSelector}>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className={styles.grid}>
            <Card>
              <h3>Geplante Einnahmen</h3>
              <p className={styles.amount}>€{totalRevenue.toFixed(2)}</p>
            </Card>
            <Card>
              <h3>Ausgaben</h3>
              <p className={styles.amount}>€{totalExpenses.toFixed(2)}</p>
            </Card>
            <Card>
              <h3>Nettoeinkommen</h3>
              <p className={`${styles.amount} ${netIncome > 0 ? styles.positive : styles.negative}`}>
                €{netIncome.toFixed(2)}
              </p>
            </Card>
          </div>

          <Card className={styles.therapyTypesCard}>
            <h2>Therapietypen ({therapyTypes.length})</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Preis</th>
                  <th>Variablekosten</th>
                  <th>Sitzungen</th>
                </tr>
              </thead>
              <tbody>
                {therapyTypes.map((type) => {
                  const sessions = monthlyPlans.filter(p => p.therapy_type_id === type.id);
                  return (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>€{type.price_per_session}</td>
                      <td>€{type.variable_cost_per_session}</td>
                      <td>{sessions.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
```

Create `src/pages/Dashboard.module.css`:

```css
.dashboard {
  padding: var(--space-4);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--color-charcoal);
}

.monthSelector input {
  padding: var(--space-2);
  border: 1px solid var(--color-silver);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.amount {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-primary);
  margin-top: var(--space-2);
}

.positive {
  color: #10b981;
}

.negative {
  color: #dc2626;
}

.therapyTypesCard {
  margin-top: var(--space-4);
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: var(--space-3);
}

.table th,
.table td {
  text-align: left;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-silver);
}

.table th {
  font-weight: var(--font-weight-bold);
  background-color: var(--color-pale-gray);
}

.table tr:hover {
  background-color: var(--color-pale-gray);
}
```

**Step 3: Update App.tsx router**

Modify `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Add other routes here */}
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
```

**Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/stores/dashboardStore.ts src/App.tsx
git commit -m "feat: create dashboard page with revenue/expense summary"
```

---

## Phase 3: Sync & Remote Database

### Task 5: Setup Remote Sync (All-inkl MariaDB)

**Files:**
- Create: `src/lib/sync.ts` (sync orchestration)
- Create: `src/lib/mariadb-api.ts` (remote API client)
- Create: `electron/sync-service.js` (background sync process)

**Step 1: Create MariaDB API client**

Create `src/lib/mariadb-api.ts`:

```typescript
import axios from 'axios';

interface RemoteSyncConfig {
  apiUrl: string;
  apiKey: string;
}

let config: RemoteSyncConfig | null = null;

export function setRemoteSyncConfig(newConfig: RemoteSyncConfig) {
  config = newConfig;
}

const client = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function syncTherapyTypesToRemote(therapyTypes: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/therapy-types/sync`, {
    apiKey: config.apiKey,
    data: therapyTypes,
  });
}

export async function syncMonthlyPlansToRemote(plans: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/monthly-plans/sync`, {
    apiKey: config.apiKey,
    data: plans,
  });
}

export async function syncExpensesToRemote(expenses: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/expenses/sync`, {
    apiKey: config.apiKey,
    data: expenses,
  });
}

export async function checkRemoteConnection() {
  if (!config) return false;

  try {
    await client.get(`${config.apiUrl}/health`, {
      headers: { 'X-API-Key': config.apiKey },
    });
    return true;
  } catch {
    return false;
  }
}
```

**Step 2: Create sync orchestrator**

Create `src/lib/sync.ts`:

```typescript
import { getDatabase } from './database';
import {
  syncTherapyTypesToRemote,
  syncMonthlyPlansToRemote,
  syncExpensesToRemote,
  checkRemoteConnection,
} from './mariadb-api';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  synced: boolean;
  error: string | null;
}

let syncStatus: SyncStatus = {
  isOnline: false,
  lastSyncTime: null,
  synced: false,
  error: null,
};

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export async function performSync(): Promise<SyncStatus> {
  try {
    // Check remote connection
    const isOnline = await checkRemoteConnection();
    syncStatus.isOnline = isOnline;

    if (!isOnline) {
      syncStatus.error = 'Remote server not available';
      syncStatus.synced = false;
      return syncStatus;
    }

    const db = getDatabase();

    // Sync therapy types
    const therapyTypes = db.prepare('SELECT * FROM therapy_types').all();
    await syncTherapyTypesToRemote(therapyTypes);

    // Sync monthly plans
    const monthlyPlans = db.prepare('SELECT * FROM monthly_plans').all();
    await syncMonthlyPlansToRemote(monthlyPlans);

    // Sync expenses
    const expenses = db.prepare('SELECT * FROM expenses').all();
    await syncExpensesToRemote(expenses);

    syncStatus.lastSyncTime = new Date().toISOString();
    syncStatus.synced = true;
    syncStatus.error = null;

    // Log sync event
    db.prepare(`
      INSERT INTO sync_log (table_name, operation, record_id, synced_to_remote)
      VALUES ('all', 'SYNC', ?, 1)
    `).run(new Date().toISOString());

    return syncStatus;
  } catch (error) {
    syncStatus.error = error instanceof Error ? error.message : 'Unknown sync error';
    syncStatus.synced = false;
    return syncStatus;
  }
}

export function startAutoSync(intervalMs: number = 300000) {
  // Sync every 5 minutes by default
  setInterval(() => {
    performSync().catch(err => console.error('Auto-sync error:', err));
  }, intervalMs);
}
```

**Step 3: Add sync IPC handlers**

Modify `electron/main.js` to add:

```javascript
import { performSync, getSyncStatus, startAutoSync } from '../src/lib/sync.js';

// Sync handlers
ipcMain.handle('sync:status', async () => {
  return getSyncStatus();
});

ipcMain.handle('sync:now', async () => {
  return performSync();
});

ipcMain.handle('sync:set-config', async (event, config) => {
  setRemoteSyncConfig(config);
  return { success: true };
});

// Start auto-sync when app launches
app.on('ready', () => {
  // ... existing code ...
  startAutoSync(300000); // 5 minutes
});
```

**Step 4: Commit**

```bash
git add src/lib/sync.ts src/lib/mariadb-api.ts electron/main.js
git commit -m "feat: setup remote sync with All-inkl MariaDB"
```

---

## Phase 4: Advanced Features & Polish

### Task 6: Reports & Export

**Files:**
- Create: `src/pages/Reports.tsx`
- Create: `src/lib/export.ts` (PDF/CSV export)

**Step 1: Create reports page**

Create `src/pages/Reports.tsx`:

```typescript
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useIpc } from '../hooks/useIpc';
import styles from './Reports.module.css';

export function Reports() {
  const api = useIpc();
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(false);

  async function generatePDF() {
    setLoading(true);
    try {
      await api.generateReport('pdf', { month });
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateCSV() {
    setLoading(true);
    try {
      await api.generateReport('csv', { month });
    } catch (error) {
      console.error('CSV generation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.reports}>
      <h1 className={styles.title}>Berichte</h1>

      <Card>
        <h2>Monatsbericht</h2>
        <div className={styles.form}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <div className={styles.actions}>
            <Button variant="primary" onClick={generatePDF} disabled={loading}>
              📄 PDF Exportieren
            </Button>
            <Button variant="secondary" onClick={generateCSV} disabled={loading}>
              📊 CSV Exportieren
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

**Step 2: Create export utility**

Create `src/lib/export.ts`:

```typescript
import { getDatabase } from './database';

export async function generateMonthlyReportPDF(month: string): Promise<Buffer> {
  const db = getDatabase();

  // Fetch data
  const therapyTypes = db.prepare('SELECT * FROM therapy_types').all();
  const monthlyPlans = db.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));
  const expenses = db.prepare(
    'SELECT * FROM expenses WHERE strftime("%Y-%m", expense_date) = ?'
  ).all(month.substring(0, 7));

  // Generate simple PDF (use pdfkit or similar in production)
  const reportHtml = `
    <html>
      <body>
        <h1>Monatsbericht ${month}</h1>
        <h2>Therapietypen: ${therapyTypes.length}</h2>
        <h2>Pläne: ${monthlyPlans.length}</h2>
        <h2>Ausgaben: €${expenses.reduce((s, e) => s + e.amount, 0)}</h2>
      </body>
    </html>
  `;

  return Buffer.from(reportHtml);
}

export async function generateMonthlyReportCSV(month: string): Promise<string> {
  const db = getDatabase();

  const therapyTypes = db.prepare('SELECT * FROM therapy_types').all();
  const monthlyPlans = db.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));

  let csv = 'Therapietype,Sitzungen,Preis,Einnahmen\n';

  therapyTypes.forEach((type: any) => {
    const sessions = monthlyPlans.filter((p: any) => p.therapy_type_id === type.id).length;
    const revenue = sessions * type.price_per_session;
    csv += `"${type.name}",${sessions},€${type.price_per_session},€${revenue}\n`;
  });

  return csv;
}
```

**Step 3: Commit**

```bash
git add src/pages/Reports.tsx src/lib/export.ts
git commit -m "feat: add reports and export functionality"
```

---

### Task 7: Settings & Configuration

**Files:**
- Create: `src/pages/Settings.tsx`
- Create: `src/stores/settingsStore.ts`

**Step 1: Create settings store**

Create `src/stores/settingsStore.ts`:

```typescript
import { create } from 'zustand';

interface SettingsState {
  remoteConfig: {
    apiUrl: string;
    apiKey: string;
  } | null;
  setRemoteConfig: (config: { apiUrl: string; apiKey: string }) => void;

  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;

  syncInterval: number;
  setSyncInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  remoteConfig: null,
  setRemoteConfig: (config) => set({ remoteConfig: config }),

  autoSyncEnabled: true,
  setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),

  syncInterval: 300000, // 5 minutes
  setSyncInterval: (interval) => set({ syncInterval: interval }),
}));
```

**Step 2: Create settings page**

Create `src/pages/Settings.tsx`:

```typescript
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSettingsStore } from '../stores/settingsStore';
import { useIpc } from '../hooks/useIpc';
import styles from './Settings.module.css';

export function Settings() {
  const api = useIpc();
  const { remoteConfig, setRemoteConfig, autoSyncEnabled, setAutoSyncEnabled } = useSettingsStore();
  const [apiUrl, setApiUrl] = useState(remoteConfig?.apiUrl || '');
  const [apiKey, setApiKey] = useState(remoteConfig?.apiKey || '');
  const [saving, setSaving] = useState(false);

  async function saveRemoteConfig() {
    setSaving(true);
    try {
      await api.setRemoteSyncConfig({
        apiUrl,
        apiKey,
      });
      setRemoteConfig({ apiUrl, apiKey });
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Einstellungen</h1>

      <Card>
        <h2>Remote-Synchronisierung</h2>
        <div className={styles.form}>
          <Input
            label="API-URL"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com"
          />
          <Input
            label="API-Schlüssel"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your API key"
          />
          <Button variant="primary" onClick={saveRemoteConfig} disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Auto-Sync</h2>
        <label>
          <input
            type="checkbox"
            checked={autoSyncEnabled}
            onChange={(e) => setAutoSyncEnabled(e.target.checked)}
          />
          Auto-Sync aktivieren
        </label>
      </Card>
    </div>
  );
}
```

Create `src/pages/Settings.module.css`:

```css
.settings {
  padding: var(--space-4);
}

.title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
```

**Step 3: Commit**

```bash
git add src/pages/Settings.tsx src/stores/settingsStore.ts
git commit -m "feat: add settings page for remote sync configuration"
```

---

## Phase 5: Testing & Quality

### Task 8: Add Unit Tests

**Files:**
- Create: `src/__tests__/database.test.ts`
- Create: `src/__tests__/sync.test.ts`
- Modify: `vitest.config.ts`

**Step 1: Setup Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 2: Write database tests**

Create `src/__tests__/database.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTherapyType, getAllTherapyTypes } from '../lib/database';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  // Setup schema
  db.exec(`
    CREATE TABLE therapy_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_per_session DECIMAL(10, 2) NOT NULL,
      variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);
});

describe('Database', () => {
  it('should create a therapy type', () => {
    const therapyType = createTherapyType({
      name: 'Test Therapy',
      price_per_session: 100,
      variable_cost_per_session: 10,
    });

    expect(therapyType.name).toBe('Test Therapy');
    expect(therapyType.price_per_session).toBe(100);
  });

  it('should retrieve all therapy types', () => {
    createTherapyType({
      name: 'Therapy 1',
      price_per_session: 100,
      variable_cost_per_session: 10,
    });

    const types = getAllTherapyTypes();
    expect(types.length).toBeGreaterThan(0);
  });
});
```

**Step 3: Run tests**

Run: `pnpm test`
Expected: Tests pass

**Step 4: Commit**

```bash
git add vitest.config.ts src/__tests__/database.test.ts
git commit -m "test: add unit tests for database layer"
```

---

## Phase 6: Build & Deployment

### Task 9: Build Electron App for macOS

**Files:**
- Modify: `package.json` (add build scripts)
- Create: `electron-builder.json`

**Step 1: Install build tools**

Run: `pnpm add -D electron-builder`
Expected: electron-builder installs

**Step 2: Create build config**

Create `electron-builder.json`:

```json
{
  "appId": "com.wirtschaftlichkeitsplan.app",
  "productName": "Wirtschaftlichkeitsplan",
  "directories": {
    "buildResources": "assets",
    "output": "dist"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.business"
  },
  "files": [
    "dist-electron/**/*",
    "dist/**/*",
    "node_modules/**/*",
    "package.json"
  ]
}
```

**Step 3: Update package.json build script**

```json
{
  "scripts": {
    "build": "vite build && vite build -c vite.config.electron.js",
    "build:app": "pnpm run build && electron-builder"
  }
}
```

**Step 4: Commit**

```bash
git add package.json electron-builder.json
git commit -m "build: add Electron app builder configuration"
```

---

## Summary

**Total tasks:** 9
**Estimated timeline:** 40-60 hours of development
**Key deliverables:**

✅ Electron app with React UI + IPC architecture
✅ SQLite database with all migrated data (6 therapy types, 119 plans, 9 expenses)
✅ Remote sync to All-inkl MariaDB
✅ Dashboard with revenue/expense tracking
✅ Reports & CSV/PDF export
✅ Settings for remote configuration
✅ Unit tests
✅ macOS build ready

**Next steps after implementation:**
1. Test on actual MacBook
2. Setup All-inkl API endpoints for sync
3. Deploy & distribute app

---

**Plan saved to:** `docs/plans/2025-02-08-electron-app-implementation.md`

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach would you prefer?