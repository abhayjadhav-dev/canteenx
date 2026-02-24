import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import PageHeader from '../../components/PageHeader';
import { ShoppingCart, Trash2, FileText, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, getTax, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Cart" />
        <div className="cart-empty">
          <div className="cart-empty-icon"><ShoppingBag size={56} color="var(--text-muted)" /></div>
          <h3>Your cart is empty</h3>
          <p>Explore the menu and add something delicious</p>
          <button className="btn btn-primary" onClick={() => navigate('/student')}>
            <ShoppingCart size={16} /> Browse Menu
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Cart (${items.reduce((s, i) => s + i.quantity, 0)})`} />

      <div className="card cart-items-card">
        <div className="card-body">
          {items.map((item, index) => (
            <div key={index} className="cart-item">
              <img
                className="cart-item-img"
                src={item.imageUrl || 'https://placehold.co/128/f8f7f5/94a3b8?text=...'}
                alt={item.name}
              />
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                {item.addons?.length > 0 && (
                  <div className="cart-item-addons">
                    + {item.addons.map((a) => a.name).join(', ')}
                  </div>
                )}
                {item.specialInstructions && (
                  <div className="cart-item-addons">
                    <FileText size={11} className="inline-icon" /> {item.specialInstructions}
                  </div>
                )}
                <div className="cart-item-bottom">
                  <span className="cart-item-price">
                    ₹{(item.price + (item.addons || []).reduce((s, a) => s + a.price, 0)) * item.quantity}
                  </span>
                  <div className="cart-item-qty">
                    <button className={`cart-qty-btn ${item.quantity === 1 ? 'delete' : ''}`} onClick={() => updateQuantity(index, item.quantity - 1)}>
                      {item.quantity === 1 ? <Trash2 size={14} /> : '−'}
                    </button>
                    <span className="cart-qty-value">{item.quantity}</span>
                    <button className="cart-qty-btn" onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card summary-card">
        <div className="card-body">
          <h3 className="card-section-title">Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>₹{getTax().toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{getTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="spacer-footer" />
      <div className="sticky-footer">
        <button className="btn btn-primary btn-block" onClick={() => navigate('/student/checkout')}>
          Proceed to Checkout · ₹{getTotal().toFixed(2)} <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
