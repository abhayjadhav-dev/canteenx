import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/Loading';
import { Package, IndianRupee, Clock, Hourglass, ClipboardList, UtensilsCrossed, Plus, LogOut, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { stats, inventorySummary, loading, fetchStats, fetchInventorySummary, fetchAlerts, alerts } = useDashboardStore();
  const logout = useAuthStore((s) => s.logout);

  const refreshStats = useCallback(() => fetchStats(), [fetchStats]);
  const refreshInventory = useCallback(() => {
    fetchInventorySummary();
    fetchAlerts({ resolved: false });
  }, [fetchInventorySummary, fetchAlerts]);

  useEffect(() => {
    refreshStats();
    refreshInventory();
    const statsInterval = setInterval(refreshStats, 15000);
    const inventoryInterval = setInterval(refreshInventory, 20000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(inventoryInterval);
    };
  }, [refreshStats, refreshInventory]);

  return (
    <>
      <div className="dashboard-top">
        <div className="greeting">
          <p className="greeting-sub">Welcome back</p>
          <h1 className="greeting-title">{user?.name || 'Admin'}</h1>
        </div>
        <button className="btn btn-sm btn-outline btn-signout" onClick={() => { logout(); navigate('/auth', { replace: true }); }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {loading && !stats ? <Loading /> : stats && (
        <>
          {/* KPIs */}
          <div className="kpi-grid dashboard-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-icon"><Package size={24} color="var(--primary)" /></div>
              <div className="kpi-card-value">{stats.ordersToday}</div>
              <div className="kpi-card-label">Orders Today</div>
            </div>
            <div className="kpi-card kpi-revenue">
              <div className="kpi-card-icon"><IndianRupee size={24} color="var(--success)" /></div>
              <div className="kpi-card-value">₹{stats.revenueToday?.toFixed(0)}</div>
              <div className="kpi-card-label">Revenue Today</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-icon"><Clock size={24} color="var(--info)" /></div>
              <div className="kpi-card-value">{stats.avgPrepTime}m</div>
              <div className="kpi-card-label">Avg Prep Time</div>
            </div>
            <div className="kpi-card kpi-pending">
              <div className="kpi-card-icon"><Hourglass size={24} color="var(--warning)" /></div>
              <div className="kpi-card-value">{stats.pending || 0}</div>
              <div className="kpi-card-label">Pending Orders</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="section-header">
            <h2 className="section-title"><TrendingUp size={18} className="section-icon" /> Order Breakdown</h2>
          </div>
          <div className="card breakdown-card">
            <div className="card-body">
              <StatusRow label="Placed" count={stats.statusBreakdown?.placed || 0} color="var(--info)" />
              <StatusRow label="Preparing" count={stats.statusBreakdown?.preparing || 0} color="var(--warning)" />
              <StatusRow label="Ready" count={stats.statusBreakdown?.ready || 0} color="var(--success)" />
              <StatusRow label="Collected" count={stats.statusBreakdown?.collected || 0} color="#15803d" />
              {stats.statusBreakdown?.cancelled > 0 && (
                <StatusRow label="Cancelled" count={stats.statusBreakdown.cancelled} color="var(--error)" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Inventory Summary */}
      {inventorySummary && (
        <>
          <div className="section-header">
            <h2 className="section-title"><AlertTriangle size={18} className="section-icon" /> Inventory</h2>
          </div>
          <div className="kpi-grid inventory-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-value">{inventorySummary.totalItems}</div>
              <div className="kpi-card-label">Total Items</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-value kpi-warning">{inventorySummary.lowStock}</div>
              <div className="kpi-card-label">Low Stock</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-value kpi-error">{inventorySummary.outOfStock}</div>
              <div className="kpi-card-label">Out of Stock</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-card-value kpi-error">{inventorySummary.activeAlerts}</div>
              <div className="kpi-card-label">Active Alerts</div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/admin/orders')}>
          <span className="quick-action-icon"><ClipboardList size={24} color="var(--primary)" /></span>
          Manage Orders
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/admin/menu')}>
          <span className="quick-action-icon"><UtensilsCrossed size={24} color="var(--primary)" /></span>
          Edit Menu
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/admin/inventory')}>
          <span className="quick-action-icon"><Package size={24} color="var(--primary)" /></span>
          View Inventory
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/admin/menu/new')}>
          <span className="quick-action-icon"><Plus size={24} color="var(--primary)" /></span>
          Add Item
        </button>
      </div>
    </>
  );
}

function StatusRow({ label, count, color }) {
  return (
    <div className="status-row">
      <span className="status-dot" style={{ background: color }} />
      <span className="status-row-label">{label}</span>
      <span className="status-row-count">{count}</span>
    </div>
  );
}
