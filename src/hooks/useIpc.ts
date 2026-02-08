import { useCallback } from 'react';

declare global {
  interface Window {
    api: {
      createBusinessPlan: (data: any) => Promise<any>;
      getBusinessPlans: () => Promise<any[]>;
      updateBusinessPlan: (id: string, data: any) => Promise<any>;
      deleteBusinessPlan: (id: string) => Promise<void>;
      getTherapyTypes: () => Promise<any[]>;
      createTherapyType: (data: any) => Promise<any>;
      getMonthlyPlans: (month: string) => Promise<any[]>;
      createMonthlyPlan: (data: any) => Promise<any>;
      getExpenses: (month: string) => Promise<any[]>;
      createExpense: (data: any) => Promise<any>;
      generateReport: (type: string, params: any) => Promise<any>;
      getSyncStatus: () => Promise<any>;
      syncNow: () => Promise<void>;
      getMonthlySummary: (month: string) => Promise<any>;
    };
  }
}

export function useIpc() {
  return window.api;
}
