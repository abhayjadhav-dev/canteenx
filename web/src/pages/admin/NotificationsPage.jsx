import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import PageHeader from '../../components/PageHeader';

export default function AdminNotificationsPage() {
  const notifications = useNotificationStore((s) =>
    s.notifications.filter((n) => n.scope === 'admin')
  );
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    markAllRead('admin');
  }, [markAllRead]);

  const items = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <>
      <PageHeader title="Notifications" />
      {items.length === 0 ? (
        <div className="empty-state">
          <h3>No notifications</h3>
          <p>You&apos;ll see new orders and inventory alerts here.</p>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => (
            <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-message">{n.message}</div>
              <div className="notif-time">
                {new Date(n.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

