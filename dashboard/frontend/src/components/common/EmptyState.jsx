import React from 'react';

/**
 * Used if panels have no data.
 */
export default function EmptyState({ message = 'No data available', icon, className = '' }) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div style={{ marginBottom: '1rem', color: 'var(--text-faint)' }}>{icon}</div>}
      <p>{message}</p>
    </div>
  );
}
