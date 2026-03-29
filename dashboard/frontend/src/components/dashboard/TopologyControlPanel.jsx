import React from 'react';
import Panel from '../common/Panel';
import Button from '../common/Button';
import ToggleField from '../common/ToggleField';

export default function TopologyControlPanel({ state, actions }) {
  const { topology, dashboard, isSimulatingFailure, isRecovering, linkStates } = state;
  const isRunning = topology?.status === 'running';
  const isLaunching = topology?.status === 'launching';
  const isError = topology?.status === 'error';
  const isIdle = !isRunning && !isLaunching && !isError;
  const hasFailedLinks = linkStates?.some(ls => ls.status === 'failed');

  return (
    <Panel title="System Controls" className="topology-control-panel">
      
      {/* Topology Region */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Topology</h4>
        
        {isIdle && (
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <Button onClick={() => actions.handleLaunchTopology('ring', 4, 1)} disabled={isLaunching}>
              Create Ring (4 Switches)
            </Button>
            <Button variant="secondary" onClick={() => actions.handleLaunchTopology('mesh', 4, 1)} disabled={isLaunching}>
              Create Mesh (4 Switches)
            </Button>
          </div>
        )}

        {isLaunching && (
          <Button disabled={true} style={{ width: '100%' }}>
            Launching... Please Wait
          </Button>
        )}

        {(isRunning || isError) && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button style={{ flex: 1 }} variant="danger" onClick={actions.handleStopTopology}>
              Stop
            </Button>
            <Button style={{ flex: 1 }} variant="secondary" onClick={actions.handleResetTopology}>
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Simulation Region */}
      <div style={{ marginBottom: '1.5rem', opacity: isRunning ? 1 : 0.5, pointerEvents: isRunning ? 'auto' : 'none' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Simulation</h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button 
              style={{ flex: 1 }}
              variant="danger" 
              onClick={actions.handleSimulateFailure} 
              disabled={isSimulatingFailure || !isRunning}
          >
            Simulate Random Failure
          </Button>
          <Button 
              style={{ flex: 1 }}
              variant="success" 
              onClick={actions.handleRecoverLink} 
              disabled={isRecovering || !isRunning || !hasFailedLinks}
              title={!hasFailedLinks ? "No failed links to recover" : ""}
          >
            Recover Link
          </Button>
        </div>
      </div>

      {/* Smart Features Region */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Smart Features</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ToggleField 
            label="Adaptive Load Distribution"
            checked={dashboard.loadBalancingEnabled}
            onChange={actions.toggleLoadBalancing}
            description="Dynamically reroute traffic around congested single paths."
          />
          <ToggleField 
            label="Predictive Insights"
            checked={dashboard.predictiveRecoveryEnabled}
            onChange={actions.togglePredictiveRecovery}
            description="Forecast potential link failures based on telemetry variations."
          />
          <ToggleField 
            label="Auto-Failure Demo Mode"
            checked={dashboard.autoFailureEnabled}
            onChange={actions.toggleAutoFailureMode}
            description="Automatically drop random links periodically to demonstrate self-healing."
          />
        </div>
      </div>

    </Panel>
  );
}
