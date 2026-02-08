import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Database operation tests with in-memory SQLite
describe('Database Operations', () => {
  let db: Database.Database;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables matching the production schema
    db.exec(`
      CREATE TABLE therapy_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_session DECIMAL(10, 2) NOT NULL,
        variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE TABLE monthly_plans (
        id TEXT PRIMARY KEY,
        therapy_type_id TEXT NOT NULL,
        month TEXT NOT NULL,
        planned_sessions INTEGER NOT NULL,
        actual_sessions INTEGER,
        notes TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (therapy_type_id) REFERENCES therapy_types(id)
      );

      CREATE TABLE expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        subcategory TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        expense_date TEXT NOT NULL,
        is_recurring BOOLEAN NOT NULL DEFAULT 0,
        recurrence_interval TEXT,
        description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE TABLE sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        record_id TEXT,
        synced_to_remote BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it('should insert and retrieve therapy types', () => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, 'Test Therapy', 100, 10, now, now);

    const result = db.prepare('SELECT * FROM therapy_types WHERE id = ?').get(id) as any;

    expect(result).toBeDefined();
    expect(result.name).toBe('Test Therapy');
    expect(result.price_per_session).toBe(100);
    expect(result.variable_cost_per_session).toBe(10);
  });

  it('should retrieve therapy types ordered by creation date', () => {
    const now1 = new Date(Date.now() - 1000).toISOString();
    const now2 = new Date().toISOString();

    db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'Therapy 1', 100, 10, now1, now1);

    db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'Therapy 2', 120, 15, now2, now2);

    const results = db.prepare('SELECT * FROM therapy_types ORDER BY created_at DESC').all() as any[];

    expect(results.length).toBe(2);
    expect(results[0].name).toBe('Therapy 2');
    expect(results[1].name).toBe('Therapy 1');
  });

  it('should insert and retrieve monthly plans', () => {
    const therapyTypeId = crypto.randomUUID();
    const planId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert therapy type first
    db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(therapyTypeId, 'Test Therapy', 100, 10, now, now);

    // Insert plan
    db.prepare(`
      INSERT INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(planId, therapyTypeId, '2024-01', 4, null, 'Test plan', now, now);

    const result = db.prepare('SELECT * FROM monthly_plans WHERE id = ?').get(planId) as any;

    expect(result).toBeDefined();
    expect(result.therapy_type_id).toBe(therapyTypeId);
    expect(result.planned_sessions).toBe(4);
  });

  it('should filter monthly plans by month', () => {
    const therapyTypeId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(therapyTypeId, 'Test Therapy', 100, 10, now, now);

    db.prepare(`
      INSERT INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), therapyTypeId, '2024-01', 4, null, null, now, now);

    db.prepare(`
      INSERT INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), therapyTypeId, '2024-02', 5, null, null, now, now);

    const jan_plans = db.prepare('SELECT * FROM monthly_plans WHERE month LIKE ?').all('2024-01%') as any[];
    const feb_plans = db.prepare('SELECT * FROM monthly_plans WHERE month LIKE ?').all('2024-02%') as any[];

    expect(jan_plans.length).toBe(1);
    expect(feb_plans.length).toBe(1);
  });

  it('should insert and retrieve expenses', () => {
    const expenseId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(expenseId, 'Miete', 'Praxisraum', 500, '2024-01-15', 1, 'monthly', 'Monthly rent', now, now);

    const result = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId) as any;

    expect(result).toBeDefined();
    expect(result.category).toBe('Miete');
    expect(result.amount).toBe(500);
    expect(result.is_recurring).toBe(1);
  });

  it('should filter expenses by month', () => {
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'Miete', null, 500, '2024-01-15', 0, null, null, now, now);

    db.prepare(`
      INSERT INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'Versicherung', null, 100, '2024-02-15', 0, null, null, now, now);

    const jan_expenses = db.prepare('SELECT * FROM expenses WHERE expense_date LIKE ?').all('2024-01%') as any[];
    const feb_expenses = db.prepare('SELECT * FROM expenses WHERE expense_date LIKE ?').all('2024-02%') as any[];

    expect(jan_expenses.length).toBe(1);
    expect(feb_expenses.length).toBe(1);
  });
});
