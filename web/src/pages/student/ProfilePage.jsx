import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import PageHeader from '../../components/PageHeader';
import { LogOut, User, BadgeCheck, CalendarDays, Bell } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateNotificationPrefs } = useAuthStore();
  const toast = useToastStore;

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  if (!user) return null;

  const prefs = user.notificationPrefs || {
    orderReady: true,
    orderCancelled: true,
    adminNewOrder: true,
    adminLowInventory: true,
  };

  const handleToggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    try {
      await updateNotificationPrefs(next);
      toast.getState().success('Notification preferences updated');
    } catch (err) {
      toast.getState().error(err.message || 'Failed to update preferences');
    }
  };

  return (
    <>
      <PageHeader title="Profile" />

      {/* Avatar */}
      <div className="profile-avatar">{user.name?.charAt(0) || '?'}</div>
      <div className="profile-name">{user.name}</div>
      <div className="profile-email">{user.email}</div>

      {/* Wallet */}
      <div className="wallet-card">
        <div className="wallet-label">Wallet Balance</div>
        <div className="wallet-balance">₹{user.walletBalance?.toFixed(2) || '0.00'}</div>
      </div>

      {/* Info */}
      <div className="card profile-card">
        <div className="card-body">
          <div className="profile-info-row">
            <span className="profile-info-label"><BadgeCheck size={14} className="inline-icon" /> Student ID</span>
            <span className="profile-info-value">{user.studentId || '—'}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label"><User size={14} className="inline-icon" /> Role</span>
            <span className="profile-info-value profile-role">{user.role}</span>
          </div>
          <div className="profile-info-row profile-info-row-last">
            <span className="profile-info-label"><CalendarDays size={14} className="inline-icon" /> Joined</span>
            <span className="profile-info-value">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card profile-card" style={{ marginTop: 16 }}>
        <div className="card-body">
          <div className="profile-info-row">
            <span className="profile-info-label"><Bell size={14} className="inline-icon" /> Order ready</span>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!prefs.orderReady}
                onChange={() => handleToggle('orderReady')}
              />
              Enabled
            </label>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label"><Bell size={14} className="inline-icon" /> Order cancelled</span>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={!!prefs.orderCancelled}
                onChange={() => handleToggle('orderCancelled')}
              />
              Enabled
            </label>
          </div>
          {user.role !== 'student' && (
            <>
              <div className="profile-info-row">
                <span className="profile-info-label"><Bell size={14} className="inline-icon" /> New orders (admin)</span>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!prefs.adminNewOrder}
                    onChange={() => handleToggle('adminNewOrder')}
                  />
                  Enabled
                </label>
              </div>
              <div className="profile-info-row profile-info-row-last">
                <span className="profile-info-label"><Bell size={14} className="inline-icon" /> Low inventory (admin)</span>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!prefs.adminLowInventory}
                    onChange={() => handleToggle('adminLowInventory')}
                  />
                  Enabled
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout */}
      <button className="btn-signout-profile" onClick={handleLogout}>
        <LogOut size={18} /> Sign Out
      </button>
    </>
  );
}
