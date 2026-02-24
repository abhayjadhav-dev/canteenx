import { create } from 'zustand';
import { getOrders, getOrder, createOrder, updateOrderStatus } from '../services/api';

export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  total: 0,
  loading: false,
  error: null,

  fetchOrders: async (params) => {
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
      set({ error: err.message, loading: false });
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
}));
