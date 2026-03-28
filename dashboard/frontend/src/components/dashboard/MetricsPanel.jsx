import React from 'react';
import Panel from '../common/Panel';

export default function MetricsPanel({ state }) {
  const { metrics } = state;
  return (
    <Panel title="Performance Metrics" className="metrics-panel">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        
        {/* Row 1: Timing */}
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Creation Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.creationTimeMs}ms</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discovery Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.discoveryTimeMs}ms</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Latency</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.averageLatencyMs}ms</div>
        </div>

        {/* Row 2: Failure & Recovery */}
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failure Detect Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.failureDetectionTimeMs > 0 ? 'var(--yellow)' : 'inherit' }}>{metrics.failureDetectionTimeMs > 0 ? `${metrics.failureDetectionTimeMs}ms` : '—'}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recovery Time</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.recoveryTimeMs > 0 ? 'var(--green)' : 'inherit' }}>{metrics.recoveryTimeMs > 0 ? `${metrics.recoveryTimeMs}ms` : '—'}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Flows</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{metrics.activeFlows}</div>
        </div>

        {/* Row 3: Strategy & Predictions */}
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted Risk</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.predictedRisk === 'High' ? 'var(--red)' : metrics.predictedRisk === 'Medium' ? 'var(--yellow)' : 'var(--green)' }}>{metrics.predictedRisk || 'None'}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted Issue</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>{metrics.predictedIssue || 'None'}</div>
        </div>
        
        <div style={{ background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Path Strategy</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'capitalize' }}>{metrics.pathStrategy || 'Single Path'}</div>
        </div>

        {/* Row 4: Health Bar */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--r-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Score</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.healthScore < 95 ? 'var(--red)' : metrics.healthScore < 100 ? 'var(--yellow)' : 'var(--green)' }}>
              {metrics.healthScore}/100
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: metrics.healthScore < 95 ? 'var(--red)' : metrics.healthScore < 100 ? 'var(--yellow)' : 'var(--green)', width: `${metrics.healthScore}%`, transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>

      </div>
    </Panel>
  );
}
