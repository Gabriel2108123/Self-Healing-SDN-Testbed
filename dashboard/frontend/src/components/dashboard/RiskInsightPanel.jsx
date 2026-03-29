import React from 'react';
import Panel from '../common/Panel';

export default function RiskInsightPanel({ state }) {
  const { riskyLinks = [], riskSummary = { count: 0, level: 'low', message: '' } } = state;

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'var(--red, #dc3545)';
      case 'medium': return 'var(--amber, orange)';
      case 'low': return 'var(--green, #28a745)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <Panel title="Risk Insights" className="risk-insight-panel">
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span 
          style={{ 
            display: 'inline-block',
            padding: '0.2rem 0.6rem', 
            borderRadius: '4px', 
            background: getLevelColor(riskSummary.level), 
            color: '#fff',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem'
          }}
        >
          {riskSummary.level || 'Unknown'} Level
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {riskSummary.message || (riskyLinks.length === 0 ? 'No elevated-risk links detected.' : '')}
        </span>
      </div>

      {riskyLinks.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 32, height: 32, opacity: 0.5, marginBottom: '0.5rem' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: '0.85rem' }}>Network currently stable. No elevated-risk links detected.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {riskyLinks.map((link, idx) => (
            <div 
              key={`risk-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: link.status === 'failed' ? 'var(--red-dim, rgba(248, 81, 73, 0.1))' : 'var(--yellow-dim, rgba(210, 153, 34, 0.1))',
                padding: '0.75rem',
                borderRadius: '6px',
                borderLeft: `4px solid ${link.status === 'failed' ? 'var(--red)' : 'var(--amber, orange)'}`
              }}
            >
              <div>
                <strong style={{ display: 'block' }}>{link.source} <span style={{ color: 'var(--text-muted)' }}>↔</span> {link.target}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  State: {link.status} | Failures: {link.failure_count || 0}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: link.status === 'failed' ? 'var(--red)' : 'var(--amber, orange)' }}>
                  {link.risk_score ? link.risk_score.toFixed(1) : 'N/A'}
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
