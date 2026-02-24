import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/useOrderStore';
import Loading from '../../components/Loading';
import { CheckCircle, Navigation, ArrowLeft } from 'lucide-react';

export default function OrderConfirmPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrder: order, fetchOrder, loading } = useOrderStore();

  useEffect(() => {
    fetchOrder(id);
  }, [id]);

  if (loading || !order) return <div className="confirm-page"><Loading text="Loading order..." /></div>;

  return (
    <div className="confirm-page">
      <div className="confirm-check"><CheckCircle size={44} color="var(--success)" /></div>
      <h1 className="confirm-heading">Order Placed!</h1>
      <p className="confirm-subtext">Your order has been confirmed</p>

      <div className="confirm-token">#{order.tokenNumber || '—'}</div>
      <p className="confirm-hint">Show this token at the counter</p>

      <div className="card confirm-detail-card">
        <div className="card-body">
          <div className="confirm-order-header">
            <span className="confirm-order-number">{order.orderNumber}</span>
            <span className={`status-badge ${order.status}`}>{order.status}</span>
          </div>
          {order.items?.map((item, i) => (
            <div key={i} className="confirm-item-row">
              <span>{item.quantity}x {item.name}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="confirm-actions">
        <button className="btn btn-primary btn-block" onClick={() => navigate(`/student/track/${order._id}`)}>
          <Navigation size={16} /> Track Order
        </button>
        <button className="btn btn-outline btn-block" onClick={() => navigate('/student')}>
          <ArrowLeft size={16} /> Back to Menu
        </button>
      </div>
    </div>
  );
}
