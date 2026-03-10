/**
 * EventLog.jsx
 * ------------
 * Scrollable table of recent SDN events parsed from network_events.log.
 *
 * Props:
 *   events (object[]) – array of { timestamp, type, message }
 */

import React from 'react';

const TYPE_CONFIG = {
  failure:  { label: 'FAILURE',  cls: 'event-failure'  },
  recovery: { label: 'RECOVERY', cls: 'event-recovery' },
  reroute:  { label: 'REROUTE',  cls: 'event-reroute'  },
  info:     { label: 'INFO',     cls: 'event-info'      },
};

export default function EventLog({ events = [] }) {
  return (
    <div className="card event-log">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <h2 className="card-title">Event Log</h2>
        <span className="card-count">{events.length} events</span>
      </div>

      <div className="event-log-scroll">
        {events.length === 0 ? (
          <div className="empty-state">No events recorded yet.</div>
        ) : (
          <table className="event-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, idx) => {
                const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.info;
                return (
                  <tr key={idx} className={`event-row ${cfg.cls}`}>
                    <td className="event-time mono">{ev.timestamp || '—'}</td>
                    <td>
                      <span className={`event-badge ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="event-message">{ev.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
