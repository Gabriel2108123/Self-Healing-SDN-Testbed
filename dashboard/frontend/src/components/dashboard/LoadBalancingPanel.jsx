import React from 'react';
import Panel from '../common/Panel';
import ToggleField from '../common/ToggleField';

export default function LoadBalancingPanel({ state, actions }) {
  const { dashboard } = state;

  return (
    <Panel title="Adaptive Load Distribution" className="load-balancing-panel">
      <ToggleField 
        label="Enable Adaptive Load Distribution"
        checked={dashboard.loadBalancingEnabled}
        onChange={actions.toggleLoadBalancing}
        description="When enabled, the controller will automatically distribute traffic across multiple paths to relieve congestion."
      />
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--r-sm)' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {dashboard.loadBalancingEnabled 
            ? 'Adaptive distribution is ONLINE. Traffic is actively distributed across multiple paths.'
            : 'Adaptive distribution is OFFLINE. Traffic securely routes strictly along the minimum distance paths.'}
        </p>
      </div>
    </Panel>
  );
}
