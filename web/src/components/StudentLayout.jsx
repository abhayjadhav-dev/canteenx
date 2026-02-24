import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { Home, ClipboardList, ShoppingCart, User } from 'lucide-react';

export default function StudentLayout() {
  const location = useLocation();
  const itemCount = useCartStore((s) => s.getItemCount());

  // Hide bottom nav on certain pages
  const hideBottomNav = ['/student/checkout', '/student/order-confirm'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <div className="app-shell">
      <div className="page-content" style={hideBottomNav ? { paddingBottom: 24 } : undefined}>
        <Outlet />
      </div>
      {!hideBottomNav && (
        <nav className="bottom-nav">
          <NavLink to="/student" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><Home size={22} /></span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/student/orders" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><ClipboardList size={22} /></span>
            <span>Orders</span>
          </NavLink>
          <NavLink to="/student/cart" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><ShoppingCart size={22} /></span>
            <span>Cart</span>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </NavLink>
          <NavLink to="/student/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><User size={22} /></span>
            <span>Profile</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
