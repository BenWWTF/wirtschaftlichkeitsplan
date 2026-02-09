"use strict";
const electron = require("electron");
const path = require("path");
const url = require("url");
const Database = require("better-sqlite3");
const axios = require("axios");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
let db = null;
function initializeDatabase(dbPath) {
  const finalPath = dbPath || path__namespace.join(electron.app.getPath("userData"), "wirtschaftlichkeitsplan.db");
  db = new Database(finalPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS therapy_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_per_session REAL NOT NULL,
      variable_cost_per_session REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_plans (
      id TEXT PRIMARY KEY,
      therapy_type_id TEXT NOT NULL,
      month TEXT NOT NULL,
      planned_sessions INTEGER NOT NULL,
      actual_sessions INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (therapy_type_id) REFERENCES therapy_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      is_recurring BOOLEAN NOT NULL DEFAULT 0,
      recurrence_interval TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_monthly_plans_month ON monthly_plans(month);
    CREATE INDEX IF NOT EXISTS idx_monthly_plans_therapy_type ON monthly_plans(therapy_type_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);
  return db;
}
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
function getAllTherapyTypes() {
  const database = getDatabase();
  const stmt = database.prepare("SELECT * FROM therapy_types ORDER BY created_at DESC");
  return stmt.all();
}
function createTherapyType(data) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const stmt = database.prepare(`
    INSERT INTO therapy_types (id, name, price_per_session, variable_cost_per_session, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.name, data.price_per_session, data.variable_cost_per_session, now, now);
  return {
    id,
    ...data,
    created_at: now,
    updated_at: now
  };
}
function updateTherapyType(id, data) {
  const database = getDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
  );
  return result;
}
function deleteTherapyType(id) {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM therapy_types WHERE id = ?");
  stmt.run(id);
}
function getMonthlyPlans(month) {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM monthly_plans
    WHERE strftime('%Y-%m', month) = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(month.substring(0, 7));
}
function createMonthlyPlan(data) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    updated_at: now
  };
}
function updateMonthlyPlan(id, data) {
  const database = getDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    data.actual_sessions !== void 0 ? data.actual_sessions : null,
    data.notes || null,
    now,
    id
  );
  return result;
}
function deleteMonthlyPlan(id) {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM monthly_plans WHERE id = ?");
  stmt.run(id);
}
function getExpenses(month) {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM expenses
    WHERE strftime('%Y-%m', expense_date) = ?
    ORDER BY expense_date DESC
  `);
  return stmt.all(month.substring(0, 7));
}
function createExpense(data) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    updated_at: now
  };
}
function updateExpense(id, data) {
  const database = getDatabase();
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    data.is_recurring !== void 0 ? data.is_recurring ? 1 : 0 : null,
    data.recurrence_interval || null,
    data.description || null,
    now,
    id
  );
  return result;
}
function deleteExpense(id) {
  const database = getDatabase();
  const stmt = database.prepare("DELETE FROM expenses WHERE id = ?");
  stmt.run(id);
}
function getMonthlySummary(month) {
  const database = getDatabase();
  const monthStr = month.substring(0, 7);
  const therapyTypes = database.prepare("SELECT * FROM therapy_types").all();
  const monthlyPlans = database.prepare(
    `SELECT * FROM monthly_plans WHERE strftime('%Y-%m', month) = ?`
  ).all(monthStr);
  const expenses = database.prepare(
    `SELECT * FROM expenses WHERE strftime('%Y-%m', expense_date) = ?`
  ).all(monthStr);
  let plannedRevenue = 0;
  let actualRevenue = 0;
  monthlyPlans.forEach((plan) => {
    const therapyType = therapyTypes.find((t) => t.id === plan.therapy_type_id);
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
    netIncomeActual: actualRevenue - totalExpenses
  };
}
let config = null;
function setRemoteSyncConfig(newConfig) {
  config = newConfig;
}
const client = axios.create({
  timeout: 1e4,
  headers: {
    "Content-Type": "application/json"
  }
});
async function syncTherapyTypesToRemote(therapyTypes) {
  if (!config) throw new Error("Remote sync not configured");
  return client.post(`${config.apiUrl}/therapy-types/sync`, {
    apiKey: config.apiKey,
    data: therapyTypes
  });
}
async function syncMonthlyPlansToRemote(plans) {
  if (!config) throw new Error("Remote sync not configured");
  return client.post(`${config.apiUrl}/monthly-plans/sync`, {
    apiKey: config.apiKey,
    data: plans
  });
}
async function syncExpensesToRemote(expenses) {
  if (!config) throw new Error("Remote sync not configured");
  return client.post(`${config.apiUrl}/expenses/sync`, {
    apiKey: config.apiKey,
    data: expenses
  });
}
async function checkRemoteConnection() {
  if (!config) return false;
  try {
    await client.get(`${config.apiUrl}/health`, {
      headers: { "X-API-Key": config.apiKey }
    });
    return true;
  } catch {
    return false;
  }
}
let syncStatus = {
  isOnline: false,
  lastSyncTime: null,
  synced: false,
  error: null
};
function getSyncStatus() {
  return syncStatus;
}
async function performSync() {
  try {
    const isOnline = await checkRemoteConnection();
    syncStatus.isOnline = isOnline;
    if (!isOnline) {
      syncStatus.error = "Remote server not available";
      syncStatus.synced = false;
      return syncStatus;
    }
    const db2 = getDatabase();
    const therapyTypes = db2.prepare("SELECT * FROM therapy_types").all();
    await syncTherapyTypesToRemote(therapyTypes);
    const monthlyPlans = db2.prepare("SELECT * FROM monthly_plans").all();
    await syncMonthlyPlansToRemote(monthlyPlans);
    const expenses = db2.prepare("SELECT * FROM expenses").all();
    await syncExpensesToRemote(expenses);
    syncStatus.lastSyncTime = (/* @__PURE__ */ new Date()).toISOString();
    syncStatus.synced = true;
    syncStatus.error = null;
    db2.prepare(`
      INSERT INTO sync_log (table_name, operation, record_id, synced_to_remote)
      VALUES ('all', 'SYNC', ?, 1)
    `).run((/* @__PURE__ */ new Date()).toISOString());
    return syncStatus;
  } catch (error) {
    syncStatus.error = error instanceof Error ? error.message : "Unknown sync error";
    syncStatus.synced = false;
    return syncStatus;
  }
}
function startAutoSync(intervalMs = 3e5) {
  setInterval(() => {
    performSync().catch((err) => console.error("Auto-sync error:", err));
  }, intervalMs);
}
async function generateMonthlyReportPDF(month) {
  const db2 = getDatabase();
  const therapyTypes = db2.prepare("SELECT * FROM therapy_types").all();
  const monthlyPlans = db2.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));
  const expenses = db2.prepare(
    'SELECT * FROM expenses WHERE strftime("%Y-%m", expense_date) = ?'
  ).all(month.substring(0, 7));
  const totalRevenue = monthlyPlans.reduce((sum, plan) => {
    const therapyType = therapyTypes.find((t) => t.id === plan.therapy_type_id);
    return sum + plan.planned_sessions * ((therapyType == null ? void 0 : therapyType.price_per_session) || 0);
  }, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const reportHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #101010; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #D0D0D0; }
          th { background-color: #F1F1F1; font-weight: bold; }
          .summary { margin: 20px 0; }
          .summary-item { margin: 10px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>Monatsbericht ${month}</h1>

        <div class="summary">
          <h2>Zusammenfassung</h2>
          <div class="summary-item"><strong>Geplante Einnahmen:</strong> €${totalRevenue.toFixed(2)}</div>
          <div class="summary-item"><strong>Ausgaben:</strong> €${totalExpenses.toFixed(2)}</div>
          <div class="summary-item"><strong>Nettoeinkommen:</strong> €${netIncome.toFixed(2)}</div>
        </div>

        <h2>Therapietypen (${therapyTypes.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Preis pro Sitzung</th>
              <th>Variablekosten</th>
              <th>Sitzungen</th>
            </tr>
          </thead>
          <tbody>
            ${therapyTypes.map((type) => {
    const sessions = monthlyPlans.filter((p) => p.therapy_type_id === type.id).length;
    return `
                <tr>
                  <td>${type.name}</td>
                  <td>€${type.price_per_session.toFixed(2)}</td>
                  <td>€${type.variable_cost_per_session.toFixed(2)}</td>
                  <td>${sessions}</td>
                </tr>
              `;
  }).join("")}
          </tbody>
        </table>

        <h2>Ausgaben (${expenses.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th>Betrag</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((exp) => `
              <tr>
                <td>${exp.category}</td>
                <td>€${exp.amount.toFixed(2)}</td>
                <td>${exp.description || "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
  return Buffer.from(reportHtml);
}
async function generateMonthlyReportCSV(month) {
  const db2 = getDatabase();
  const therapyTypes = db2.prepare("SELECT * FROM therapy_types").all();
  const monthlyPlans = db2.prepare(
    'SELECT * FROM monthly_plans WHERE strftime("%Y-%m", month) = ?'
  ).all(month.substring(0, 7));
  let csv = "Therapietype,Sitzungen,Preis,Einnahmen\n";
  therapyTypes.forEach((type) => {
    const sessions = monthlyPlans.filter((p) => p.therapy_type_id === type.id).length;
    const revenue = sessions * type.price_per_session;
    csv += `"${type.name}",${sessions},€${type.price_per_session.toFixed(2)},€${revenue.toFixed(2)}
`;
  });
  return csv;
}
var define_process_env_default = {};
let __dirname$1;
try {
  __dirname$1 = path.dirname(url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.cjs", document.baseURI).href));
} catch (e) {
  __dirname$1 = path.dirname(process.argv[1]);
}
let mainWindow;
function createWindow() {
  const preloadPath = path.join(__dirname$1, "preload.cjs");
  console.log("[Electron] __dirname:", __dirname$1);
  console.log("[Electron] preload path:", preloadPath);
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });
  const isDev = define_process_env_default.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(define_process_env_default.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
electron.app.on("ready", () => {
  const dbPath = path.join(electron.app.getPath("userData"), "wirtschaftlichkeitsplan.db");
  initializeDatabase(dbPath);
  createWindow();
  startAutoSync(3e5);
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.handle("therapy-types:list", async () => {
  return getAllTherapyTypes();
});
electron.ipcMain.handle("therapy-types:create", async (event, data) => {
  return createTherapyType(data);
});
electron.ipcMain.handle("therapy-types:update", async (event, { id, data }) => {
  return updateTherapyType(id, data);
});
electron.ipcMain.handle("therapy-types:delete", async (event, id) => {
  return deleteTherapyType(id);
});
electron.ipcMain.handle("monthly-plans:list", async (event, month) => {
  return getMonthlyPlans(month);
});
electron.ipcMain.handle("monthly-plans:create", async (event, data) => {
  return createMonthlyPlan(data);
});
electron.ipcMain.handle("monthly-plans:update", async (event, { id, data }) => {
  return updateMonthlyPlan(id, data);
});
electron.ipcMain.handle("monthly-plans:delete", async (event, id) => {
  return deleteMonthlyPlan(id);
});
electron.ipcMain.handle("expenses:list", async (event, month) => {
  return getExpenses(month);
});
electron.ipcMain.handle("expenses:create", async (event, data) => {
  return createExpense(data);
});
electron.ipcMain.handle("expenses:update", async (event, { id, data }) => {
  return updateExpense(id, data);
});
electron.ipcMain.handle("expenses:delete", async (event, id) => {
  return deleteExpense(id);
});
electron.ipcMain.handle("summary:monthly", async (event, month) => {
  return getMonthlySummary(month);
});
electron.ipcMain.handle("sync:status", async () => {
  return getSyncStatus();
});
electron.ipcMain.handle("sync:now", async () => {
  return performSync();
});
electron.ipcMain.handle("sync:set-config", async (event, config2) => {
  setRemoteSyncConfig(config2);
  return { success: true };
});
electron.ipcMain.handle("reports:generate", async (event, { type, params }) => {
  if (type === "pdf") {
    const buffer = await generateMonthlyReportPDF(params.month);
    return buffer.toString("base64");
  } else if (type === "csv") {
    return await generateMonthlyReportCSV(params.month);
  }
  throw new Error(`Unknown report type: ${type}`);
});
