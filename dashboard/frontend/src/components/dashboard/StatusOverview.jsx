import React from 'react';
import StatusCard from './StatusCard';

const IconController  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconConnectivity= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 6s5-4 11-4 11 4 11 4"/><path d="M5 10s3-2.5 7-2.5 7 2.5 7 2.5"/><path d="M9 14s1.5-1 3-1 3 1 3 1"/><line x1="12" y1="18" x2="12" y2="18"/></svg>);
const IconPath        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
const IconFailure     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconRecovery    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconEvents      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);

export default function StatusOverview({ state }) {
  const { topology, dashboard, events, metrics } = state;
  
  const linkCount = topology?.type === 'ring' ? topology.switchCount : (topology?.switchCount * (topology?.switchCount - 1)) / 2;
  const isFailed = topology?.failedLinks?.length > 0 || (metrics?.detectedFailures > 0 && dashboard?.recoveryStatus !== 'recovered');
  const activeLinks = topology?.status === 'running' ? (isFailed ? Math.max(0, linkCount - 1) : linkCount) : 0;
  
  const ctrlSt = dashboard?.controllerStatus === 'online' ? 'ok' : 'error';
  
  let recovStatusSt = 'info';
  const recovStatus = dashboard?.recoveryStatus || 'unknown';
  if (recovStatus === 'stable' || recovStatus === 'recovered') recovStatusSt = 'ok';
  else if (recovStatus === 'failure detected') recovStatusSt = 'error';
  else if (recovStatus === 'recovering') recovStatusSt = 'warning';

  return (
    <section className="cards-grid" aria-label="Status overview">
      <StatusCard 
        title="Topology" 
        value={(topology?.type || 'unknown').charAt(0).toUpperCase() + (topology?.type || 'unknown').slice(1)} 
        status="info" 
        icon={<IconConnectivity />}  
        sub={`${topology.switchCount} switches`}
      />
      <StatusCard 
        title="Active Links" 
        value={topology?.status === 'running' ? activeLinks : 0} 
        status={topology?.status === 'running' && activeLinks > 0 ? 'ok' : 'info'} 
        icon={<IconPath />} 
        sub={`Estimated total: ${linkCount}`}
      />
      <StatusCard 
        title="Detected Failures" 
        value={metrics?.detectedFailures || 0} 
        status={metrics?.detectedFailures > 0 ? 'warning' : 'ok'}  
        icon={<IconFailure />}  
        sub={isFailed ? `Link failure active` : 'System healthy'}
      />
      <StatusCard 
        title="Recovery State" 
        value={(dashboard?.recoveryStatus || 'unknown').toUpperCase()} 
        status={recovStatusSt} 
        icon={<IconRecovery />}
        sub={topology?.status === 'running' ? 'Monitoring network' : 'Idle'}
      />
      <StatusCard 
        title="Controller" 
        value={(dashboard?.controllerStatus || 'unknown').toUpperCase()} 
        status={ctrlSt} 
        icon={<IconController />} 
        sub={topology?.status === 'running' ? 'Ryu OpenFlow' : 'Disconnected'}
      />
      <StatusCard 
        title="Recent Events" 
        value={events.length} 
        status="info" 
        icon={<IconEvents />} 
        sub="Logs recorded"
      />
    </section>
  );
}
