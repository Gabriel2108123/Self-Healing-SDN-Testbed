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

  const width = 700;
  const height = 450;
  const cx = width / 2;
  const cy = height / 2;
  const switchRadius = 130;
  const hostOffset = 60;

  // Compute Layout (Circular for switches, star for hosts)
  const renderData = React.useMemo(() => {
    const rawNodes = topology.graph?.nodes || [];
    const rawLinks = topology.graph?.links || [];

    const switches = rawNodes.filter(n => n.type === 'switch');
    const hosts = rawNodes.filter(n => n.type === 'host');

    const mappedNodes = {};

    switches.forEach((n, i) => {
      const angle = (i / switches.length) * 2 * Math.PI - Math.PI / 2;
      mappedNodes[n.id] = {
        ...n,
        x: n.x ?? cx + switchRadius * Math.cos(angle),
        y: n.y ?? cy + switchRadius * Math.sin(angle)
      };
    });

    hosts.forEach((h) => {
      const parentLink = rawLinks.find(l => l.source === h.id || l.target === h.id);
      if (parentLink) {
        const switchId = parentLink.source === h.id ? parentLink.target : parentLink.source;
        const parentNode = mappedNodes[switchId];
        if (parentNode) {
          const dx = parentNode.x - cx;
          const dy = parentNode.y - cy;
          const distance = Math.sqrt(dx*dx + dy*dy) || 1;
          mappedNodes[h.id] = {
            ...h,
            x: h.x ?? parentNode.x + (dx / distance) * hostOffset,
            y: h.y ?? parentNode.y + (dy / distance) * hostOffset
          };
          return;
        }
      }
      // Fallback
      mappedNodes[h.id] = { ...h, x: cx, y: cy };
    });

    const renderedLinks = rawLinks.map(l => {
      return {
        ...l,
        sourceNode: mappedNodes[l.source],
        targetNode: mappedNodes[l.target]
      };
    }).filter(l => l.sourceNode && l.targetNode);

    return { nodes: Object.values(mappedNodes), links: renderedLinks };
  }, [topology.graph, switchCount]);

  const { nodes, links } = renderData;

  const getLinkColor = (link) => {
    if (link.kind === 'switch' && link.status === 'failed') return 'var(--red)';
    if (link.kind === 'host') return 'var(--text-muted)';
    return 'var(--border)';
  };

  const getPathStrategyBadge = () => {
    const strat = topology.activePathStrategy || 'single-path';
    return strat.includes('rerout') || strat.includes('load') ? 'var(--blue)' : 'var(--text-muted)';
  };

  return (
    <Panel title="Network Visualisation" className="topology-canvas-panel">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: getPathStrategyBadge(), color: '#fff', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
          {topology.activePathStrategy || 'Wait'}
        </span>
      </div>
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Links */}
          {links.map((link, idx) => (
            <line 
              key={`link-${idx}`}
              x1={link.sourceNode.x} y1={link.sourceNode.y}
              x2={link.targetNode.x} y2={link.targetNode.y}
              stroke={getLinkColor(link)}
              strokeWidth={link.kind === 'switch' && link.status === 'failed' ? 4 : (link.kind === 'switch' ? 2 : 1)}
              strokeDasharray={link.status === 'failed' ? '6 6' : 'none'}
            >
               <title>{`${link.source} <-> ${link.target}\nKind: ${link.kind || 'switch'}\nStatus: ${link.status || 'unknown'}`}</title>
            </line>
          ))}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle 
                cx={node.x} cy={node.y} 
                r={node.type === 'host' ? 8 : 22} 
                fill={node.type === 'host' ? "var(--surface3)" : "var(--surface2)"} 
                stroke={node.status === 'down' ? "var(--red)" : "var(--accent)"} 
                strokeWidth={2} 
              />
              <text x={node.x} y={node.y} fill="var(--text)" fontSize={node.type === 'host' ? "10" : "12"} fontWeight="bold" textAnchor="middle" dy=".3em">
                {node.label}
              </text>
              <title>{`Node: ${node.id}\nType: ${node.type}\nStatus: ${node.status}`}</title>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'var(--border)' }}></span> Active Switch Link
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '1px', background: 'var(--text-muted)' }}></span> Host Link
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', borderBottom: '3px dashed var(--red)' }}></span> Failed Link
        </div>
      </div>
    </Panel>
  );
}
