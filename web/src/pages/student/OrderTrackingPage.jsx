import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/useOrderStore';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { FileText, CheckCircle, ChefHat, Bell, PartyPopper, XCircle } from 'lucide-react';

const STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'collected'];
const STATUS_LABELS = { placed: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready for Pickup', collected: 'Collected' };
const STATUS_ICON_MAP = {
  placed: <FileText size={16} />,
  confirmed: <CheckCircle size={16} />,
  preparing: <ChefHat size={16} />,
  ready: <Bell size={16} />,
  collected: <PartyPopper size={16} />,
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrder: order, fetchOrder, loading } = useOrderStore();

  const poll = useCallback(() => { fetchOrder(id); }, [id]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll]);

  if (loading && !order) return <><PageHeader title="Order Tracking" backTo="/student/orders" /><Loading /></>;
  if (!order) return <><PageHeader title="Order Tracking" backTo="/student/orders" /><div className="empty-state"><h3>Order not found</h3></div></>;

  const currentIdx = STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <PageHeader title="Order Tracking" backTo="/student/orders" />

      {/* Order info */}
      <div className="card tracking-info-card">
        <div className="card-body">
          <div className="tracking-info-header">
            <div>
              <div className="tracking-order-number">{order.orderNumber}</div>
              <div className="tracking-token">Token #{order.tokenNumber}</div>
            </div>
            <span className={`status-badge ${order.status}`}>{order.status}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {isCancelled ? (
        <div className="card tracking-cancelled-card">
          <div className="card-body tracking-cancelled-body">
            <XCircle size={48} color="var(--error)" />
            <h3 className="tracking-cancelled-text">Order Cancelled</h3>
          </div>
        </div>
      ) : (
        <div className="card tracking-timeline-card">
          <div className="card-body">
            <h3 className="card-section-title">Progress</h3>
            <div className="timeline">
              {STATUSES.map((status, idx) => {
                const step = order.statusHistory?.find((h) => h.status === status);
                let cls = 'future';
                if (idx < currentIdx) cls = 'done';
                if (idx === currentIdx) cls = 'current';

                return (
                  <div key={status} className={`timeline-step ${cls}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-label">{STATUS_ICON_MAP[status]} {STATUS_LABELS[status]}</div>
                    {step && (
                      <div className="timeline-time">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="card tracking-items-card">
        <div className="card-body">
          <h3 className="card-section-title">Items</h3>
          {order.items?.map((item, i) => (
            <div key={i} className="confirm-item-row">
              <span>{item.quantity}x {item.name}</span>
              <span className="confirm-item-price">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span><span>₹{order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.status === 'ready' && (
        <div className="ready-banner">
          <Bell size={28} color="var(--success)" />
          <p className="ready-banner-title">Your order is ready!</p>
          <p className="ready-banner-sub">Please collect from the counter</p>
        </div>
      )}
    </>
  );
}
