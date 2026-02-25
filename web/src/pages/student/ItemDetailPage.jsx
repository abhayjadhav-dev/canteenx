import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuStore } from '../../store/useMenuStore';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { resolveImageUrl } from '../../lib/imageUrl';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { Clock, Flame, Star, Package, Check, Sparkles, ShoppingCart, Minus, Plus } from 'lucide-react';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentItem: item, loading, fetchItem, clearCurrentItem } = useMenuStore();
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore;

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    fetchItem(id);
    return () => clearCurrentItem();
  }, [id]);

  useEffect(() => {
    if (!item) return;
    const max = Math.max(1, item.stockQty ?? 99);
    if (quantity > max) setQuantity(max);
  }, [item, item?.stockQty, quantity]);

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const maxQty = item ? Math.max(1, (item.stockQty ?? 99)) : 1;
  const totalPrice = item ? (item.price + addonTotal) * quantity : 0;

  const handleAddToCart = () => {
    if (!item) return;
    const qty = Math.min(quantity, maxQty);
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: qty,
      addons: selectedAddons,
      specialInstructions: instructions,
    });
    toast.getState().success(`${item.name} added to cart!`);
    navigate('/student');
  };

  if (loading || !item) return <><PageHeader title="Item Detail" backTo="/student" /><Loading /></>;

  return (
    <>
      <PageHeader title="" backTo="/student" />

      <div className="item-hero-wrap">
        <img
          className="item-hero"
          src={resolveImageUrl(item.imageUrl) || 'https://placehold.co/400x250/f8f7f5/94a3b8?text=No+Image'}
          alt={item.name}
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x250/f8f7f5/94a3b8?text=No+Image'; }}
        />
        {item.isTodaysSpecial && (
          <span className="item-hero-special"><Sparkles size={14} /> Today's Special</span>
        )}
      </div>

      <div className="item-badges-row">
        <span className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
        {item.isPopular && <span className="popular-tag">Popular</span>}
        {item.isTodaysSpecial && <span className="special-mini-tag"><Sparkles size={10} /> Special</span>}
      </div>

      <h1 className="item-title">{item.name}</h1>

      <div className="item-meta-row">
        <span className="item-meta-tag"><Clock size={14} /> {item.prepTime} min</span>
        <span className="item-meta-tag"><Flame size={14} /> {item.calories} cal</span>
        {item.rating > 0 && <span className="item-meta-tag"><Star size={14} className="star-filled" /> {item.rating} ({item.ratingCount})</span>}
        {item.stockQty !== undefined && <span className="item-meta-tag"><Package size={14} /> {item.stockQty} left</span>}
      </div>

      <div className="item-price">₹{item.price}</div>
      <p className="item-desc">{item.description}</p>

      {/* Add-ons */}
      {item.addons && item.addons.length > 0 && (
        <>
          <h3 className="item-section-title">Customize</h3>
          <div className="addon-list">
            {item.addons.map((addon) => {
              const isSelected = selectedAddons.find((a) => a.name === addon.name);
              return (
                <div
                  key={addon.name}
                  className={`addon-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleAddon(addon)}
                >
                  <div className="addon-item-left">
                    <span className={`addon-check ${isSelected ? 'checked' : ''}`}>{isSelected && <Check size={12} />}</span>
                    <span className="addon-name">{addon.name}</span>
                  </div>
                  <span className="addon-price">+₹{addon.price}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Special instructions */}
      <h3 className="item-section-title">Special Instructions</h3>
      <textarea
        className="form-input"
        placeholder="Any special requests? (optional)"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={2}
      />

      {/* Quantity */}
      <div className="qty-picker">
        <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus size={18} /></button>
        <span className="qty-value">{quantity}</span>
        <button className="qty-btn" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={quantity >= maxQty}><Plus size={18} /></button>
      </div>

      {/* Add to cart */}
      <div className="spacer-footer" />
      <div className="sticky-footer">
        <button
          className="btn btn-primary btn-block btn-add-cart"
          onClick={handleAddToCart}
          disabled={!item.available}
        >
          {item.available ? (
            <><ShoppingCart size={18} /> Add to Cart · ₹{totalPrice}</>
          ) : 'Currently Unavailable'}
        </button>
      </div>
    </>
  );
}
