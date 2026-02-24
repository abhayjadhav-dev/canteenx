import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canteenx-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`).then((r) => r.data);
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
