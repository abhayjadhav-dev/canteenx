import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Supabase access token on every request for backend auth/RBAC
api.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore — request will just be unauthenticated
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Upload ──
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// ── Menu ──
export const getMenu = (params) => api.get('/menu', { params }).then((r) => r.data);
export const getMenuItem = (id) => api.get(`/menu/${id}`).then((r) => r.data);
export const createMenuItem = (data) => api.post('/menu', data).then((r) => r.data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data).then((r) => r.data);
export const deleteMenuItem = async (id) => {
  try {
    const r = await api.delete(`/menu/${id}`);
    return r.data;
  } catch (err) {
    // Treat 404 as "already deleted" so UI doesn't show a failure
    if (err?.response?.status === 404) {
      return { success: true, data: {} };
    }
    throw err;
  }
};
export const toggleAvailability = (id, available) => api.patch(`/menu/${id}/availability`, { available }).then((r) => r.data);
export const toggleTodaysSpecial = (id, isTodaysSpecial, specialLabel) => api.patch(`/menu/${id}/special`, { isTodaysSpecial, specialLabel }).then((r) => r.data);
export const updateStock = (id, stockQty) => api.patch(`/menu/${id}/stock`, { stockQty }).then((r) => r.data);

// ── Categories ──
export const getCategories = () => api.get('/categories').then((r) => r.data);
export const createCategory = (data) => api.post('/categories', data).then((r) => r.data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);

// ── Orders ──
export const getOrders = (params) => api.get('/orders', { params }).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const getOrderStats = () => api.get('/orders/stats').then((r) => r.data);
export const createOrder = (data) => api.post('/orders', data).then((r) => r.data);
export const updateOrderStatus = (id, status, note) => api.patch(`/orders/${id}/status`, { status, note }).then((r) => r.data);

// ── Users ──
export const getUsers = (params) => api.get('/users', { params }).then((r) => r.data);
export const getUser = (id) => api.get(`/users/${id}`).then((r) => r.data);
export const createUser = (data) => api.post('/users', data).then((r) => r.data);
export const loginUser = (email) => api.post('/users/login', { email }).then((r) => r.data);
export const topUpWallet = (id, amount) => api.patch(`/users/${id}/wallet`, { amount }).then((r) => r.data);

// ── Inventory ──
export const getInventoryAlerts = (params) => api.get('/inventory/alerts', { params }).then((r) => r.data);
export const getInventorySummary = () => api.get('/inventory/summary').then((r) => r.data);
export const restockItem = (itemId, quantity) => api.patch(`/inventory/restock/${itemId}`, { quantity }).then((r) => r.data);
export const resolveAlert = (alertId) => api.patch(`/inventory/alerts/${alertId}/resolve`).then((r) => r.data);

export default api;
