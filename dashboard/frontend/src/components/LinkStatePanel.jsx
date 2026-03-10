/**
 * LinkStatePanel.jsx
 * ------------------
 * Table showing per-link UP/DOWN state from monitor_state.log.
 *
 * Props:
 *   linkStates (object[]) – [{ link, state, timestamp }]
 */

import React from 'react';

// Default link list so the table always has rows even if no monitor log data
const DEFAULT_LINKS = ['h1-s1', 's1-s2', 's1-s3', 's3-s2', 's2-h2'];

export default function LinkStatePanel({ linkStates = [] }) {
  // Build a map from link name → state
  const stateMap = {};
  linkStates.forEach(ls => { stateMap[ls.link] = ls; });

  // Merge with defaults so all links are always shown
  const rows = DEFAULT_LINKS.map(link => {
    if (stateMap[link]) return stateMap[link];
    return { link, state: 'UNKNOWN', timestamp: '' };
  });

  return (
    <div className="card link-state-panel">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <h2 className="card-title">Link States</h2>
      </div>

      <table className="link-table">
        <thead>
          <tr>
            <th>Link</th>
            <th>State</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ls, idx) => {
            const isUp      = ls.state === 'UP';
            const isDown    = ls.state === 'DOWN';
            const rowCls    = isUp ? 'link-up' : isDown ? 'link-down' : 'link-unknown';
            const stateCls  = isUp ? 'badge-up' : isDown ? 'badge-down' : 'badge-unknown';
            return (
              <tr key={idx} className={`link-row ${rowCls}`}>
                <td className="link-name mono">{ls.link}</td>
                <td>
                  <span className={`link-badge ${stateCls}`}>
                    {isUp ? '▲ UP' : isDown ? '▼ DOWN' : '? UNKNOWN'}
                  </span>
                </td>
                <td className="link-time mono">{ls.timestamp || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
