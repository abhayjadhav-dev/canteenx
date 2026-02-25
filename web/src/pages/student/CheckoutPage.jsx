import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useToastStore } from '../../store/useToastStore';
import PageHeader from '../../components/PageHeader';
import { Wallet, Smartphone, CreditCard, Banknote, PackageOpen, UtensilsCrossed, ShieldCheck } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={18} /> },
  { id: 'upi', label: 'UPI', icon: <Smartphone size={18} /> },
  { id: 'card', label: 'Card', icon: <CreditCard size={18} /> },
  { id: 'cash', label: 'Cash', icon: <Banknote size={18} /> },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const placeOrder = useOrderStore((s) => s.placeOrder);
  const loading = useOrderStore((s) => s.loading);
  const toast = useToastStore;

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [orderType, setOrderType] = useState('takeaway');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = getTotal();
  const walletInsufficient = paymentMethod === 'wallet' && (user?.walletBalance ?? 0) < total;
  const canPlaceOrder = !submitting && !walletInsufficient;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!user) {
      toast.getState().error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          addons: i.addons,
          specialInstructions: i.specialInstructions,
        })),
        customerName: user?.name || 'Student',
        paymentMethod,
        orderType,
        specialInstructions: instructions,
      });
      clearCart();
      toast.getState().success('Order placed successfully!');
      navigate(`/student/order-confirm/${order._id}`, { replace: true });
    } catch (err) {
      toast.getState().error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/student/cart', { replace: true });
    }
  }, [items.length, submitting, navigate]);

  if (items.length === 0) return null;

  return (
    <>
      <PageHeader title="Checkout" backTo="/student/cart" />

      {/* Order Items */}
      <div className="card checkout-card">
        <div className="card-body">
          <h3 className="card-section-title">Your Order</h3>
          {items.map((item, i) => (
            <div key={i} className="checkout-item">
              <span>
                <span className="checkout-item-qty">{item.quantity}x</span> {item.name}
                {item.addons?.length > 0 && (
                  <span className="checkout-item-addons"> + {item.addons.map((a) => a.name).join(', ')}</span>
                )}
              </span>
              <span className="checkout-item-price">₹{(item.price + (item.addons || []).reduce((s, a) => s + a.price, 0)) * item.quantity}</span>
            </div>
          ))}
          <div className="summary-row subtotal-row">
            <span>Subtotal</span><span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (5%)</span><span>₹{getTax().toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span><span className="total-highlight">₹{getTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Order Type */}
      <div className="card checkout-card">
        <div className="card-body">
          <h3 className="card-section-title">Order Type</h3>
          <div className="tabs">
            <button className={`tab ${orderType === 'takeaway' ? 'active' : ''}`} onClick={() => setOrderType('takeaway')}>
              <PackageOpen size={15} className="inline-icon" /> Takeaway
            </button>
            <button className={`tab ${orderType === 'dine-in' ? 'active' : ''}`} onClick={() => setOrderType('dine-in')}>
              <UtensilsCrossed size={15} className="inline-icon" /> Dine-in
            </button>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="card checkout-card">
        <div className="card-body">
          <h3 className="card-section-title">
            Payment Method
            {paymentMethod === 'wallet' && user?.walletBalance !== undefined && (
              <span className={`wallet-hint ${walletInsufficient ? 'insufficient' : ''}`}>
                Balance: ₹{user.walletBalance}
                {walletInsufficient && ' (insufficient)'}
              </span>
            )}
          </h3>
          <div className="payment-options">
            {PAYMENT_METHODS.map((pm) => {
              const isWalletInsufficient = pm.id === 'wallet' && (user?.walletBalance ?? 0) < total;
              return (
              <div
                key={pm.id}
                className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''} ${isWalletInsufficient ? 'disabled' : ''}`}
                onClick={() => !isWalletInsufficient && setPaymentMethod(pm.id)}
                title={isWalletInsufficient ? 'Insufficient balance – top up in Profile' : ''}
              >
                <div className="payment-option-radio" />
                <span className="payment-option-label">{pm.icon} {pm.label}</span>
              </div>
            );})}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card checkout-card">
        <div className="card-body">
          <h3 className="card-section-title">Special Instructions</h3>
          <textarea
            className="form-input"
            placeholder="Any special requests for the entire order?"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="spacer-footer" />
      <div className="sticky-footer">
        <button
          className="btn btn-primary btn-block btn-place-order"
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder}
        >
          {submitting ? 'Placing Order...' : <><ShieldCheck size={18} /> Place Order · ₹{getTotal().toFixed(2)}</>}
        </button>
      </div>
    </>
  );
}
