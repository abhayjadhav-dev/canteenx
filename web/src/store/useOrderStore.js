import { create } from 'zustand';
import { getOrders, getOrder, createOrder, updateOrderStatus } from '../services/api';
import { supabase } from '../lib/supabase';
import { useToastStore } from './useToastStore';
import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

export const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  total: 0,
  loading: false,
  error: null,
  subscription: null,
  subscriptionUsers: 0,
  lastParams: null,
  refreshTimer: null,

  fetchOrders: async (params) => {
    set({ lastParams: params || null });
    set({ loading: true, error: null });
    try {
      const res = await getOrders(params);
      set({ orders: res.data, total: res.total, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await getOrder(id);
      set({ currentOrder: res.data, loading: false });
    } catch (err) {
      set({ currentOrder: null, error: err.message, loading: false });
    }
  },

  placeOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await createOrder(data);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, loading: false });
      throw err;
    }
  },

  advanceStatus: async (id, status, note) => {
    try {
      const res = await updateOrderStatus(id, status, note);
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? res.data : o)),
        currentOrder: state.currentOrder?._id === id ? res.data : state.currentOrder,
      }));
      return res.data;
    } catch (err) {
      throw err;
    }
  },

  clearCurrentOrder: () => set({ currentOrder: null }),

  /**
   * Subscribe to realtime order updates.
   * - Students listen only to their own orders
   * - Admin/staff listen to all orders
   * Also triggers a toast when any tracked order becomes "ready".
   */
  subscribeToOrders: () => {
    const existing = get().subscription;
    if (existing) {
      set({ subscriptionUsers: get().subscriptionUsers + 1 });
      return existing;
    }

    const user = useAuthStore.getState().user;
    if (!user) return null;

    const toast = useToastStore.getState();
    const notifications = useNotificationStore.getState();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(user.role === 'student' ? { filter: `user_id=eq.${user.id}` } : {}),
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          // Always refresh the currently opened order from API (ensures correct camelCase shape)
          if (newRow?.id) {
            const current = get().currentOrder;
            if (current && (current._id === newRow.id || current.id === newRow.id)) {
              get().fetchOrder(newRow.id);
            }
          }

          // If we have an orders list loaded, refresh it (debounced) so student/admin see status changes reliably
          if (get().orders.length > 0) {
            const prev = get().refreshTimer;
            if (prev) clearTimeout(prev);
            const t = setTimeout(() => {
              const params = get().lastParams || undefined;
              get().fetchOrders(params);
            }, 500);
            set({ refreshTimer: t });
          }

          const prefs = user.notificationPrefs || {
            orderReady: true,
            orderCancelled: true,
            adminNewOrder: true,
            adminLowInventory: true,
          };

          const scope = user.role === 'student' ? 'student' : 'admin';

          // Notify when order becomes ready (quieter: toast only for students, no permission prompts)
          if (
            eventType === 'UPDATE' &&
            oldRow?.status !== 'ready' &&
            newRow?.status === 'ready' &&
            prefs.orderReady
          ) {
            const title = 'Order ready';
            const msg = `Order ${newRow.order_number || newRow.orderNumber || ''} is ready for pickup.`;
            if (scope === 'student') {
              toast.success(msg);
            }
            notifications.addNotification({ title, message: msg, type: 'orderReady', scope });

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(title, { body: msg });
              }
            }
          }

          // Notify when order is cancelled (quieter: toast only for students, no permission prompts)
          if (
            eventType === 'UPDATE' &&
            oldRow?.status !== 'cancelled' &&
            newRow?.status === 'cancelled' &&
            prefs.orderCancelled
          ) {
            const title = 'Order cancelled';
            const msg = `Order ${newRow.order_number || newRow.orderNumber || ''} has been cancelled.`;
            if (scope === 'student') {
              toast.error ? toast.error(msg) : toast.info(msg);
            }
            notifications.addNotification({ title, message: msg, type: 'orderCancelled', scope });

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(title, { body: msg });
              }
            }
          }

          // Admin-only: new order alerts
          if (
            eventType === 'INSERT' &&
            scope === 'admin' &&
            prefs.adminNewOrder
          ) {
            const title = 'New order received';
            const msg = `New order ${newRow.order_number || newRow.orderNumber || ''} placed.`;
            notifications.addNotification({ title, message: msg, type: 'adminNewOrder', scope });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Best-effort auto-reconnect
          get().subscribeToOrders();
        }
      });

    set({ subscription: channel, subscriptionUsers: 1 });
    return channel;
  },

  unsubscribeFromOrders: () => {
    const sub = get().subscription;
    const users = get().subscriptionUsers;
    if (!sub || users <= 0) return;

    const nextUsers = users - 1;
    if (nextUsers > 0) {
      set({ subscriptionUsers: nextUsers });
      return;
    }

    supabase.removeChannel(sub);
    set({ subscription: null, subscriptionUsers: 0 });
  },
}));
