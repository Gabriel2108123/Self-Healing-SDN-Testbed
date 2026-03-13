import React from 'react';

/**
 * Reusable Status badge for labels such as: Running, Stopped, Mock Mode.
 */
export default function Badge({ label, type = 'info', className = '' }) {
  // Map type to existing badge styles from index.css or define inline styles
  let badgeClass = 'link-badge'; // fallback to some existing class shape
  if (type === 'success' || type === 'ok') badgeClass += ' badge-up';
  else if (type === 'error' || type === 'danger') badgeClass += ' badge-down';
  else if (type === 'warning') badgeClass += ' event-reroute';
  else badgeClass += ' event-info'; // info

  return (
    <span className={`${badgeClass} ${className}`}>
      {label}
    </span>
  );
}
