-- wirtschaftlichkeitsplan SQLite Schema
-- Local-only version (no user_id)

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

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT NOT NULL,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_to_remote BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_therapy_types_created ON therapy_types(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month ON monthly_plans(month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_therapy_type ON monthly_plans(therapy_type_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced_to_remote);
