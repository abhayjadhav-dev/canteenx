import { create } from 'zustand';
import { getOrderStats, getInventorySummary, getInventoryAlerts } from '../services/api';

export const useDashboardStore = create((set) => ({
  stats: null,
  inventorySummary: null,
  alerts: [],
  loading: false,

  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await getOrderStats();
      set({ stats: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchInventorySummary: async () => {
    try {
      const res = await getInventorySummary();
      set({ inventorySummary: res.data });
    } catch { /* ignore */ }
  },

  fetchAlerts: async (params) => {
    try {
      const res = await getInventoryAlerts(params);
      set({ alerts: res.data });
    } catch { /* ignore */ }
  },
}));
