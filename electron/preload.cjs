const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Starting preload script');

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
  setRemoteSyncConfig: (config) => ipcRenderer.invoke('sync:set-config', config),

  // Summary
  getMonthlySummary: (month) => ipcRenderer.invoke('summary:monthly', month),
};

console.log('[Preload] Exposing API to main world:', Object.keys(ipcApi));
contextBridge.exposeInMainWorld('api', ipcApi);
console.log('[Preload] API exposed. window.api should be available.');
