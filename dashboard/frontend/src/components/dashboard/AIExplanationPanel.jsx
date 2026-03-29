import React from 'react';
import Panel from '../common/Panel';
import { formatTimeSec } from '../../utils/formatters';

const IdeaIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent)' }}>
    <path d="M11.5 21a2.5 2.5 0 0 1-2.5-2.5h5A2.5 2.5 0 0 1 11.5 21z"></path>
    <path d="M14 15c1.4-1.2 2-3 2-4.5C16 7.4 13.6 5 11.5 5S7 7.4 7 10.5c0 1.5.6 3.3 2 4.5"></path>
    <line x1="11.5" y1="2" x2="11.5" y2="3"></line>
    <line x1="4.5" y1="10.5" x2="3" y2="10.5"></line>
    <line x1="20" y1="10.5" x2="18.5" y2="10.5"></line>
  </svg>
);

export default function AIExplanationPanel({ state }) {
  const { explanation, dashboard } = state;

  return (
    <Panel title="Plain-English Explanation" className="ai-explanation-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <IdeaIcon />
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>{explanation.title}</h4>
        </div>
        
        {explanation.sourceEventId && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Reference ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>{explanation.sourceEventId}</span>
          </div>
        )}
        
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>
          {explanation.body}
        </p>
      </div>
    </Panel>
  );
}
