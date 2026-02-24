import { create } from 'zustand';
import { getMenu, getMenuItem, getCategories } from '../services/api';

export const useMenuStore = create((set, get) => ({
  items: [],
  categories: [],
  currentItem: null,
  loading: false,
  error: null,

  fetchMenu: async (params, options = {}) => {
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
    } catch { /* ignore */ }
  },

  clearCurrentItem: () => set({ currentItem: null }),
}));
