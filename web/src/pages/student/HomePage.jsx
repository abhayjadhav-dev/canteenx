import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuStore } from '../../store/useMenuStore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/Loading';
import { Search, X, Flame, BookOpen, Star, Frown, Sparkles, Clock, ArrowRight } from 'lucide-react';
import usePullToRefresh from '../../hooks/usePullToRefresh';

export default function HomePage() {
  const navigate = useNavigate();
  const { items, categories, loading, fetchMenu, fetchCategories } = useMenuStore();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const deferredSearch = useDeferredValue(search);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    await Promise.all([
      fetchCategories({ force: true }),
      fetchMenu(undefined, { force: true }),
    ]);
    if (showSpinner) setRefreshing(false);
  }, [fetchCategories, fetchMenu]);

  const pulling = usePullToRefresh(() => refresh(true), true);

  useEffect(() => {
    refresh(false);
    const interval = setInterval(() => refresh(false), 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = items;
    if (selectedCat) result = result.filter((i) => i.category?._id === selectedCat || i.category === selectedCat);
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedCat, deferredSearch]);

  const popular = useMemo(() => items.filter((i) => i.isPopular && i.available), [items]);
  const todaysSpecials = useMemo(() => items.filter((i) => i.isTodaysSpecial && i.available), [items]);
  const availableCount = useMemo(() => items.filter((i) => i.available).length, [items]);

  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      {/* Greeting */}
      <div className="greeting">
        <p className="greeting-sub">{greetingText()}, {user?.name?.split(' ')[0] || 'Student'} 👋</p>
        <h1 className="greeting-title">What would you like<br />to eat today?</h1>
      </div>

      {(pulling || refreshing) && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.8125rem' }}>
          {refreshing ? 'Refreshing menu...' : 'Release to refresh'}
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon"><Search size={18} /></span>
        <input type="text" placeholder="Search for dishes, drinks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch('')}><X size={16} /></button>
        )}
      </div>

      {/* Categories */}
      <div className="category-row">
        <button className={`category-chip ${!selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat(null)}>All</button>
        {categories.map((c) => (
          <button
            key={c._id}
            className={`category-chip ${selectedCat === c._id ? 'active' : ''}`}
            onClick={() => setSelectedCat(selectedCat === c._id ? null : c._id)}
          >{c.name}</button>
        ))}
      </div>

      {/* ── Today's Specials ── */}
      {!search && !selectedCat && todaysSpecials.length > 0 && (
        <div className="specials-section">
          <div className="section-header">
            <h2 className="section-title"><Sparkles size={18} className="section-icon accent-icon" /> Today's Special</h2>
          </div>
          <div className="specials-scroll">
            {todaysSpecials.map((item) => (
              <div key={item._id} className="special-card" onClick={() => navigate(`/student/item/${item._id}`)}>
                <div className="special-card-img-wrap">
                  <img
                    className="special-card-img"
                    src={item.imageUrl || 'https://placehold.co/280x160/f8f7f5/94a3b8?text=Special'}
                    alt={item.name}
                    loading="lazy"
                  />
                  {item.specialLabel && <span className="special-label">{item.specialLabel}</span>}
                  <span className="special-badge"><Sparkles size={12} /> Special</span>
                </div>
                <div className="special-card-body">
                  <div className="special-card-top">
                    <span className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                    <span className="special-card-name">{item.name}</span>
                  </div>
                  <p className="special-card-desc">{item.description}</p>
                  <div className="special-card-footer">
                    <span className="special-card-price">₹{item.price}</span>
                    <span className="special-card-time"><Clock size={12} /> {item.prepTime}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Popular ── */}
      {!search && !selectedCat && popular.length > 0 && (
        <>
          <div className="section-header">
            <h2 className="section-title"><Flame size={18} className="section-icon" /> Popular Right Now</h2>
          </div>
          <div className="menu-grid">
            {popular.slice(0, 4).map((item) => (
              <MenuCard key={item._id} item={item} onClick={() => navigate(`/student/item/${item._id}`)} />
            ))}
          </div>
        </>
      )}

      {/* ── Full menu / search results ── */}
      <div className="section-header">
        <h2 className="section-title">
          {search ? `Results for "${search}"` : selectedCat ? categories.find((c) => c._id === selectedCat)?.name || 'Menu' : <><BookOpen size={18} className="section-icon" /> Full Menu</>}
        </h2>
        {!search && !selectedCat && <span className="section-count">{availableCount} items</span>}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Frown size={48} color="var(--text-muted)" /></div>
          <h3>No items found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filtered.map((item) => (
            <MenuCard key={item._id} item={item} onClick={() => navigate(`/student/item/${item._id}`)} />
          ))}
        </div>
      )}
    </>
  );
}

const MenuCard = React.memo(function MenuCard({ item, onClick }) {
  return (
    <div className={`menu-card ${!item.available ? 'unavailable' : ''}`} onClick={onClick}>
      <div className="menu-card-img-wrap">
        <img
          className="menu-card-img"
          src={item.imageUrl || 'https://placehold.co/180x180/f8f7f5/94a3b8?text=No+Image'}
          alt={item.name}
          loading="lazy"
        />
        {item.isTodaysSpecial && <span className="card-special-dot"><Sparkles size={10} /></span>}
      </div>
      <div className="menu-card-info">
        <div className="menu-card-top">
          <span className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
          <span className="menu-card-name">{item.name}</span>
        </div>
        <p className="menu-card-desc">{item.description}</p>
        <div className="menu-card-footer">
          <span className="menu-card-price">₹{item.price}</span>
          <div className="menu-card-meta">
            {item.isPopular && <span className="popular-tag">Popular</span>}
            {item.rating > 0 && <span className="rating-tag"><Star size={11} /> {item.rating}</span>}
            {!item.available && <span className="unavailable-tag">Sold out</span>}
          </div>
        </div>
      </div>
    </div>
  );
});
