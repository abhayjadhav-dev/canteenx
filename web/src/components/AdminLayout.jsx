import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Package } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="app-shell">
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
