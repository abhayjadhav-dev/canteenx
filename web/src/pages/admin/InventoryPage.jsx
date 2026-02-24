import React, { useCallback, useEffect, useState } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useToastStore } from '../../store/useToastStore';
import { restockItem, resolveAlert } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { CheckCircle } from 'lucide-react';
import usePullToRefresh from '../../hooks/usePullToRefresh';

export default function InventoryPage() {
  const { alerts, inventorySummary, fetchAlerts, fetchInventorySummary } = useDashboardStore();
  const toast = useToastStore;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    await Promise.all([
      fetchAlerts({ resolved: showResolved ? undefined : false }),
      fetchInventorySummary(),
    ]);
    if (showSpinner) setLoading(false);
  }, [fetchAlerts, fetchInventorySummary, showResolved]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const pulling = usePullToRefresh(refresh, true);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 12000);
    return () => clearInterval(interval);
  }, [load, showResolved]);

  const handleRestock = async (alert) => {
    const qty = Number(restockAmounts[alert._id] || 50);
    if (!qty || qty <= 0) { toast.getState().error('Enter a valid quantity'); return; }
    try {
      await restockItem(alert.menuItem?._id || alert.menuItem, qty);
      toast.getState().success(`Restocked ${alert.itemName} with ${qty} units`);
      setRestockAmounts((r) => ({ ...r, [alert._id]: '' }));
      load();
    } catch {
      toast.getState().error('Restock failed');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await resolveAlert(alertId);
      toast.getState().success('Alert resolved');
      load();
    } catch {
      toast.getState().error('Failed to resolve');
    }
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        right={
          <button className="btn btn-outline btn-sm" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {/* Summary */}
      {inventorySummary && (
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi-card">
            <div className="kpi-card-value">{inventorySummary.totalItems}</div>
            <div className="kpi-card-label">Total Items</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-value" style={{ color: 'var(--warning)' }}>{inventorySummary.lowStock}</div>
            <div className="kpi-card-label">Low Stock</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-value" style={{ color: 'var(--error)' }}>{inventorySummary.outOfStock}</div>
            <div className="kpi-card-label">Out of Stock</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-value" style={{ color: 'var(--error)' }}>{inventorySummary.activeAlerts}</div>
            <div className="kpi-card-label">Active Alerts</div>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${!showResolved ? 'active' : ''}`} onClick={() => setShowResolved(false)}>
          Active
        </button>
        <button className={`tab ${showResolved ? 'active' : ''}`} onClick={() => setShowResolved(true)}>
          All
        </button>
      </div>

      {(pulling || refreshing) && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8125rem' }}>
          {refreshing ? 'Refreshing alerts...' : 'Release to refresh'}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle size={48} color="var(--success)" /></div>
          <h3>All clear!</h3>
          <p>No inventory alerts</p>
        </div>
      ) : (
        alerts.map((alert) => (
          <div key={alert._id} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              <span className="alert-name">{alert.itemName}</span>
              <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
            </div>
            <div className="alert-stock">
              Current: <strong>{alert.currentStock}</strong> / Min: <strong>{alert.minStock}</strong>
              {alert.resolved && <span style={{ marginLeft: 8, color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Resolved</span>}
            </div>

            {!alert.resolved && (
              <div className="restock-input">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Qty"
                  value={restockAmounts[alert._id] || ''}
                  onChange={(e) => setRestockAmounts((r) => ({ ...r, [alert._id]: e.target.value }))}
                  min={1}
                  style={{ width: 80 }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleRestock(alert)}>
                  Restock
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleResolve(alert._id)}>
                  Resolve
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}
