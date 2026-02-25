import { create } from 'zustand';

/**
 * Global in-app notifications.
 * scope: 'student' | 'admin'
 * type: 'orderReady' | 'orderCancelled' | 'adminNewOrder' | 'inventoryLow'
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: ({ title, message, type, scope }) => {
    const now = new Date().toISOString();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = { id, title, message, type, scope, createdAt: now, read: false };
    set((state) => ({
      notifications: [entry, ...state.notifications].slice(0, 100),
    }));
  },

  markAllRead: (scope) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        scope && n.scope !== scope ? n : { ...n, read: true }
      ),
    }));
  },

  clearAll: (scope) => {
    if (!scope) {
      set({ notifications: [] });
      return;
    }
    set((state) => ({
      notifications: state.notifications.filter((n) => n.scope !== scope),
    }));
  },
}));

