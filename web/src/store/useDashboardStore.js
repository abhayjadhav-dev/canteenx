import { create } from 'zustand';
import { getOrderStats, getInventorySummary, getInventoryAlerts } from '../services/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

export const useDashboardStore = create((set, get) => ({
  stats: null,
  inventorySummary: null,
  alerts: [],
  loading: false,
  subscription: null,

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
    } catch {
      // ignore
    }
  },

  fetchAlerts: async (params) => {
    try {
      const res = await getInventoryAlerts(params);
      set({ alerts: res.data });
    } catch {
      // ignore
    }
  },

  /**
   * Realtime inventory alerts stream for admin dashboard.
   */
  subscribeToInventoryAlerts: () => {
    const existing = get().subscription;
    if (existing) return existing;

    const user = useAuthStore.getState().user;
    const notifications = useNotificationStore.getState();

    const channel = supabase
      .channel('inventory-alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_alerts' },
        (payload) => {
          // Refresh alerts and summary on any change
          get().fetchAlerts();
          get().fetchInventorySummary();

          if (!user || (user.role !== 'admin' && user.role !== 'staff')) return;
          const prefs = user.notificationPrefs || {
            orderReady: true,
            orderCancelled: true,
            adminNewOrder: true,
            adminLowInventory: true,
          };
          if (!prefs.adminLowInventory) return;

          const { eventType, new: newRow, old: oldRow } = payload;
          if (!newRow) return;
          const becameActive =
            eventType === 'INSERT' ||
            (eventType === 'UPDATE' && (oldRow?.resolved && !newRow.resolved));

          if (becameActive) {
            const title = 'Low inventory';
            const msg = `${newRow.item_name} is ${newRow.severity || 'low'} (stock ${newRow.current_stock})`;
            notifications.addNotification({ title, message: msg, type: 'inventoryLow', scope: 'admin' });

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(title, { body: msg });
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          // Also refresh summary when menu stock changes via orders
          get().fetchInventorySummary();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          get().subscribeToInventoryAlerts();
        }
      });

    set({ subscription: channel });
    return channel;
  },

  unsubscribeFromInventoryAlerts: () => {
    const sub = get().subscription;
    if (sub) {
      supabase.removeChannel(sub);
      set({ subscription: null });
    }
  },
}));
