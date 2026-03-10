/**
 * TopologyGraph.jsx
 * -----------------
 * D3-powered interactive network topology diagram.
 * Uses fixed node positions (not random force layout) so the graph always
 * matches the known h1-s1-s2-h2 / s3-backup topology.
 *
 * Props:
 *   nodes        [{id, type}]
 *   links        [{source, target, status, kind}]
 *   activePath   ["s1","s2"] or ["s1","s3","s2"]
 *   pathIsFailover (bool)
 */

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// ── Fixed layout positions (SVG coords, viewBox 860x340) ──────────────────
const POSITIONS = {
  h1: { x: 80,  y: 170 },
  s1: { x: 250, y: 170 },
  s2: { x: 590, y: 170 },
  s3: { x: 420, y: 300 },
  h2: { x: 780, y: 170 },
};

// ── Colours ────────────────────────────────────────────────────────────────
const C = {
  active:   '#3fb950',   // green
  backup:   '#8957e5',   // purple
  failed:   '#f85149',   // red
  inactive: '#30363d',   // dark grey
  host:     '#1a2840',
  hostBorder: '#58a6ff',
  sw:       '#1e2e1e',
  swBorder: '#3fb950',
  swFail:   '#2d1018',
  swFailBorder: '#f85149',
  text:     '#e6edf3',
  muted:    '#7d8590',
};

function linkColor(link, activePath, pathIsFailover) {
  if (link.status === 'down' || link.status === 'DOWN') return C.failed;
  // Check if this link is on the active path
  if (activePath && activePath.length >= 2) {
    for (let i = 0; i < activePath.length - 1; i++) {
      const a = activePath[i], b = activePath[i + 1];
      if ((link.source === a && link.target === b) ||
          (link.source === b && link.target === a)) {
        return pathIsFailover && link.kind === 'backup' ? C.backup : C.active;
      }
    }
  }
  // Always draw host links as active colour
  if (link.kind === 'host') return C.active;
  if (link.kind === 'backup') return C.inactive;
  return C.inactive;
}

function linkDash(link, activePath, pathIsFailover) {
  const isActive = activePath && activePath.length >= 2 &&
    activePath.some((n, i) => i < activePath.length - 1 &&
      ((activePath[i] === link.source && activePath[i+1] === link.target) ||
       (activePath[i] === link.target && activePath[i+1] === link.source)));
  if (link.kind === 'backup' && !isActive) return '7 5';
  if (link.status === 'down' || link.status === 'DOWN') return '5 5';
  return null;
}

function switchFailed(nodeId, links) {
  return links.some(l =>
    (l.source === nodeId || l.target === nodeId) &&
    (l.status === 'down' || l.status === 'DOWN')
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TopologyGraph({ nodes = [], links = [], activePath = ['s1','s2'], pathIsFailover = false }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!nodes.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = 860, H = 340;
    const g = svg.append('g');

    // ─── Link lines ───────────────────────────────────────────────────────
    links.forEach(link => {
      const src = POSITIONS[link.source] || { x: 200, y: 170 };
      const tgt = POSITIONS[link.target] || { x: 600, y: 170 };
      const color = linkColor(link, activePath, pathIsFailover);
      const dash  = linkDash(link, activePath, pathIsFailover);
      const isActive = color === C.active || color === C.backup;

      // Glow effect for active links
      if (isActive) {
        g.append('line')
          .attr('x1', src.x).attr('y1', src.y)
          .attr('x2', tgt.x).attr('y2', tgt.y)
          .attr('stroke', color)
          .attr('stroke-width', 10)
          .attr('stroke-opacity', 0.18)
          .attr('stroke-linecap', 'round');
      }

      // Main line
      const line = g.append('line')
        .attr('x1', src.x).attr('y1', src.y)
        .attr('x2', tgt.x).attr('y2', tgt.y)
        .attr('stroke', color)
        .attr('stroke-width', isActive ? 3.5 : 2)
        .attr('stroke-linecap', 'round')
        .style('cursor', 'pointer');

      if (dash) line.attr('stroke-dasharray', dash);

      // Animated flow on active links
      if (isActive && color !== C.inactive) {
        const animLine = g.append('line')
          .attr('x1', src.x).attr('y1', src.y)
          .attr('x2', tgt.x).attr('y2', tgt.y)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '8 40')
          .attr('stroke-opacity', 0.55);
        animLine.append('animateTransform')
          .attr('attributeName', 'none'); // handled via CSS
        // Use stroke-dashoffset animation
        animLine.style('animation', 'dash-flow 1.6s linear infinite');
      }

      // Link label (mid-point)
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      const labelId = `${link.source}-${link.target}`;
      g.append('text')
        .attr('x', mx)
        .attr('y', my - 9)
        .attr('text-anchor', 'middle')
        .attr('fill', color === C.failed ? C.failed : C.muted)
        .attr('font-size', 10)
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(link.status === 'down' || link.status === 'DOWN' ? '✗ DOWN' : labelId);

      // Hover zone (wider transparent hit area)
      g.append('line')
        .attr('x1', src.x).attr('y1', src.y)
        .attr('x2', tgt.x).attr('y2', tgt.y)
        .attr('stroke', 'transparent')
        .attr('stroke-width', 20)
        .style('cursor', 'pointer')
        .on('mouseenter', (event) => {
          setTooltip({
            x: event.offsetX, y: event.offsetY,
            text: `${labelId}  |  ${(link.status || 'up').toUpperCase()}  |  ${link.kind}`,
          });
        })
        .on('mouseleave', () => setTooltip(null));
    });

    // ─── Nodes ────────────────────────────────────────────────────────────
    nodes.forEach(node => {
      const pos = POSITIONS[node.id];
      if (!pos) return;
      const isHost   = node.type === 'host';
      const hasFail  = !isHost && switchFailed(node.id, links);

      const ng = g.append('g')
        .style('cursor', 'default')
        .on('mouseenter', (event) => {
          setTooltip({ x: event.offsetX, y: event.offsetY, text: `${node.id}  (${node.type})` });
        })
        .on('mouseleave', () => setTooltip(null));

      if (isHost) {
        // Rounded rect for hosts
        ng.append('rect')
          .attr('x', pos.x - 24).attr('y', pos.y - 16)
          .attr('width', 48).attr('height', 32)
          .attr('rx', 8)
          .attr('fill', C.host)
          .attr('stroke', C.hostBorder)
          .attr('stroke-width', 2);
      } else {
        // Circle for switches + glow
        if (hasFail) {
          ng.append('circle')
            .attr('cx', pos.x).attr('cy', pos.y).attr('r', 30)
            .attr('fill', C.failed).attr('fill-opacity', 0.12)
            .attr('stroke', 'none');
        }
        ng.append('circle')
          .attr('cx', pos.x).attr('cy', pos.y).attr('r', 22)
          .attr('fill', hasFail ? C.swFail : C.sw)
          .attr('stroke', hasFail ? C.swFailBorder : C.swBorder)
          .attr('stroke-width', 2.5);
      }

      // Label
      ng.append('text')
        .attr('x', pos.x).attr('y', pos.y + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', C.text)
        .attr('font-size', 13)
        .attr('font-weight', 700)
        .attr('font-family', 'Outfit, sans-serif')
        .text(node.id);
    });

  }, [nodes, links, activePath, pathIsFailover]);

  return (
    <div className="card topology-graph-card">
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

      <div className="topo-graph-wrap" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 860 340"
          className="topo-graph-svg"
          aria-label="Interactive network topology"
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="topo-tooltip"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="topo-legend">
        <span className="legend-item"><span className="legend-line" style={{background:'#3fb950'}}/>&nbsp;Active path</span>
        <span className="legend-item"><span className="legend-line" style={{background:'#8957e5'}}/>&nbsp;Failover path</span>
        <span className="legend-item"><span className="legend-line" style={{background:'#30363d', border:'1px dashed #555'}}/>&nbsp;Backup (idle)</span>
        <span className="legend-item"><span className="legend-line" style={{background:'#f85149'}}/>&nbsp;Link down</span>
      </div>
    </div>
  );
}
