/**
 * TopologyPanel.jsx
 * -----------------
 * SVG network diagram for the topology:
 *
 *   h1 — s1 — s2 — h2
 *          \  /
 *           s3  (backup path)
 *
 * Props:
 *   activePath      (number[])  – e.g. [1,2] or [1,3,2]
 *   pathIsFailover  (boolean)   – true when using backup path
 *   linkStates      (object[])  – [{ link, state }]  e.g. { link:"s1-s2", state:"DOWN" }
 */

import React from 'react';

// Node positions in the SVG viewBox (800 × 340)
const NODES = {
  h1: { x: 80,  y: 170, label: 'h1', type: 'host'   },
  s1: { x: 240, y: 170, label: 's1', type: 'switch'  },
  s2: { x: 560, y: 170, label: 's2', type: 'switch'  },
  s3: { x: 400, y: 300, label: 's3', type: 'switch'  },
  h2: { x: 720, y: 170, label: 'h2', type: 'host'    },
};

// All links in the diagram
const LINKS = [
  { id: 'h1-s1', a: 'h1', b: 's1', primary: false,  backup: false },
  { id: 's1-s2', a: 's1', b: 's2', primary: true,   backup: false },
  { id: 's2-h2', a: 's2', b: 'h2', primary: false,  backup: false },
  { id: 's1-s3', a: 's1', b: 's3', primary: false,  backup: true  },
  { id: 's3-s2', a: 's3', b: 's2', primary: false,  backup: true  },
];

function getLinkState(linkId, linkStates) {
  if (!linkStates) return 'UP';
  const found = linkStates.find(
    l => l.link === linkId || l.link === linkId.split('-').reverse().join('-')
  );
  return found ? found.state : 'UP';
}

function isActivePath(linkId, activePath) {
  // activePath is an array of switch numbers, e.g. [1,2] or [1,3,2]
  // We map switch numbers to node IDs
  const switchMap = { 1: 's1', 2: 's2', 3: 's3' };
  if (!activePath || activePath.length < 2) return false;

  // Build edges from the active path
  const edges = [];
  for (let i = 0; i < activePath.length - 1; i++) {
    const a = switchMap[activePath[i]];
    const b = switchMap[activePath[i + 1]];
    if (a && b) {
      edges.push(`${a}-${b}`);
      edges.push(`${b}-${a}`);
    }
  }
  // Also treat h1-s1 and s2-h2 as always on the active path
  edges.push('h1-s1', 's1-h1', 's2-h2', 'h2-s2');
  return edges.includes(linkId);
}

export default function TopologyPanel({ activePath, pathIsFailover, linkStates }) {
  return (
    <div className="card topology-panel">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="card-icon">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <h2 className="card-title">Network Topology</h2>
        <span className={`path-badge ${pathIsFailover ? 'path-failover' : 'path-normal'}`}>
          {pathIsFailover ? '⚠ Failover Path' : '✓ Normal Path'}
        </span>
      </div>

      <div className="topology-svg-wrap">
        <svg
          viewBox="0 0 800 360"
          className="topology-svg"
          aria-label="Network topology diagram"
        >
          {/* ---- Links ---- */}
          {LINKS.map(link => {
            const a = NODES[link.a];
            const b = NODES[link.b];
            const active   = isActivePath(link.id, activePath);
            const state    = getLinkState(link.id, linkStates);
            const isDown   = state === 'DOWN';

            let stroke = 'var(--border)';
            if (isDown)  stroke = 'var(--red)';
            else if (active) stroke = pathIsFailover && link.backup
              ? 'var(--yellow)'
              : 'var(--green)';
            else if (link.backup) stroke = 'var(--text-muted)';

            return (
              <g key={link.id}>
                <line
                  x1={a.x} y1={a.y}
                  x2={b.x} y2={b.y}
                  stroke={stroke}
                  strokeWidth={active ? 4 : 2}
                  strokeDasharray={isDown ? '8 4' : link.backup && !active ? '6 4' : 'none'}
                  className="topo-link"
                />
                {/* Link label */}
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 10}
                  textAnchor="middle"
                  className="topo-link-label"
                  fill={isDown ? 'var(--red)' : 'var(--text-muted)'}
                >
                  {isDown ? '✗ DOWN' : link.id}
                </text>
              </g>
            );
          })}

          {/* ---- Nodes ---- */}
          {Object.entries(NODES).map(([id, node]) => {
            const isHost   = node.type === 'host';
            const nodeSize = isHost ? 28 : 32;
            const fill     = isHost ? 'var(--surface2)' : 'var(--accent-dim)';
            const stroke   = isHost ? 'var(--blue)' : 'var(--accent)';

            return (
              <g key={id} className="topo-node">
                {isHost ? (
                  // Host: rounded rectangle
                  <rect
                    x={node.x - nodeSize / 1.4}
                    y={node.y - nodeSize / 2}
                    width={nodeSize * 1.4}
                    height={nodeSize}
                    rx="8"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                  />
                ) : (
                  // Switch: circle
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeSize}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="2"
                  />
                )}
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="topo-node-label"
                  fill="var(--text)"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="topo-legend">
        <span className="legend-item"><span className="legend-line legend-active"/>&nbsp;Active path</span>
        <span className="legend-item"><span className="legend-line legend-backup"/>&nbsp;Backup path</span>
        <span className="legend-item"><span className="legend-line legend-down"/>&nbsp;Link down</span>
      </div>
    </div>
  );
}
