import { create } from 'zustand';
import { getMenu, getMenuItem, getCategories } from '../services/api';
import { supabase } from '../lib/supabase';

export const useMenuStore = create((set, get) => ({
  items: [],
  categories: [],
  currentItem: null,
  loading: false,
  error: null,
  subscription: null,
  subscriptionUsers: 0,
  lastParams: null,
  refreshTimer: null,

  fetchMenu: async (params, options = {}) => {
    set({ lastParams: params || null });
    if (!params && !options.force && get().items.length > 0) return;
    set({ loading: true, error: null });
    try {
      const res = await getMenu(params);
      set({ items: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchItem: async (id) => {
    set({ loading: true, error: null, currentItem: null });
    try {
      const res = await getMenuItem(id);
      set({ currentItem: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchCategories: async (options = {}) => {
    if (!options.force && get().categories.length > 0) return;
    try {
      const res = await getCategories();
      set({ categories: res.data });
    } catch {
      // ignore
    }
  },

  clearCurrentItem: () => set({ currentItem: null }),

  /**
   * Realtime updates for menu_items and inventory-related fields.
   * Keeps availability/stock in sync across all clients.
   */
  subscribeToMenu: () => {
    const existing = get().subscription;
    if (existing) {
      set({ subscriptionUsers: get().subscriptionUsers + 1 });
      return existing;
    }

    const channel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          const { new: newRow } = payload;

          // Refresh current item from API if open
          if (newRow?.id) {
            const current = get().currentItem;
            if (current && (current._id === newRow.id || current.id === newRow.id)) {
              get().fetchItem(newRow.id);
            }
          }

          // Refresh menu list (debounced) to keep frontend in transformed shape
          if (get().items.length > 0) {
            const prev = get().refreshTimer;
            if (prev) clearTimeout(prev);
            const t = setTimeout(() => {
              const params = get().lastParams || undefined;
              get().fetchMenu(params, { force: true });
            }, 500);
            set({ refreshTimer: t });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          get().subscribeToMenu();
        }
      });

    set({ subscription: channel, subscriptionUsers: 1 });
    return channel;
  },

  unsubscribeFromMenu: () => {
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
