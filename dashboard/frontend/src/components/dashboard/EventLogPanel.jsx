import React from 'react';
import Panel from '../common/Panel';
import { formatTimeSec } from '../../utils/formatters';

export default function EventLogPanel({ state }) {
  const { events } = state;

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'error': return 'var(--red)';
      case 'warning': return 'var(--amber, orange)';
      case 'success': return 'var(--green)';
      default: return 'var(--blue)';
    }
  };

  return (
    <Panel title="System Event Timeline" className="event-log-panel">
      <div className="timeline-list" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: '400px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No events recorded
          </div>
        ) : (
          events.map((event, index) => {
            const isLast = index === events.length - 1;
            const color = getSeverityColor(event.severity);
            
            return (
              <div key={`${event.id}-${index}`} className="timeline-item" style={{ display: 'flex', gap: '1rem', minHeight: '60px' }}>
                <div className="timeline-dot-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                  <div 
                    className="timeline-dot" 
                    style={{ 
                      width: '12px', height: '12px', borderRadius: '50%', 
                      background: color, 
                      boxShadow: `0 0 6px ${color}`,
                      marginTop: '4px',
                      flexShrink: 0
                    }} 
                  />
                  {!isLast && <div className="timeline-connector" style={{ flex: 1, width: '2px', background: 'var(--border)', margin: '4px 0' }} />}
                </div>
                
                <div className="timeline-content" style={{ paddingBottom: '1rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span 
                      className="timeline-badge" 
                      style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 'bold', 
                        textTransform: 'uppercase', 
                        color: color, 
                        border: `1px solid ${color}`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}
                    >
                      {event.severity}
                    </span>
                    <span className="timeline-ts" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatTimeSec(event.timestamp)}
                    </span>
                  </div>
                  <div className="timeline-detail" style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.4 }}>
                    {event.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
