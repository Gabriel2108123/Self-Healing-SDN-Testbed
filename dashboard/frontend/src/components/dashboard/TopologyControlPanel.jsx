import React from 'react';
import Panel from '../common/Panel';
import SelectField from '../common/SelectField';
import NumberField from '../common/NumberField';
import Button from '../common/Button';

export default function TopologyControlPanel({ state, actions }) {
  const { topology } = state;
  const isRunning = topology.status !== 'stopped' && topology.status !== 'idle';
  
  return (
    <Panel title="Configuration Controls" className="topology-control-panel">
      <SelectField 
        label="Topology Type" 
        value={topology.type} 
        onChange={actions.handleTopologyTypeChange}
        options={[
          { label: 'Ring', value: 'ring' },
          { label: 'Mesh', value: 'mesh' }
        ]}
        disabled={isRunning}
      />
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <NumberField 
            label="Switch Count" 
            value={topology.switchCount} 
            min={3} 
            max={10} 
            onChange={actions.handleSwitchCountChange}
            disabled={isRunning}
            error={topology.switchCount < 3 || topology.switchCount > 10 ? 'Must be 3-10' : null}
          />
        </div>
        <div style={{ flex: 1 }}>
          <NumberField 
            label="Hosts Per Switch" 
            value={topology.hostsPerSwitch} 
            min={1} 
            max={5} 
            onChange={actions.handleHostsChange}
            disabled={isRunning}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!isRunning ? (
          <Button onClick={actions.handleLaunchTopology} disabled={topology.switchCount < 3}>
            Launch Topology
          </Button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button style={{ flex: 1 }} variant="danger" onClick={actions.handleStopTopology}>
                Stop
              </Button>
              <Button style={{ flex: 1 }} variant="secondary" onClick={actions.handleResetTopology}>
                Reset
              </Button>
            </div>
            
            <Button 
                variant="danger" 
                onClick={actions.handleSimulateFailure} 
                disabled={topology.status !== 'running' || state.failedLink != null}
                style={{ marginTop: '0.5rem' }}
            >
              Simulate Failure
            </Button>
          </>
        )}
      </div>
    </Panel>
  );
}
