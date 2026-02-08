import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

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

export function initializeDatabase(dbPath?: string): Database.Database {
  const finalPath = dbPath || path.join(app.getPath('userData'), 'wirtschaftlichkeitsplan.db');
  db = new Database(finalPath);
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

// Therapy Types
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

export function updateTherapyType(id: string, data: Partial<Omit<TherapyType, 'id' | 'created_at' | 'updated_at'>>): TherapyType {
  const database = getDatabase();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    UPDATE therapy_types
    SET name = COALESCE(?, name),
        price_per_session = COALESCE(?, price_per_session),
        variable_cost_per_session = COALESCE(?, variable_cost_per_session),
        updated_at = ?
    WHERE id = ?
    RETURNING *
  `);

  const result = stmt.get(
    data.name || null,
    data.price_per_session || null,
    data.variable_cost_per_session || null,
    now,
    id
  ) as TherapyType;

  return result;
}

export function deleteTherapyType(id: string): void {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM therapy_types WHERE id = ?');
  stmt.run(id);
}

// Monthly Plans
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

export function updateMonthlyPlan(id: string, data: Partial<Omit<MonthlyPlan, 'id' | 'created_at' | 'updated_at'>>): MonthlyPlan {
  const database = getDatabase();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    UPDATE monthly_plans
    SET planned_sessions = COALESCE(?, planned_sessions),
        actual_sessions = COALESCE(?, actual_sessions),
        notes = COALESCE(?, notes),
        updated_at = ?
    WHERE id = ?
    RETURNING *
  `);

  const result = stmt.get(
    data.planned_sessions || null,
    data.actual_sessions !== undefined ? data.actual_sessions : null,
    data.notes || null,
    now,
    id
  ) as MonthlyPlan;

  return result;
}

export function deleteMonthlyPlan(id: string): void {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM monthly_plans WHERE id = ?');
  stmt.run(id);
}

// Expenses
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

export function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>): Expense {
  const database = getDatabase();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    UPDATE expenses
    SET category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        amount = COALESCE(?, amount),
        expense_date = COALESCE(?, expense_date),
        is_recurring = COALESCE(?, is_recurring),
        recurrence_interval = COALESCE(?, recurrence_interval),
        description = COALESCE(?, description),
        updated_at = ?
    WHERE id = ?
    RETURNING *
  `);

  const result = stmt.get(
    data.category || null,
    data.subcategory || null,
    data.amount || null,
    data.expense_date || null,
    data.is_recurring !== undefined ? (data.is_recurring ? 1 : 0) : null,
    data.recurrence_interval || null,
    data.description || null,
    now,
    id
  ) as Expense;

  return result;
}

export function deleteExpense(id: string): void {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM expenses WHERE id = ?');
  stmt.run(id);
}

// Query helpers
export function getMonthlySummary(month: string) {
  const database = getDatabase();
  const monthStr = month.substring(0, 7);

  const therapyTypes = database.prepare('SELECT * FROM therapy_types').all() as TherapyType[];
  const monthlyPlans = database.prepare(
    `SELECT * FROM monthly_plans WHERE strftime('%Y-%m', month) = ?`
  ).all(monthStr) as MonthlyPlan[];
  const expenses = database.prepare(
    `SELECT * FROM expenses WHERE strftime('%Y-%m', expense_date) = ?`
  ).all(monthStr) as Expense[];

  let plannedRevenue = 0;
  let actualRevenue = 0;

  monthlyPlans.forEach((plan) => {
    const therapyType = therapyTypes.find(t => t.id === plan.therapy_type_id);
    if (therapyType) {
      plannedRevenue += plan.planned_sessions * therapyType.price_per_session;
      if (plan.actual_sessions) {
        actualRevenue += plan.actual_sessions * therapyType.price_per_session;
      }
    }
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return {
    month: monthStr,
    plannedRevenue,
    actualRevenue,
    totalExpenses,
    netIncomeePlanned: plannedRevenue - totalExpenses,
    netIncomeActual: actualRevenue - totalExpenses,
  };
}
