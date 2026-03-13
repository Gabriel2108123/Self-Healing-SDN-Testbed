import React from 'react';
import Panel from '../common/Panel';

export default function TopologyCanvas({ state }) {
  const { topology, failedLink } = state;
  const { type, switchCount, status } = topology;
  
  if (status === 'stopped' || status === 'idle') {
    return (
      <Panel title="Network Visualisation" className="topology-canvas-panel">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Network is currently offline.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Configure and launch a topology to view it here.</p>
        </div>
      </Panel>
    );
  }

  // Calculate node positions in a circle for simplicity
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 120;
  
  const nodes = [];
  for (let i = 0; i < switchCount; i++) {
    const angle = (i / switchCount) * 2 * Math.PI - Math.PI / 2;
    nodes.push({
      id: `s${i + 1}`,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      label: `S${i + 1}`
    });
  }

  const links = [];
  
  // Decide which links are failed
  const isFailed = (s1, s2) => {
    if (!failedLink) return false;
    return (failedLink.source === s1 && failedLink.target === s2) || 
           (failedLink.source === s2 && failedLink.target === s1);
  };

  if (type === 'ring') {
    for (let i = 0; i < switchCount; i++) {
      const source = nodes[i];
      const target = nodes[(i + 1) % switchCount];
      links.push({
        source, target,
        failed: isFailed(source.id, target.id)
      });
    }
  } else {
    // mesh - connect every node to every other node
    for (let i = 0; i < switchCount; i++) {
      for (let j = i + 1; j < switchCount; j++) {
        const source = nodes[i];
        const target = nodes[j];
        links.push({
          source, target,
          failed: isFailed(source.id, target.id)
        });
      }
    }
  }

  return (
    <Panel title="Network Visualisation" className="topology-canvas-panel">
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg  width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Links */}
          {links.map((link, idx) => (
            <line 
              key={idx}
              x1={link.source.x} y1={link.source.y}
              x2={link.target.x} y2={link.target.y}
              stroke={link.failed ? 'var(--red)' : 'var(--border)'}
              strokeWidth={link.failed ? 3 : 2}
              strokeDasharray={link.failed ? '4 4' : 'none'}
            />
          ))}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={18} fill="var(--surface2)" stroke="var(--accent)" strokeWidth={2} />
              <text x={node.x} y={node.y} fill="var(--text)" fontSize="12" fontWeight="bold" textAnchor="middle" dy=".3em">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'var(--border)' }}></span> Active Link
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', borderBottom: '2px dashed var(--red)' }}></span> Failed Link
        </div>
      </div>
    </Panel>
  );
}
