import React from 'react';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
}
