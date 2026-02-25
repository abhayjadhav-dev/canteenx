import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import PageHeader from '../../components/PageHeader';

export default function StudentNotificationsPage() {
  const notifications = useNotificationStore((s) =>
    s.notifications.filter((n) => n.scope === 'student')
  );
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    markAllRead('student');
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
          <p>We&apos;ll let you know when something changes.</p>
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

