import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';
import StudentLayout from './components/StudentLayout';
import AdminLayout from './components/AdminLayout';

import HomePage from './pages/student/HomePage';
import ItemDetailPage from './pages/student/ItemDetailPage';
import CartPage from './pages/student/CartPage';
import CheckoutPage from './pages/student/CheckoutPage';
import OrderConfirmPage from './pages/student/OrderConfirmPage';
import OrderTrackingPage from './pages/student/OrderTrackingPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import ProfilePage from './pages/student/ProfilePage';

import DashboardPage from './pages/admin/DashboardPage';
import OrdersPage from './pages/admin/OrdersPage';
import MenuManagePage from './pages/admin/MenuManagePage';
import MenuFormPage from './pages/admin/MenuFormPage';
import InventoryPage from './pages/admin/InventoryPage';
import StudentNotificationsPage from './pages/student/NotificationsPage';
import AdminNotificationsPage from './pages/admin/NotificationsPage';

function ProtectedRoute({ children, role }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  // Treat 'staff' as having admin-style access for now
  if (role && user.role !== role && !(role === 'admin' && user.role === 'staff')) {
    return <Navigate to={user.role === 'admin' || user.role === 'staff' ? '/admin' : '/student'} replace />;
  }
  return children;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const location = useLocation();

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/admin');
    const manifestHref = isAdmin ? '/manifest-admin.webmanifest' : '/manifest-student.webmanifest';
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== manifestHref) {
      link.setAttribute('href', manifestHref);
    }
    const themeColor = isAdmin ? '#0f172a' : '#f97415';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.getAttribute('content') !== themeColor) {
      meta.setAttribute('content', themeColor);
    }
  }, [location.pathname]);

  return (
    <ErrorBoundary>
    <Toast />
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirm/:id" element={<OrderConfirmPage />} />
        <Route path="track/:id" element={<OrderTrackingPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="menu" element={<MenuManagePage />} />
        <Route path="menu/new" element={<MenuFormPage />} />
        <Route path="menu/edit/:id" element={<MenuFormPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={
        <Navigate to={user ? (user.role === 'admin' || user.role === 'staff' ? '/admin' : '/student') : '/auth'} replace />
      }       />
    </Routes>
    </ErrorBoundary>
  );
}
