import React, { useState } from 'react';
import Panel from '../common/Panel';
import SelectField from '../common/SelectField';
import NumberField from '../common/NumberField';
import Button from '../common/Button';

export default function TopologyControlPanel({ state, actions }) {
  const { topology } = state;
  const isLocked = topology?.status === 'running' || topology?.status === 'launching';
  
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
        disabled={isLocked}
      />
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <NumberField 
            label="Switch Count" 
            value={localSwitchCount} 
            min={3} 
            max={10} 
            onChange={(val) => setLocalSwitchCount(Number(val))}
            disabled={isLocked}
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
            disabled={isLocked}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {(topology.status === 'idle' || topology.status === 'stopped' || topology.status === 'unknown') && (
          <Button onClick={() => actions.handleLaunchTopology(localType, localSwitchCount, localHostsPerSwitch)} disabled={localSwitchCount < 3}>
            Launch Topology
          </Button>
        )}
        
        {topology.status === 'launching' && (
          <Button disabled={true}>
            Launching... Please Wait
          </Button>
        )}

        {topology.status === 'running' && (
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
                disabled={state.isSimulatingFailure}
                style={{ marginTop: '0.5rem' }}
            >
              Simulate Failure
            </Button>
          </>
        )}

        {topology.status === 'error' && (
          <>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button style={{ flex: 1 }} variant="danger" onClick={actions.handleStopTopology}>
                Force Stop
              </Button>
              <Button style={{ flex: 1 }} variant="secondary" onClick={actions.handleResetTopology}>
                Force Reset
              </Button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: '0.4rem', textAlign: 'center' }}>
              Network encountered an error.
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
