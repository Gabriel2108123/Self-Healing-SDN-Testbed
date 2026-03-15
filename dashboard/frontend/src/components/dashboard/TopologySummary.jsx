import React from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';

export default function TopologySummary({ state }) {
  const { topology, dashboard } = state;
  const linkCount = topology?.type === 'ring' ? topology.switchCount : ((topology?.switchCount || 0) * ((topology?.switchCount || 1) - 1)) / 2;
  
  let statusBadgeType = 'info';
  const topoStatus = topology?.status || 'unknown';
  if (topoStatus === 'running') statusBadgeType = 'ok';
  else if (topoStatus === 'stopped') statusBadgeType = 'warning';
  else if (topoStatus === 'launching') statusBadgeType = 'info';

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
          <strong>{linkCount}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</span>
          <Badge label={(topology?.status || 'unknown').toUpperCase()} type={statusBadgeType} />
        </div>
        
        {dashboard.mockMode && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 'var(--r-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> Currently in mock mode. Visualisations are approximate placeholders until API is connected.
          </div>
        )}
      </div>
    </Panel>
  );
}
