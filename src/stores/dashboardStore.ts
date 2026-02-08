import { create } from 'zustand';

interface DashboardState {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;

  therapyTypes: any[];
  setTherapyTypes: (types: any[]) => void;

  monthlyPlans: any[];
  setMonthlyPlans: (plans: any[]) => void;

  expenses: any[];
  setExpenses: (expenses: any[]) => void;

  summary: any;
  setSummary: (summary: any) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentMonth: new Date().toISOString().substring(0, 7),
  setCurrentMonth: (month) => set({ currentMonth: month }),

  therapyTypes: [],
  setTherapyTypes: (types) => set({ therapyTypes: types }),

  monthlyPlans: [],
  setMonthlyPlans: (plans) => set({ monthlyPlans: plans }),

  expenses: [],
  setExpenses: (expenses) => set({ expenses }),

  summary: null,
  setSummary: (summary) => set({ summary }),

  loading: false,
  setLoading: (loading) => set({ loading }),

  error: null,
  setError: (error) => set({ error }),
}));
