import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuStore } from '../../store/useMenuStore';
import { useToastStore } from '../../store/useToastStore';
import { toggleAvailability, toggleTodaysSpecial, deleteMenuItem } from '../../services/api';
import { resolveImageUrl } from '../../lib/imageUrl';
import PageHeader from '../../components/PageHeader';
import Loading from '../../components/Loading';
import { Search, UtensilsCrossed, Pencil, Trash2, Plus, Sparkles } from 'lucide-react';

export default function MenuManagePage() {
  const navigate = useNavigate();
  const { items, categories, loading, fetchMenu, fetchCategories } = useMenuStore();
  const toast = useToastStore;
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    fetchCategories();
    fetchMenu();
  }, []);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCat && (item.category?._id || item.category) !== selectedCat) return false;
      if (query && !item.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [items, selectedCat, deferredSearch]);

  const handleToggle = async (item) => {
    // Optimistic UI: flip availability immediately
    useMenuStore.setState((state) => ({
      items: state.items.map((i) =>
        i._id === item._id ? { ...i, available: !item.available } : i
      ),
    }));

    try {
      await toggleAvailability(item._id, !item.available);
      toast.getState().success(`${item.name} ${item.available ? 'disabled' : 'enabled'}`);
    } catch {
      // Revert on failure
      useMenuStore.setState((state) => ({
        items: state.items.map((i) =>
          i._id === item._id ? { ...i, available: item.available } : i
        ),
      }));
      toast.getState().error('Failed to toggle availability');
    }
  };

  const handleSpecialToggle = async (item) => {
    const next = !item.isTodaysSpecial;
    // Optimistic UI: toggle special flag immediately
    useMenuStore.setState((state) => ({
      items: state.items.map((i) =>
        i._id === item._id ? { ...i, isTodaysSpecial: next } : i
      ),
    }));

    try {
      await toggleTodaysSpecial(item._id, next);
      toast.getState().success(`${item.name} ${item.isTodaysSpecial ? 'removed from' : 'marked as'} today's special`);
    } catch {
      // Revert on failure
      useMenuStore.setState((state) => ({
        items: state.items.map((i) =>
          i._id === item._id ? { ...i, isTodaysSpecial: item.isTodaysSpecial } : i
        ),
      }));
      toast.getState().error('Failed to toggle special');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    // Optimistic UI: remove item from list immediately
    const prevItems = useMenuStore.getState().items;
    useMenuStore.setState({
      items: prevItems.filter((i) => i._id !== item._id),
    });

    try {
      await deleteMenuItem(item._id);
      toast.getState().success('Item deleted from menu');
    } catch (err) {
      // Revert on failure
      useMenuStore.setState({ items: prevItems });
      const message = err?.response?.data?.error || 'Failed to delete item';
      toast.getState().error(message);
    }
  };

  return (
    <>
      <PageHeader
        title="Menu"
        right={
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/admin/menu/new')}>
            <Plus size={16} /> Add
          </button>
        }
      />

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <span className="search-icon"><Search size={18} /></span>
        <input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      <div className="category-row" style={{ marginBottom: 16 }}>
        <button className={`category-chip ${!selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat(null)}>All</button>
        {categories.map((c) => (
          <button
            key={c._id}
            className={`category-chip ${selectedCat === c._id ? 'active' : ''}`}
            onClick={() => setSelectedCat(selectedCat === c._id ? null : c._id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><UtensilsCrossed size={48} color="var(--text-muted)" /></div>
          <h3>No items</h3>
          <p>Add your first menu item</p>
        </div>
      ) : (
        filtered.map((item) => (
          <div key={item._id} className="menu-manage-card">
            <img
              className="menu-manage-img"
              src={resolveImageUrl(item.imageUrl) || 'https://placehold.co/112/f8f7f5/94a3b8?text=...'}
              alt={item.name}
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/112/f8f7f5/94a3b8?text=...'; }}
            />
            <div className="menu-manage-info">
              <div className="menu-manage-name">
                {item.name}
                {item.isTodaysSpecial && <Sparkles size={12} className="special-inline-icon" />}
              </div>
              <div className="menu-manage-cat">{item.categoryName || item.category?.name} • Stock: {item.stockQty}</div>
              <div className="menu-manage-price">₹{item.price}</div>
            </div>
            <div className="menu-manage-right">
              <div
                className={`toggle ${item.available ? 'on' : ''}`}
                onClick={() => handleToggle(item)}
                title={item.available ? 'Available' : 'Unavailable'}
              />
              <button
                className={`btn-special-toggle ${item.isTodaysSpecial ? 'active' : ''}`}
                onClick={() => handleSpecialToggle(item)}
                title="Today's Special"
              >
                <Sparkles size={14} />
              </button>
              <div className="menu-manage-actions">
                <button className="btn-icon-sm btn-edit" onClick={() => navigate(`/admin/menu/edit/${item._id}`)}>
                  <Pencil size={14} />
                </button>
                <button className="btn-icon-sm btn-delete" onClick={() => handleDelete(item)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
