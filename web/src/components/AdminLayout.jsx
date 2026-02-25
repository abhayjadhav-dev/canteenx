import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Package } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';
import { useNotificationStore } from '../store/useNotificationStore';

export default function AdminLayout() {
  const online = useOnline();
  const unreadNotifications = useNotificationStore(
    (s) => s.notifications.filter((n) => n.scope === 'admin' && !n.read).length
  );

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner offline-banner-admin">
          Offline mode – dashboard data may be stale.
        </div>
      )}
      <div className="page-content">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/admin" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><LayoutDashboard size={22} /></span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><ClipboardList size={22} /></span>
          <span>Orders</span>
          {unreadNotifications > 0 && <span className="notif-badge">{unreadNotifications}</span>}
        </NavLink>
        <NavLink to="/admin/menu" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><UtensilsCrossed size={22} /></span>
          <span>Menu</span>
        </NavLink>
        <NavLink to="/admin/inventory" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Package size={22} /></span>
          <span>Inventory</span>
        </NavLink>
      </nav>
    </div>
  );
}
