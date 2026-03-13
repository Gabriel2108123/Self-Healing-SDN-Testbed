import React from 'react';
import Panel from '../common/Panel';
import ToggleField from '../common/ToggleField';

export default function LoadBalancingPanel({ state, actions }) {
  const { dashboard } = state;

  return (
    <Panel title="Load Balancing (Placeholder)" className="load-balancing-panel">
      <ToggleField 
        label="Enable Adaptive Load Distribution"
        checked={dashboard.loadBalancingEnabled}
        onChange={actions.toggleLoadBalancing}
        description="When enabled, the controller will automatically distribute traffic across multiple paths to relieve congestion."
      />
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--r-sm)' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {dashboard.loadBalancingEnabled 
            ? 'Load balancing is simulated as ON. In later phases, dynamic path reallocation metrics will appear here.'
            : 'Load balancing is currently OFF. Traffic flows along shortest paths only.'}
        </p>
      </div>
    </Panel>
  );
}
