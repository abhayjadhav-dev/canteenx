import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuStore } from '../../store/useMenuStore';
import { useToastStore } from '../../store/useToastStore';
import { createMenuItem, updateMenuItem, uploadImage } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { X, Plus, Camera, ImagePlus, Loader, Trash2, Sparkles } from 'lucide-react';

const EMPTY = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  available: true,
  stockQty: 50,
  minStockQty: 10,
  prepTime: 10,
  calories: 0,
  isVeg: true,
  isPopular: false,
  isTodaysSpecial: false,
  specialLabel: '',
};

export default function MenuFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { categories, fetchCategories, fetchItem, currentItem, clearCurrentItem } = useMenuStore();
  const toast = useToastStore;

  const [form, setForm] = useState(EMPTY);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');
  const [addons, setAddons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      setLoadingItem(true);
      fetchItem(id);
    }
    return () => clearCurrentItem();
  }, [id]);

  useEffect(() => {
    if (isEdit && currentItem) {
      setForm({
        name: currentItem.name || '',
        description: currentItem.description || '',
        price: currentItem.price || '',
        category: currentItem.category?._id || currentItem.category || '',
        imageUrl: currentItem.imageUrl || '',
        available: currentItem.available ?? true,
        stockQty: currentItem.stockQty ?? 50,
        minStockQty: currentItem.minStockQty ?? 10,
        prepTime: currentItem.prepTime ?? 10,
        calories: currentItem.calories ?? 0,
        isVeg: currentItem.isVeg ?? true,
        isPopular: currentItem.isPopular ?? false,
        isTodaysSpecial: currentItem.isTodaysSpecial ?? false,
        specialLabel: currentItem.specialLabel || '',
      });
      setAddons(currentItem.addons || []);
      setLoadingItem(false);
    }
  }, [currentItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ── Image upload handler ── */
  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side
    if (!file.type.startsWith('image/')) {
      toast.getState().error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.getState().error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      if (result.success) {
        setForm((f) => ({ ...f, imageUrl: result.data.url }));
        toast.getState().success('Image uploaded!');
      } else {
        toast.getState().error(result.error || 'Upload failed');
      }
    } catch (err) {
      toast.getState().error(err.response?.data?.error || 'Image upload failed');
    } finally {
      setUploading(false);
      // Reset file input so user can re-select
      e.target.value = '';
    }
  };

  const removeImage = () => setForm((f) => ({ ...f, imageUrl: '' }));

  const addAddon = () => {
    if (!addonName.trim() || !addonPrice) return;
    setAddons((a) => [...a, { name: addonName.trim(), price: Number(addonPrice) }]);
    setAddonName('');
    setAddonPrice('');
  };

  const removeAddon = (idx) => setAddons((a) => a.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.getState().error('Name, price, and category are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stockQty: Number(form.stockQty),
        minStockQty: Number(form.minStockQty),
        prepTime: Number(form.prepTime),
        calories: Number(form.calories),
        addons,
      };
      if (isEdit) {
        await updateMenuItem(id, payload);
        toast.getState().success('Item updated!');
      } else {
        await createMenuItem(payload);
        toast.getState().success('Item created!');
      }
      navigate('/admin/menu');
    } catch (err) {
      toast.getState().error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loadingItem) return <><PageHeader title="Edit Item" backTo="/admin/menu" /><Loading /></>;

  return (
    <>
      <PageHeader title={isEdit ? 'Edit Item' : 'New Item'} backTo="/admin/menu" />

      <form onSubmit={handleSubmit}>
        {/* ── Image Upload Section ── */}
        <div className="form-group">
          <label className="form-label">Item Photo</label>

          {/* Hidden file inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImagePick}
            style={{ display: 'none' }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: 'none' }}
          />

          {form.imageUrl ? (
            /* Image preview */
            <div className="image-preview-wrap">
              <img src={form.imageUrl} alt="Preview" className="image-preview" />
              <button type="button" className="image-remove-btn" onClick={removeImage}>
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            /* Upload buttons */
            <div className="image-upload-area">
              {uploading ? (
                <div className="image-uploading">
                  <Loader size={28} className="spin" />
                  <span>Uploading…</span>
                </div>
              ) : (
                <>
                  <button type="button" className="image-pick-btn" onClick={() => cameraRef.current?.click()}>
                    <Camera size={22} />
                    <span>Camera</span>
                  </button>
                  <button type="button" className="image-pick-btn" onClick={() => galleryRef.current?.click()}>
                    <ImagePlus size={22} />
                    <span>Gallery</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Fallback: paste URL */}
          <input
            className="form-input"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="Or paste image URL…"
            style={{ marginTop: 10 }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Item name" required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Short description of the item" rows={3} />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input className="form-input" type="number" name="price" value={form.price} onChange={handleChange} required min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Stock Qty</label>
            <input className="form-input" type="number" name="stockQty" value={form.stockQty} onChange={handleChange} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Min Stock</label>
            <input className="form-input" type="number" name="minStockQty" value={form.minStockQty} onChange={handleChange} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Prep Time (m)</label>
            <input className="form-input" type="number" name="prepTime" value={form.prepTime} onChange={handleChange} min={0} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Calories</label>
          <input className="form-input" type="number" name="calories" value={form.calories} onChange={handleChange} min={0} />
        </div>

        <div className="checkbox-row">
          <label className="checkbox-label">
            <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={handleChange} /> Vegetarian
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="isPopular" checked={form.isPopular} onChange={handleChange} /> Popular
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="available" checked={form.available} onChange={handleChange} /> Available
          </label>
          <label className="checkbox-label checkbox-special">
            <input type="checkbox" name="isTodaysSpecial" checked={form.isTodaysSpecial} onChange={handleChange} />
            <Sparkles size={14} /> Today's Special
          </label>
        </div>

        {form.isTodaysSpecial && (
          <div className="form-group">
            <label className="form-label">Special Label</label>
            <input className="form-input" name="specialLabel" value={form.specialLabel} onChange={handleChange} placeholder="e.g. Chef's Pick, New Launch, Limited" />
          </div>
        )}

        {/* Addons */}
        <h3 className="item-section-title">Add-ons</h3>
        {addons.map((a, i) => (
          <div key={i} className="addon-row">
            <span className="addon-row-text">{a.name} — ₹{a.price}</span>
            <button type="button" className="addon-remove-btn" onClick={() => removeAddon(i)}><X size={16} /></button>
          </div>
        ))}
        <div className="addon-input-row">
          <input className="form-input" placeholder="Addon name" value={addonName} onChange={(e) => setAddonName(e.target.value)} style={{ flex: 1 }} />
          <input className="form-input" type="number" placeholder="₹" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} style={{ width: 72 }} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addAddon} style={{ display: 'flex', alignItems: 'center' }}><Plus size={16} /></button>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting || uploading}>
          {submitting ? 'Saving…' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
      </form>
    </>
  );
}
