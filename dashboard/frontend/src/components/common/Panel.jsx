import React from 'react';

/**
 * Reusable container card with title area and content area.
 */
export default function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div className="panel-action">{action}</div>}
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
}
