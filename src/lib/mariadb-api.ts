import axios from 'axios';

export interface RemoteSyncConfig {
  apiUrl: string;
  apiKey: string;
}

let config: RemoteSyncConfig | null = null;

export function setRemoteSyncConfig(newConfig: RemoteSyncConfig) {
  config = newConfig;
}

export function getRemoteSyncConfig(): RemoteSyncConfig | null {
  return config;
}

const client = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function syncTherapyTypesToRemote(therapyTypes: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/therapy-types/sync`, {
    apiKey: config.apiKey,
    data: therapyTypes,
  });
}

export async function syncMonthlyPlansToRemote(plans: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/monthly-plans/sync`, {
    apiKey: config.apiKey,
    data: plans,
  });
}

export async function syncExpensesToRemote(expenses: any[]) {
  if (!config) throw new Error('Remote sync not configured');

  return client.post(`${config.apiUrl}/expenses/sync`, {
    apiKey: config.apiKey,
    data: expenses,
  });
}

export async function checkRemoteConnection() {
  if (!config) return false;

  try {
    await client.get(`${config.apiUrl}/health`, {
      headers: { 'X-API-Key': config.apiKey },
    });
    return true;
  } catch {
    return false;
  }
}
