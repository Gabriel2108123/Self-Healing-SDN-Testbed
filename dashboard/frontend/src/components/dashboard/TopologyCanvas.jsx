import React from 'react';
import Panel from '../common/Panel';
import { normalizeLinkKey } from '../../hooks/useDashboardState';

export default function TopologyCanvas({ state }) {
  const { topology, linkStates, riskyLinks } = state;
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

  const width = 800;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  const switchRadius = 150;
  const hostOffset = 80;

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

  const getLinkProps = (link) => {
    let stroke = 'var(--text-muted)';
    let strokeWidth = 1;
    let className = 'topo-link';
    let strokeDasharray = 'none';

    if (link.kind === 'host') {
      stroke = 'var(--text-faint)';
      return { stroke, strokeWidth, className, strokeDasharray };
    }

    const isFailed = link.status === 'failed';
    const normKey = normalizeLinkKey(link.source, link.target);
    const apiLinkState = linkStates.find(ls => normalizeLinkKey(ls.source, ls.target) === normKey);

    if (isFailed || (apiLinkState && apiLinkState.status === 'failed')) {
      stroke = 'var(--red)';
      strokeWidth = 3;
      strokeDasharray = '8 6';
      className += ' pulse-red';
    } else if (apiLinkState && apiLinkState.status === 'active' && apiLinkState.risk_score >= 25) {
      stroke = 'var(--amber, orange)';
      strokeWidth = 2;
      className += ' pulse-amber';
    } else {
      stroke = 'var(--green, #28a745)';
      strokeWidth = 2;
    }

    return { stroke, strokeWidth, className, strokeDasharray };
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
          {links.map((link, idx) => {
            const props = getLinkProps(link);
            return (
              <line 
                key={`link-${idx}`}
                x1={link.sourceNode.x} y1={link.sourceNode.y}
                x2={link.targetNode.x} y2={link.targetNode.y}
                {...props}
              >
                 <title>{`${link.source} <-> ${link.target}\nKind: ${link.kind || 'switch'}\nStatus: ${link.status || 'unknown'}`}</title>
              </line>
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle 
                cx={node.x} cy={node.y} 
                r={node.type === 'host' ? 6 : 26} 
                fill={node.type === 'host' ? "var(--surface3, #222)" : "var(--surface2)"} 
                stroke={node.status === 'down' ? "var(--red)" : "var(--accent)"} 
                strokeWidth={node.type === 'host' ? 1 : 2} 
              />
              <text x={node.x} y={node.y} fill="var(--text)" fontSize={node.type === 'host' ? "9" : "13"} fontWeight={node.type === 'host' ? "normal" : "bold"} textAnchor="middle" dy={node.type === 'host' ? ".3em" : ".35em"}>
                {node.label}
              </text>
              <title>{`Node: ${node.id}\nType: ${node.type}\nStatus: ${node.status}`}</title>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'var(--green, #28a745)' }}></span> Active Link (Green)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', borderBottom: '3px dashed var(--red)' }}></span> Failed Link (Red)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '2px', background: 'var(--amber, orange)' }}></span> Elevated Risk (Amber)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '20px', height: '1px', background: 'var(--text-muted)' }}></span> Host Link
        </div>
      </div>
    </Panel>
  );
}
