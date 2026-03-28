import React from 'react';
import Panel from '../common/Panel';

export default function AIExplanationPanel({ state }) {
  const { explanation, dashboard } = state;

  return (
    <Panel title="AI Network Analysis" className="ai-explanation-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>{explanation.title}</h4>
        
        {explanation.sourceEventId && (
          <div style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase' }}>
            Based on event: <span style={{ fontFamily: 'monospace' }}>{explanation.sourceEventId}</span>
          </div>
        )}
        
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>
          {explanation.body}
        </p>

        {dashboard.mockMode && (
          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> Explanations are currently generated from static templates based on dashboard interactions. In later phases, this will be powered by a live AI model analyzing the SDN controller state.
          </div>
        )}
      </div>
    </Panel>
  );
}
