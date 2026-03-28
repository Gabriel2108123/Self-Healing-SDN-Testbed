import React from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';

export default function EventLogPanel({ state }) {
  const { events } = state;

  return (
    <Panel title="System Event Log" className="event-log-panel">
      <div className="event-log-scroll" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        <table className="event-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Timestamp</th>
              <th style={{ width: '100px' }}>Severity</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={`${event.id}-${index}`} className="event-row">
                <td className="event-time" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(event.timestamp).toLocaleTimeString([], { hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td>
                  <Badge 
                    label={event.severity.toUpperCase()} 
                    type={event.severity === 'error' ? 'danger' : event.severity === 'warning' ? 'warning' : event.severity === 'success' ? 'success' : 'info'} 
                  />
                </td>
                <td className="event-message" style={{ fontSize: '0.85rem', color: event.severity === 'error' ? 'var(--red)' : event.severity === 'warning' ? 'var(--yellow)' : 'inherit' }}>{event.message}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No events recorded</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
