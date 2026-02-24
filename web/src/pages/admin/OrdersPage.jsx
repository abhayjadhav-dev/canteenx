import React, { useCallback, useEffect, useState } from 'react';
import { useOrderStore } from '../../store/useOrderStore';
import { useToastStore } from '../../store/useToastStore';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { Inbox, User } from 'lucide-react';
import usePullToRefresh from '../../hooks/usePullToRefresh';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Collected', value: 'collected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const NEXT_STATUS = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'collected',
};

const NEXT_LABEL = {
  placed: 'Confirm',
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Collected',
};

export default function OrdersPage() {
  const { orders, loading, fetchOrders, advanceStatus } = useOrderStore();
  const toast = useToastStore;
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (showSpinner = true) => {
    const params = filter ? { status: filter } : {};
    if (showSpinner) setRefreshing(true);
    await fetchOrders({ ...params, limit: 100 });
    if (showSpinner) setRefreshing(false);
  }, [filter, fetchOrders]);

  const pulling = usePullToRefresh(() => refresh(true), true);

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refresh(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAdvance = async (orderId, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await advanceStatus(orderId, next);
      toast.getState().success(`Order moved to ${next}`);
    } catch (err) {
      toast.getState().error('Failed to update status');
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await advanceStatus(orderId, 'cancelled', 'Cancelled by admin');
      toast.getState().success('Order cancelled');
    } catch {
      toast.getState().error('Failed to cancel order');
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        right={
          <button className="btn btn-outline btn-sm" onClick={() => refresh(true)} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {/* Filters */}
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`category-chip ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {(pulling || refreshing) && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8125rem' }}>
          {refreshing ? 'Refreshing orders...' : 'Release to refresh'}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Inbox size={48} color="var(--text-muted)" /></div>
          <h3>No orders found</h3>
          <p>Try a different filter</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="admin-order-card" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
            <div className="admin-order-header">
              <div>
                <span className="order-number">{order.orderNumber}</span>
                <span className="admin-order-token">Token #{order.tokenNumber}</span>
              </div>
              <span className={`status-badge ${order.status}`}>{order.status}</span>
            </div>
            <div className="admin-order-customer">
              <User size={14} className="inline-icon" /> {order.customerName || order.user?.name || 'Student'}
              <span className="admin-order-detail-sep">•</span>{order.orderType}
              <span className="admin-order-detail-sep">•</span>{order.paymentMethod}
            </div>
            <div className="admin-order-items">
              {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(' · ')}
            </div>
            <div className="admin-order-bottom">
              <span className="order-total">₹{order.total?.toFixed(2)}</span>
              <span className="order-time">{formatTime(order.createdAt)}</span>
            </div>

            {/* Expanded actions */}
            {expandedId === order._id && (
              <div className="admin-order-actions" onClick={(e) => e.stopPropagation()}>
                {NEXT_STATUS[order.status] && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAdvance(order._id, order.status)}
                  >
                    {NEXT_LABEL[order.status]}
                  </button>
                )}
                {!['collected', 'cancelled'].includes(order.status) && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(order._id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
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
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
