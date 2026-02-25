import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ICONS = { success: <CheckCircle size={18} />, error: <XCircle size={18} />, info: <Info size={18} /> };

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span style={{ display: 'flex', alignItems: 'center' }}>{ICONS[t.type] || ''}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
