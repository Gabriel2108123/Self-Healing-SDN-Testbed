import React from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';

export default function TopologySummary({ state }) {
  const { topology } = state;
  const topoStatus = topology?.status || 'unknown';
  
  let statusBadgeType = 'info';
  if (topoStatus === 'running') statusBadgeType = 'ok';
  else if (topoStatus === 'stopped' || topoStatus === 'idle') statusBadgeType = 'warning';
  else if (topoStatus === 'launching') statusBadgeType = 'info';
  else if (topoStatus === 'error') statusBadgeType = 'error';

  const formatStrategy = (strategy) => {
    if (!strategy) return '—';
    return strategy.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Panel title="Topology Summary">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type</span>
          <strong style={{ textTransform: 'capitalize' }}>{topology?.type || 'unknown'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Switches</span>
          <strong>{topology?.switchCount || 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hosts Per Switch</span>
          <strong>{topology?.hostsPerSwitch || 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimated Links</span>
          <strong>{topology?.estimatedLinks || 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Path Strategy</span>
          <strong style={{ color: 'var(--accent)' }}>{formatStrategy(topology?.activePathStrategy)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</span>
          <Badge label={topoStatus.toUpperCase()} type={statusBadgeType} />
        </div>
      </div>
    </Panel>
  );
}
