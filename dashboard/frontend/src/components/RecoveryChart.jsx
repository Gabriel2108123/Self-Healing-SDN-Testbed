/**
 * RecoveryChart.jsx
 * -----------------
 * Two charts:
 *   1. BarChart  — recovery time per failure event
 *   2. LineChart — recovery time trend over time
 *
 * Props:
 *   stats { recoveryTimes: number[], recoveryEvents: [{timestamp, duration}] }
 */

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.dataKey}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}s
        </p>
      ))}
    </div>
  );
};

export default function RecoveryChart({ stats = {} }) {
  const { recoveryTimes = [], recoveryEvents = [] } = stats;

  // Bar chart data: one bar per failure event
  const barData = (recoveryEvents.length > 0 ? recoveryEvents : recoveryTimes.map((t, i) => ({
    timestamp: `Event ${i + 1}`,
    duration: t,
  }))).map((ev, i) => ({
    name: ev.timestamp
      ? (ev.timestamp.slice(11, 16) || `#${i + 1}`)
      : `#${i + 1}`,
    'Recovery (s)': typeof ev.duration === 'number' ? ev.duration : ev,
  }));

  // Line chart data: trend
  const lineData = barData.map((d, i) => ({
    ...d,
    index: i + 1,
  }));

  const avg = recoveryTimes.length
    ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
    : 0;

  if (!barData.length) {
    return (
      <div className="card recovery-chart-card">
        <div className="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          <h2 className="card-title">Recovery Time Charts</h2>
        </div>
        <div className="empty-state">No recovery events recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="card recovery-chart-card">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
        <h2 className="card-title">Recovery Time Charts</h2>
      </div>

      <div className="charts-row">
        {/* Bar chart */}
        <div className="chart-wrap">
          <p className="chart-label">Recovery time per failure (seconds)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 8, right: 16, left: -12, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d"/>
              <XAxis dataKey="name" tick={{ fill: '#7d8590', fontSize: 10 }} angle={-30} textAnchor="end"/>
              <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} unit="s"/>
              <RTooltip content={<CustomTooltip />}/>
              <ReferenceLine y={avg} stroke="#d29922" strokeDasharray="4 3"
                label={{ value: `avg ${avg.toFixed(2)}s`, fill: '#d29922', fontSize: 10 }}/>
              <Bar dataKey="Recovery (s)" fill="#3fb950" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart */}
        <div className="chart-wrap">
          <p className="chart-label">Recovery time trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d"/>
              <XAxis dataKey="index" tick={{ fill: '#7d8590', fontSize: 10 }} label={{ value: 'Event #', position: 'insideBottom', offset: -2, fill: '#7d8590', fontSize: 10 }}/>
              <YAxis tick={{ fill: '#7d8590', fontSize: 10 }} unit="s"/>
              <RTooltip content={<CustomTooltip />}/>
              <ReferenceLine y={avg} stroke="#d29922" strokeDasharray="4 3"/>
              <Line
                type="monotoneX"
                dataKey="Recovery (s)"
                stroke="#58a6ff"
                strokeWidth={2.5}
                dot={{ fill: '#58a6ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
