import React, { useEffect, useState } from 'react';

export default function Topbar({ state, onRefresh }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
          <p className="header-subtitle" style={{ color: 'var(--text-muted)' }}>Real-time failure simulation, recovery monitoring, and adaptive network insight</p>
        </div>
      </div>

      <div className="header-right">
        <span className={`mode-badge mode-${state.dashboard.controllerStatus === 'online' ? 'live' : 'mock'}`}>
          <span className="mode-dot" style={{ animationPlayState: state.dashboard.controllerStatus === 'online' ? 'running' : 'paused' }} />
          Controller: {state.dashboard.controllerStatus.toUpperCase()}
        </span>
        <span className={`mode-badge mode-${state.topology.status === 'running' ? 'live' : (state.topology.status === 'error' ? 'mock' : 'neutral')}`}>
          Runtime: {state.topology.status.toUpperCase()}
        </span>
        <span className="mode-badge" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
          Topology: {state.topology.type.toUpperCase() || 'NONE'}
        </span>

        <button className="btn-refresh" onClick={onRefresh} title="Reset Network Topology">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
