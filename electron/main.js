import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import {
  initializeDatabase,
  getDatabase,
  getAllTherapyTypes,
  createTherapyType,
  updateTherapyType,
  deleteTherapyType,
  getMonthlyPlans,
  createMonthlyPlan,
  updateMonthlyPlan,
  deleteMonthlyPlan,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
} from '../src/lib/database.js';
import {
  performSync,
  getSyncStatus,
  startAutoSync,
} from '../src/lib/sync.js';
import {
  setRemoteSyncConfig,
} from '../src/lib/mariadb-api.js';

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
  db = initializeDatabase(dbPath);

  createWindow();

  // Start auto-sync (5 minutes)
  startAutoSync(300000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers - Therapy Types
ipcMain.handle('therapy-types:list', async () => {
  return getAllTherapyTypes();
});

ipcMain.handle('therapy-types:create', async (event, data) => {
  return createTherapyType(data);
});

ipcMain.handle('therapy-types:update', async (event, { id, data }) => {
  return updateTherapyType(id, data);
});

ipcMain.handle('therapy-types:delete', async (event, id) => {
  return deleteTherapyType(id);
});

// IPC Handlers - Monthly Plans
ipcMain.handle('monthly-plans:list', async (event, month) => {
  return getMonthlyPlans(month);
});

ipcMain.handle('monthly-plans:create', async (event, data) => {
  return createMonthlyPlan(data);
});

ipcMain.handle('monthly-plans:update', async (event, { id, data }) => {
  return updateMonthlyPlan(id, data);
});

ipcMain.handle('monthly-plans:delete', async (event, id) => {
  return deleteMonthlyPlan(id);
});

// IPC Handlers - Expenses
ipcMain.handle('expenses:list', async (event, month) => {
  return getExpenses(month);
});

ipcMain.handle('expenses:create', async (event, data) => {
  return createExpense(data);
});

ipcMain.handle('expenses:update', async (event, { id, data }) => {
  return updateExpense(id, data);
});

ipcMain.handle('expenses:delete', async (event, id) => {
  return deleteExpense(id);
});

// IPC Handlers - Summary
ipcMain.handle('summary:monthly', async (event, month) => {
  return getMonthlySummary(month);
});

// IPC Handlers - Sync
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

export { db };
