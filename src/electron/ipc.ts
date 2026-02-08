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
