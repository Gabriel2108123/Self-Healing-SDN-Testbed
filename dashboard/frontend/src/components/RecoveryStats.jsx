/**
 * RecoveryStats.jsx
 * -----------------
 * KPI cards for recovery performance metrics.
 *
 * Props:
 *   stats { failuresDetected, recoveriesCompleted, averageRecoveryTime,
 *           lastRecoveryTime, availability }
 */

import React from 'react';

function KPI({ label, value, unit = '', color = 'var(--green)', sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color }}>{value}<span className="kpi-unit">{unit}</span></div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function RecoveryStats({ stats = {} }) {
  const {
    failuresDetected    = 0,
    recoveriesCompleted = 0,
    averageRecoveryTime = 0,
    lastRecoveryTime    = 0,
    availability        = 100,
  } = stats;

  const avgColor  = averageRecoveryTime > 3 ? 'var(--red)' : averageRecoveryTime > 1.5 ? 'var(--yellow)' : 'var(--green)';
  const availColor = availability >= 99 ? 'var(--green)' : availability >= 95 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="card recovery-stats-card">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2 className="card-title">Recovery Performance</h2>
      </div>
      <div className="kpi-grid">
        <KPI label="Failures Detected"    value={failuresDetected}    color="var(--red)"   />
        <KPI label="Recoveries Completed" value={recoveriesCompleted} color="var(--green)" />
        <KPI label="Avg Recovery Time"    value={averageRecoveryTime.toFixed(2)} unit="s"
             color={avgColor} sub="per failure event" />
        <KPI label="Last Recovery Time"   value={lastRecoveryTime.toFixed(2)}   unit="s"
             color={avgColor} />
        <KPI label="Availability"         value={availability.toFixed(1)} unit="%"
             color={availColor} sub="uptime estimate" />
      </div>
    </div>
  );
}
