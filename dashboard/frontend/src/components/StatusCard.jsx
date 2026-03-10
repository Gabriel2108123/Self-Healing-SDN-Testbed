/**
 * StatusCard.jsx
 * --------------
 * Reusable metric card.
 *
 * Props:
 *   title   (string)  – label above the value
 *   value   (string)  – main displayed value
 *   status  (string)  – 'ok' | 'warning' | 'error' | 'info' — controls colour dot
 *   icon    (node)    – optional SVG element
 *   sub     (string)  – optional secondary line below value
 */

import React from 'react';

const STATUS_COLORS = {
  ok:      'var(--green)',
  warning: 'var(--yellow)',
  error:   'var(--red)',
  info:    'var(--blue)',
};

export default function StatusCard({ title, value, status = 'info', icon, sub }) {
  const dotColor = STATUS_COLORS[status] || 'var(--blue)';

  return (
    <div className={`card status-card status-card--${status}`}>
      <div className="status-card-header">
        {icon && <span className="status-card-icon">{icon}</span>}
        <span className="status-card-title">{title}</span>
        <span className="status-dot" style={{ background: dotColor }} />
      </div>
      <div className="status-card-value">{value}</div>
      {sub && <div className="status-card-sub">{sub}</div>}
    </div>
  );
}
