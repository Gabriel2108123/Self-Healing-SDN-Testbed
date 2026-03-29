import React, { useState } from 'react';
import Panel from '../common/Panel';
import Button from '../common/Button';
import SelectField from '../common/SelectField';
import NumberField from '../common/NumberField';
import ToggleField from '../common/ToggleField';

export default function TopologyControlPanel({ state, actions }) {
  const { topology, dashboard, isSimulatingFailure, isRecovering, linkStates } = state;

  // Local form state — persists user selection between polls
  const [selectedType, setSelectedType] = useState('ring');
  const [selectedSwitches, setSelectedSwitches] = useState(4);
  const [selectedHosts, setSelectedHosts] = useState(1);
  const [actionError, setActionError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const isRunning = topology?.status === 'running';
  const isLaunching = topology?.status === 'launching';
  const isError = topology?.status === 'error';
  const isIdle = !isRunning && !isLaunching && !isError;
  const hasFailedLinks = linkStates?.some(ls => ls.status === 'failed');

  const clearFeedback = () => { setActionError(null); setActionMsg(null); };

  const handleStart = async () => {
    clearFeedback();
    if (selectedSwitches < 3 || selectedSwitches > 10) {
      setActionError('Switch count must be between 3 and 10.');
      return;
    }
    try {
      await actions.handleLaunchTopology(selectedType, selectedSwitches, selectedHosts);
      setActionMsg('Topology launch requested.');
    } catch (err) {
      setActionError(err.message || 'Launch failed.');
    }
  };

  const handleStop = async () => {
    clearFeedback();
    await actions.handleStopTopology();
  };

  const handleReset = async () => {
    clearFeedback();
    await actions.handleResetTopology();
  };

  const handleSimulate = async () => {
    clearFeedback();
    await actions.handleSimulateFailure();
  };

  const handleRecover = async () => {
    clearFeedback();
    await actions.handleRecoverLink();
  };

  return (
    <Panel title="System Controls" className="topology-control-panel">

      {/* ── Section A: Topology ──────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={sectionHeading}>Topology</h4>

        {/* Config inputs — only shown when idle */}
        {isIdle && (
          <>
            <SelectField
              label="Topology Type"
              value={selectedType}
              onChange={setSelectedType}
              options={[
                { label: 'Ring', value: 'ring' },
                { label: 'Mesh', value: 'mesh' },
              ]}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <NumberField
                  label="Switch Count"
                  value={selectedSwitches}
                  min={3}
                  max={10}
                  onChange={(v) => setSelectedSwitches(Math.max(3, Math.min(10, v || 3)))}
                  error={selectedSwitches < 3 || selectedSwitches > 10 ? 'Must be 3–10' : null}
                />
              </div>
              <div style={{ flex: 1 }}>
                <NumberField
                  label="Hosts / Switch"
                  value={selectedHosts}
                  min={1}
                  max={3}
                  onChange={(v) => setSelectedHosts(Math.max(1, Math.min(3, v || 1)))}
                />
              </div>
            </div>
            <Button
              style={{ width: '100%' }}
              onClick={handleStart}
              disabled={selectedSwitches < 3 || selectedSwitches > 10}
            >
              Start Topology
            </Button>
          </>
        )}

        {isLaunching && (
          <Button disabled style={{ width: '100%' }}>
            Launching… Please wait
          </Button>
        )}

        {(isRunning || isError) && (
          <>
            {/* Show currently running topology info */}
            <div style={{
              background: 'var(--surface2)', borderRadius: 'var(--r-sm)',
              padding: '0.65rem 0.9rem', marginBottom: '0.75rem',
              fontSize: '0.82rem', color: 'var(--text-muted)',
              display: 'flex', gap: '1rem', flexWrap: 'wrap'
            }}>
              <span>Type: <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{topology.type}</strong></span>
              <span>Switches: <strong style={{ color: 'var(--text)' }}>{topology.switchCount}</strong></span>
              <span>Hosts/SW: <strong style={{ color: 'var(--text)' }}>{topology.hostsPerSwitch}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button style={{ flex: 1 }} variant="secondary" onClick={handleReset}>Reset</Button>
              <Button style={{ flex: 1 }} variant="danger" onClick={handleStop}>Stop</Button>
            </div>
          </>
        )}
      </div>

      {/* ── Section B: Simulation ────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={sectionHeading}>Simulation</h4>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            style={{ flex: 1 }}
            variant="danger"
            onClick={handleSimulate}
            disabled={isSimulatingFailure || !isRunning}
            title={!isRunning ? 'Start topology first' : ''}
          >
            {isSimulatingFailure ? 'Simulating…' : 'Simulate Random Failure'}
          </Button>
          <Button
            style={{ flex: 1 }}
            variant="success"
            onClick={handleRecover}
            disabled={isRecovering || !isRunning || !hasFailedLinks}
            title={!hasFailedLinks ? 'No failed links to recover' : ''}
          >
            {isRecovering ? 'Recovering…' : 'Recover Link'}
          </Button>
        </div>
      </div>

      {/* ── Section C: Smart Features ─────────────────────────── */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <h4 style={sectionHeading}>Smart Features</h4>
        <ToggleField
          label="Adaptive Load Distribution"
          checked={!!dashboard.loadBalancingEnabled}
          onChange={actions.toggleLoadBalancing}
          description="Dynamically reroute traffic across congested links."
        />
        <ToggleField
          label="Predictive Insights"
          checked={!!dashboard.predictiveRecoveryEnabled}
          onChange={actions.togglePredictiveRecovery}
          description="Forecast potential failures from telemetry patterns."
        />
        <ToggleField
          label="Auto-Failure Demo Mode"
          checked={!!dashboard.autoFailureEnabled}
          onChange={actions.toggleAutoFailureMode}
          description="Periodically drop random links to demonstrate self-healing."
        />
      </div>

      {/* ── Feedback strip ────────────────────────────────────── */}
      {actionError && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--r-sm)', background: 'var(--red-dim, rgba(248,81,73,0.12))', color: 'var(--red)', fontSize: '0.82rem' }}>
          {actionError}
        </div>
      )}
      {actionMsg && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--r-sm)', background: 'var(--green-dim, rgba(63,185,80,0.12))', color: 'var(--green)', fontSize: '0.82rem' }}>
          {actionMsg}
        </div>
      )}

    </Panel>
  );
}

const sectionHeading = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '0.85rem',
};
