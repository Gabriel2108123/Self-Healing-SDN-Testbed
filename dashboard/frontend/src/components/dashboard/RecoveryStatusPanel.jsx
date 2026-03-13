import React from 'react';
import Panel from '../common/Panel';
import Badge from '../common/Badge';

export default function RecoveryStatusPanel({ state }) {
  const { dashboard, topology } = state;
  let statusBadgeType = 'info';
  
  if (dashboard.recoveryStatus === 'stable') statusBadgeType = 'ok';
  else if (dashboard.recoveryStatus === 'failure detected') statusBadgeType = 'error';
  else if (dashboard.recoveryStatus === 'recovering') statusBadgeType = 'warning';
  else if (dashboard.recoveryStatus === 'recovered') statusBadgeType = 'success';

  return (
    <Panel title="Recovery Status">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem 0' }}>
        <Badge 
          label={dashboard.recoveryStatus.toUpperCase()} 
          type={statusBadgeType} 
          className="recovery-status-badge" 
          style={{ fontSize: '1rem', padding: '0.5rem 1rem' }} 
        />
        
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {topology.status === 'running' 
            ? 'Controller is actively monitoring the network for failures.' 
            : 'Network offline. Recovery disabled.'}
        </p>
      </div>
    </Panel>
  );
}
