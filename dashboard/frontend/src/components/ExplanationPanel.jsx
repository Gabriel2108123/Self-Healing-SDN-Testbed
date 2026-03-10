/**
 * ExplanationPanel.jsx
 * --------------------
 * Displays plain-English explanations of controller decisions.
 * Each entry: timestamp + title + explanation text.
 *
 * Props:
 *   explanations [{timestamp, title, explanation, type}]
 */

import React, { useState } from 'react';

const TYPE_ICON = {
  failure:  '⚠',
  reroute:  '⇄',
  recovery: '✓',
  info:     '●',
};
const TYPE_COLOR = {
  failure:  'var(--red)',
  reroute:  'var(--yellow)',
  recovery: 'var(--green)',
  info:     'var(--blue)',
};

export default function ExplanationPanel({ explanations = [] }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="card explanation-panel">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 className="card-title">AI Explainability</h2>
        <span className="card-count">{explanations.length} decisions</span>
      </div>

      <div className="explanation-intro">
        <p>
          Plain-English summary of each controller decision — what happened, why,
          and what the controller did in response.
        </p>
      </div>

      <div className="explanation-list">
        {explanations.length === 0 ? (
          <div className="empty-state">No controller decisions recorded yet.</div>
        ) : (
          explanations.map((ex, i) => {
            const color = TYPE_COLOR[ex.type] || TYPE_COLOR.info;
            const icon  = TYPE_ICON[ex.type]  || TYPE_ICON.info;
            const open  = expanded === i;
            return (
              <div
                key={i}
                className={`explanation-item ${open ? 'explanation-open' : ''}`}
                onClick={() => setExpanded(open ? null : i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setExpanded(open ? null : i)}
                style={{ '--ex-color': color }}
              >
                <div className="ex-icon" style={{ color }}>{icon}</div>
                <div className="ex-body">
                  <div className="ex-header-row">
                    <span className="ex-title">{ex.title}</span>
                    <span className="ex-ts mono">{ex.timestamp}</span>
                    <span className="ex-chevron">{open ? '▲' : '▼'}</span>
                  </div>
                  {open && (
                    <p className="ex-text">{ex.explanation}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
