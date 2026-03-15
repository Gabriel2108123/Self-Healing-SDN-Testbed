import React, { useState } from 'react';
import Panel from '../common/Panel';
import SelectField from '../common/SelectField';
import NumberField from '../common/NumberField';
import Button from '../common/Button';

export default function TopologyControlPanel({ state, actions }) {
  const { topology } = state;
  const isRunning = topology?.status !== 'stopped' && topology?.status !== 'idle' && topology?.status !== 'unknown';
  
  const [localType, setLocalType] = useState('ring');
  const [localSwitchCount, setLocalSwitchCount] = useState(4);
  const [localHostsPerSwitch, setLocalHostsPerSwitch] = useState(1);
  
  return (
    <Panel title="Configuration Controls" className="topology-control-panel">
      <SelectField 
        label="Topology Type" 
        value={localType} 
        onChange={(val) => setLocalType(val)}
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
            value={localSwitchCount} 
            min={3} 
            max={10} 
            onChange={(val) => setLocalSwitchCount(Number(val))}
            disabled={isRunning}
            error={localSwitchCount < 3 || localSwitchCount > 10 ? 'Must be 3-10' : null}
          />
        </div>
        <div style={{ flex: 1 }}>
          <NumberField 
            label="Hosts Per Switch" 
            value={localHostsPerSwitch} 
            min={1} 
            max={5} 
            onChange={(val) => setLocalHostsPerSwitch(Number(val))}
            disabled={isRunning}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!isRunning ? (
          <Button onClick={() => actions.handleLaunchTopology(localType, localSwitchCount, localHostsPerSwitch)} disabled={localSwitchCount < 3}>
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
