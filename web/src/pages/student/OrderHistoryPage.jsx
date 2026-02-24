import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { Inbox, ClipboardList } from 'lucide-react';
import usePullToRefresh from '../../hooks/usePullToRefresh';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { orders, loading, fetchOrders } = useOrderStore();
  const [tab, setTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (showSpinner = true) => {
    if (!user) return;
    if (showSpinner) setRefreshing(true);
    await fetchOrders({ user: user._id, limit: 50 });
    if (showSpinner) setRefreshing(false);
  }, [user, fetchOrders]);

  const pulling = usePullToRefresh(() => refresh(true), !!user);

  useEffect(() => {
    refresh(false);
    if (!user) return;
    const interval = setInterval(() => refresh(false), 6000);
    return () => clearInterval(interval);
  }, [user, tab, refresh]);

  const active = orders.filter((o) => ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const past = orders.filter((o) => ['collected', 'cancelled'].includes(o.status));
  const shown = tab === 'active' ? active : past;

  return (
    <>
      <PageHeader
        title="My Orders"
        right={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => refresh(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Active ({active.length})
        </button>
        <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past ({past.length})
        </button>
      </div>

      {(pulling || refreshing) && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8125rem' }}>
          {refreshing ? 'Refreshing orders...' : 'Release to refresh'}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{tab === 'active' ? <Inbox size={48} color="var(--text-muted)" /> : <ClipboardList size={48} color="var(--text-muted)" />}</div>
          <h3>No {tab} orders</h3>
          <p>{tab === 'active' ? 'You have no active orders right now' : 'Your past orders will appear here'}</p>
        </div>
      ) : (
        shown.map((order) => (
          <div
            key={order._id}
            className="order-card"
            onClick={() => navigate(`/student/track/${order._id}`)}
          >
            <div className="order-card-header">
              <span className="order-number">{order.orderNumber}</span>
              <span className={`status-badge ${order.status}`}>{order.status}</span>
            </div>
            <div className="order-card-items">
              {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
            </div>
            <div className="order-card-footer">
              <span className="order-total">₹{order.total?.toFixed(2)}</span>
              <span className="order-time">{formatTime(order.createdAt)}</span>
            </div>
          </div>
        ))
      )}
    </>
  );
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
