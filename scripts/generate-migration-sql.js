#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate SQL INSERT statements from Supabase export JSON
 * Creates a migration file that can be imported into SQLite or MariaDB
 */

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str.toString();
  if (typeof str === 'boolean') return str ? '1' : '0';
  return "'" + str.toString().replace(/'/g, "''") + "'";
}

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

  let sql = '';

  // Header
  sql += '-- Wirtschaftlichkeitsplan Data Migration\n';
  sql += `-- Generated from export: ${latestExport}\n`;
  sql += `-- Date: ${new Date().toISOString()}\n\n`;

  // Therapy Types
  sql += '-- INSERT Therapy Types\n';
  sql += 'INSERT OR IGNORE INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at) VALUES\n';
  sql += exportData.therapyTypes.map(t =>
    `(${escapeSQL(t.id)}, ${escapeSQL(t.name)}, ${t.price_per_session}, ${t.variable_cost_per_session}, ${escapeSQL(t.created_at)}, ${escapeSQL(t.updated_at)})`
  ).join(',\n') + ';\n\n';

  // Monthly Plans
  sql += '-- INSERT Monthly Plans\n';
  sql += 'INSERT OR IGNORE INTO monthly_plans (id, therapy_type_id, month, planned_sessions, actual_sessions, notes, created_at, updated_at) VALUES\n';
  sql += exportData.monthlyPlans.map(p =>
    `(${escapeSQL(p.id)}, ${escapeSQL(p.therapy_type_id)}, ${escapeSQL(p.month)}, ${p.planned_sessions}, ${p.actual_sessions !== null ? p.actual_sessions : 'NULL'}, ${p.notes ? escapeSQL(p.notes) : 'NULL'}, ${escapeSQL(p.created_at)}, ${escapeSQL(p.updated_at)})`
  ).join(',\n') + ';\n\n';

  // Expenses
  sql += '-- INSERT Expenses\n';
  sql += 'INSERT OR IGNORE INTO expenses (id, category, subcategory, amount, expense_date, is_recurring, recurrence_interval, description, created_at, updated_at) VALUES\n';
  sql += exportData.expenses.map(e =>
    `(${escapeSQL(e.id)}, ${escapeSQL(e.category)}, ${e.subcategory ? escapeSQL(e.subcategory) : 'NULL'}, ${e.amount}, ${escapeSQL(e.expense_date)}, ${e.is_recurring ? 1 : 0}, ${e.recurrence_interval ? escapeSQL(e.recurrence_interval) : 'NULL'}, ${e.description ? escapeSQL(e.description) : 'NULL'}, ${escapeSQL(e.created_at)}, ${escapeSQL(e.updated_at)})`
  ).join(',\n') + ';\n\n';

  // Practice Settings
  sql += '-- INSERT Practice Settings\n';
  sql += 'INSERT OR IGNORE INTO practice_settings (id, practice_name, practice_type, monthly_fixed_costs, average_variable_cost_per_session, expected_growth_rate, created_at, updated_at) VALUES\n';
  sql += exportData.practiceSettings.map(s =>
    `(${escapeSQL(s.id)}, ${escapeSQL(s.practice_name)}, ${escapeSQL(s.practice_type)}, ${s.monthly_fixed_costs}, ${s.average_variable_cost_per_session}, ${s.expected_growth_rate}, ${escapeSQL(s.created_at)}, ${escapeSQL(s.updated_at)})`
  ).join(',\n') + ';\n\n';

  // Summary
  sql += '-- Data Migration Summary\n';
  sql += `-- Therapy Types: ${exportData.therapyTypes.length}\n`;
  sql += `-- Monthly Plans: ${exportData.monthlyPlans.length}\n`;
  sql += `-- Expenses: ${exportData.expenses.length}\n`;
  sql += `-- Practice Settings: ${exportData.practiceSettings.length}\n`;

  // Save to file
  const migrationFilename = `migration-${Date.now()}.sql`;
  const migrationPath = path.join('scripts', 'migrations', migrationFilename);

  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join('scripts', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  fs.writeFileSync(migrationPath, sql);

  console.log('✅ SQL migration generated!\n');
  console.log('📊 Summary:');
  console.log(`   - Therapy Types: ${exportData.therapyTypes.length}`);
  console.log(`   - Monthly Plans: ${exportData.monthlyPlans.length}`);
  console.log(`   - Expenses: ${exportData.expenses.length}`);
  console.log(`   - Practice Settings: ${exportData.practiceSettings.length}\n`);
  console.log(`💾 File saved to: ${migrationPath}\n`);

  console.log('📝 Next steps:\n');
  console.log('1. For SQLite locally:\n');
  console.log('   sqlite3 wirtschaftlichkeitsplan.db < ' + migrationPath + '\n');
  console.log('2. For MariaDB on All-inkl:\n');
  console.log('   mysql -h <host> -u <user> -p <db> < ' + migrationPath + '\n');
}

main();
