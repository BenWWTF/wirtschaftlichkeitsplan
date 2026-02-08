#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * Migrate exported Supabase data to SQLite
 * Removes user_id since this is a local-only app
 */

function main() {
  // Find the export file
  const exportsDir = path.join('scripts', 'exports');
  const files = fs.readdirSync(exportsDir).filter(f => f.startsWith('export-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No export files found in scripts/exports/');
    process.exit(1);
  }

  const latestExport = files.sort().pop();
  const exportPath = path.join(exportsDir, latestExport);

  console.log(`📂 Loading export: ${latestExport}\n`);

  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  // Create/open SQLite database
  const dbPath = path.resolve('wirtschaftlichkeitsplan.db');
  console.log(`💾 Creating SQLite database at: ${dbPath}\n`);

  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  try {
    // Create tables
    console.log('📋 Creating tables...');

    db.exec(`
      CREATE TABLE IF NOT EXISTS therapy_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_per_session DECIMAL(10, 2) NOT NULL CHECK (price_per_session > 0),
        variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (variable_cost_per_session >= 0),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE TABLE IF NOT EXISTS monthly_plans (
        id TEXT PRIMARY KEY,
        therapy_type_id TEXT NOT NULL,
        month DATE NOT NULL,
        planned_sessions INTEGER NOT NULL CHECK (planned_sessions > 0),
        actual_sessions INTEGER CHECK (actual_sessions >= 0),
        notes TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (therapy_type_id) REFERENCES therapy_types(id) ON DELETE CASCADE,
        UNIQUE(therapy_type_id, month)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        subcategory TEXT,
        amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
        expense_date DATE NOT NULL,
        is_recurring BOOLEAN NOT NULL DEFAULT 0,
        recurrence_interval TEXT CHECK (recurrence_interval IN ('monthly', 'quarterly', 'yearly')),
        description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE TABLE IF NOT EXISTS practice_settings (
        id TEXT PRIMARY KEY,
        practice_name TEXT NOT NULL,
        practice_type TEXT NOT NULL DEFAULT 'mixed' CHECK (practice_type IN ('kassenarzt', 'wahlarzt', 'mixed')),
        monthly_fixed_costs DECIMAL(10, 2) NOT NULL DEFAULT 8000 CHECK (monthly_fixed_costs >= 0),
        average_variable_cost_per_session DECIMAL(10, 2) NOT NULL DEFAULT 20 CHECK (average_variable_cost_per_session >= 0),
        expected_growth_rate DECIMAL(5, 2) NOT NULL DEFAULT 5 CHECK (expected_growth_rate >= -100 AND expected_growth_rate <= 1000),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_therapy_types_created ON therapy_types(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_monthly_plans_month ON monthly_plans(month DESC);
      CREATE INDEX IF NOT EXISTS idx_monthly_plans_therapy_type ON monthly_plans(therapy_type_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    `);

    console.log('✅ Tables created\n');

    // Insert therapy types
    console.log('📝 Inserting therapy types...');
    const therapyStmt = db.prepare(`
      INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const therapyTransaction = db.transaction((types) => {
      types.forEach(t => {
        therapyStmt.run(t.id, t.name, t.price_per_session, t.variable_cost_per_session, t.created_at, t.updated_at);
      });
    });

    therapyTransaction(exportData.therapyTypes);
    console.log(`✅ Inserted ${exportData.therapyTypes.length} therapy types\n`);

    // Insert monthly plans
    console.log('📝 Inserting monthly plans...');
    const plansStmt = db.prepare(`
      INSERT INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const plansTransaction = db.transaction((plans) => {
      plans.forEach(p => {
        plansStmt.run(
          p.id,
          p.therapy_type_id,
          p.month,
          p.planned_sessions,
          p.actual_sessions,
          p.notes,
          p.created_at,
          p.updated_at
        );
      });
    });

    plansTransaction(exportData.monthlyPlans);
    console.log(`✅ Inserted ${exportData.monthlyPlans.length} monthly plans\n`);

    // Insert expenses
    console.log('📝 Inserting expenses...');
    const expensesStmt = db.prepare(`
      INSERT INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const expensesTransaction = db.transaction((expenses) => {
      expenses.forEach(e => {
        expensesStmt.run(
          e.id,
          e.category,
          e.subcategory,
          e.amount,
          e.expense_date,
          e.is_recurring ? 1 : 0,
          e.recurrence_interval,
          e.description,
          e.created_at,
          e.updated_at
        );
      });
    });

    expensesTransaction(exportData.expenses);
    console.log(`✅ Inserted ${exportData.expenses.length} expenses\n`);

    // Insert practice settings
    console.log('📝 Inserting practice settings...');
    const settingsStmt = db.prepare(`
      INSERT INTO practice_settings (id, practice_name, practice_type, monthly_fixed_costs, average_variable_cost_per_session, expected_growth_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    exportData.practiceSettings.forEach(s => {
      settingsStmt.run(
        s.id,
        s.practice_name,
        s.practice_type,
        s.monthly_fixed_costs,
        s.average_variable_cost_per_session,
        s.expected_growth_rate,
        s.created_at,
        s.updated_at
      );
    });

    console.log(`✅ Inserted ${exportData.practiceSettings.length} practice settings\n`);

    // Verify data
    console.log('🔍 Verifying data...\n');
    const counts = {
      therapyTypes: db.prepare('SELECT COUNT(*) as count FROM therapy_types').get().count,
      monthlyPlans: db.prepare('SELECT COUNT(*) as count FROM monthly_plans').get().count,
      expenses: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count,
      practiceSettings: db.prepare('SELECT COUNT(*) as count FROM practice_settings').get().count,
    };

    console.log('📊 Final counts:');
    console.log(`   - Therapy Types: ${counts.therapyTypes}`);
    console.log(`   - Monthly Plans: ${counts.monthlyPlans}`);
    console.log(`   - Expenses: ${counts.expenses}`);
    console.log(`   - Practice Settings: ${counts.practiceSettings}\n`);

    console.log(`✨ Migration complete! Database ready at: ${dbPath}\n`);

    db.close();

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    db.close();
    process.exit(1);
  }
}

main();
