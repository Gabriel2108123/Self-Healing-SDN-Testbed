/**
 * FailureTimeline.jsx
 * -------------------
 * Vertical event timeline showing failures → reroutes → recoveries over time.
 * Uses Recharts BarChart for event frequency visualization.
 *
 * Props:
 *   events  [{timestamp, type, link?, path?}]
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const TYPE_CFG = {
  failure:  { label: 'FAILURE',  color: '#f85149', icon: '▼', desc: 'Link failure detected' },
  reroute:  { label: 'REROUTE',  color: '#d29922', icon: '⇄', desc: 'Traffic rerouted'     },
  recovery: { label: 'RECOVERY', color: '#3fb950', icon: '▲', desc: 'Path restored'        },
  info:     { label: 'INFO',     color: '#58a6ff', icon: '●', desc: 'Controller event'     },
};

// Build bar chart data — count events per minute bucket
function buildChartData(events) {
  const buckets = {};
  events.forEach(ev => {
    // Take first 16 chars: "2026-03-10 10:24"
    const bucket = (ev.timestamp || '').slice(0, 16) || 'unknown';
    if (!buckets[bucket]) buckets[bucket] = { time: bucket, failure: 0, reroute: 0, recovery: 0 };
    if (buckets[bucket][ev.type] !== undefined) buckets[bucket][ev.type]++;
  });
  return Object.values(buckets).slice(-12); // last 12 minute-buckets
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function FailureTimeline({ events = [] }) {
  const chartData = buildChartData(events);

  return (
    <div className="card failure-timeline">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <h2 className="card-title">Failure Timeline</h2>
        <span className="card-count">{events.length} events</span>
      </div>

      <div className="timeline-layout">
        {/* Left: vertical event list */}
        <div className="timeline-list">
          {events.length === 0 ? (
            <div className="empty-state">No events recorded.</div>
          ) : (
            events.slice(0, 12).map((ev, i) => {
              const cfg = TYPE_CFG[ev.type] || TYPE_CFG.info;
              const detail = ev.link
                ? `Link: ${ev.link}`
                : ev.path
                  ? `Path: ${Array.isArray(ev.path) ? ev.path.join('→') : ev.path}`
                  : cfg.desc;
              return (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot-col">
                    <span className="timeline-dot" style={{ background: cfg.color }}>{cfg.icon}</span>
                    {i < events.length - 1 && <span className="timeline-connector"/>}
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="timeline-detail">{detail}</span>
                    <span className="timeline-ts mono">{ev.timestamp || '—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: bar chart */}
        {chartData.length > 0 && (
          <div className="timeline-chart">
            <p className="chart-label">Events per minute</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#7d8590', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                  angle={-45} textAnchor="end"
                />
                <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} allowDecimals={false}/>
                <RTooltip content={<CustomTooltip />}/>
                <Bar dataKey="failure"  fill="#f85149" stackId="a" radius={[0,0,0,0]}/>
                <Bar dataKey="reroute"  fill="#d29922" stackId="a"/>
                <Bar dataKey="recovery" fill="#3fb950" stackId="a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
