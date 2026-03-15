import React from 'react';
import { MOCK_MODE } from '../config.js';

export default function Header({ lastRefreshed, onRefresh, wsConnected }) {
  const timeStr = lastRefreshed ? lastRefreshed.toLocaleTimeString() : '—';

  return (
    <header className="header">
      <div className="header-left">
        <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5"  r="2"/>
          <circle cx="5"  cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
          <line x1="12" y1="7"  x2="5"  y2="17"/>
          <line x1="12" y1="7"  x2="19" y2="17"/>
          <line x1="5"  y1="17" x2="19" y2="17"/>
        </svg>
        <div>
          <h1 className="header-title">Self-Healing SDN Testbed</h1>
          <p className="header-subtitle">Network Operations Dashboard</p>
        </div>
      </div>

      <div className="header-right">
        <span className={`mode-badge ${MOCK_MODE ? 'mode-mock' : 'mode-live'}`}>
          <span className="mode-dot" />
          {MOCK_MODE ? 'MOCK MODE' : wsConnected ? '⚡ LIVE (WS)' : '🔄 LIVE (poll)'}
        </span>

        <span className="refresh-time">
          Updated: <strong>{timeStr}</strong>
        </span>

        <button className="btn-refresh" onClick={onRefresh} title="Refresh now">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
