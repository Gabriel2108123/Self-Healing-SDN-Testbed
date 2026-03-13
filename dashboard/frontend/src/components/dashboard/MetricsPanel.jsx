import React from 'react';
import Panel from '../common/Panel';

export default function MetricsPanel({ state }) {
  const { metrics } = state;
  return (
    <Panel title="Performance Metrics" className="metrics-panel">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discovery Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.discoveryTime}</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Creation Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.creationTime}</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failure Detection</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.failureDetectionTime !== '—' ? 'var(--yellow)' : 'inherit' }}>{metrics.failureDetectionTime}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recovery Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.recoveryTime !== '—' ? 'var(--green)' : 'inherit' }}>{metrics.recoveryTime}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Flows</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.activeFlows}</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Latency</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.averageLatency}</div>
        </div>
        
        <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Score</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.healthScore < 80 ? 'var(--red)' : metrics.healthScore < 95 ? 'var(--yellow)' : 'var(--green)' }}>
              {metrics.healthScore}/100
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: metrics.healthScore < 80 ? 'var(--red)' : metrics.healthScore < 95 ? 'var(--yellow)' : 'var(--green)', width: `${metrics.healthScore}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>

      </div>
    </Panel>
  );
}
