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
