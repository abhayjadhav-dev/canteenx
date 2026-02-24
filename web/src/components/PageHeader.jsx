import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InstallPwaButton from './InstallPwaButton';

export default function PageHeader({ title, backTo, right }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      {backTo ? (
        <button className="navbar-back" onClick={() => navigate(backTo)}><ArrowLeft size={20} /></button>
      ) : (
        <div style={{ width: 38 }} />
      )}
      <span className="page-header-title">{title}</span>
      <div className="navbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InstallPwaButton />
          {right || <div style={{ width: 38 }} />}
        </div>
      </div>
    </div>
  );
}
