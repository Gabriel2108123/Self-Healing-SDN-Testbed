import React from 'react';
import StatusCard from './StatusCard';

const IconController  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconStatus      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 6s5-4 11-4 11 4 11 4"/><path d="M5 10s3-2.5 7-2.5 7 2.5 7 2.5"/><path d="M9 14s1.5-1 3-1 3 1 3 1"/><line x1="12" y1="18" x2="12" y2="18"/></svg>);
const IconFlows       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>);
const IconFailure     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconRecovery    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconTime        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const IconHealth      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>);
const IconPath        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);

export default function StatusOverview({ state }) {
  const { topology, dashboard, metrics } = state;
  
  const ctrlSt = dashboard?.controllerStatus === 'online' ? 'ok' : 'error';
  const runSt = topology.status === 'running' ? 'ok' : (topology.status === 'error' ? 'error' : 'info');

  const formatStrategy = (strategy) => {
    if (!strategy) return '—';
    return strategy.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getHealthStatus = (score) => {
    if (score == null) return 'info';
    if (score >= 90) return 'ok';
    if (score >= 70) return 'warning';
    return 'error';
  };

  return (
    <section className="cards-grid" aria-label="Status overview">
      <StatusCard 
        title="Controller" 
        value={(dashboard?.controllerStatus || 'off').toUpperCase()} 
        status={ctrlSt} 
        icon={<IconController />} 
        sub={`Mode: ${dashboard?.controllerMode || 'unknown'}`}
      />
      <StatusCard 
        title="Runtime Status" 
        value={(topology?.status || 'idle').toUpperCase()} 
        status={runSt} 
        icon={<IconStatus />}  
        sub={topology.running ? 'Topology Active' : 'Topology Stopped'}
      />
      <StatusCard 
        title="Active Flows" 
        value={metrics?.activeFlows ?? '—'} 
        status="info" 
        icon={<IconFlows />} 
        sub="OpenFlow Rules"
      />
      <StatusCard 
        title="Failures Detected" 
        value={metrics?.detectedFailures ?? '—'} 
        status={metrics?.detectedFailures > 0 ? 'warning' : 'ok'}  
        icon={<IconFailure />}  
        sub="Link failures"
      />
      <StatusCard 
        title="Recoveries" 
        value={metrics?.successfulRecoveries ?? '—'} 
        status="info" 
        icon={<IconRecovery />}
        sub="Successful restores"
      />
      <StatusCard 
        title="Recovery Time" 
        value={metrics?.recoveryTimeMs != null ? `${metrics.recoveryTimeMs} ms` : '—'} 
        status="info" 
        icon={<IconTime />}
        sub="Average duration"
      />
      <StatusCard 
        title="Health Score" 
        value={metrics?.healthScore != null ? `${metrics.healthScore}%` : '—'} 
        status={getHealthStatus(metrics?.healthScore)} 
        icon={<IconHealth />} 
        sub={`Predicted Risk: ${metrics?.predictedRisk || 'Unknown'}`}
      />
      <StatusCard 
        title="Path Strategy" 
        value={formatStrategy(topology?.activePathStrategy || metrics?.pathStrategy)} 
        status={(topology?.activePathStrategy || metrics?.pathStrategy) === 'single-path' ? 'info' : 'ok'} 
        icon={<IconPath />} 
        sub="Routing mode"
      />
    </section>
  );
}
