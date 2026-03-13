import React from 'react';
import { useDashboardState } from '../hooks/useDashboardState';

import DashboardLayout from '../components/layout/DashboardLayout';
import StatusOverview from '../components/dashboard/StatusOverview';
import TopologyControlPanel from '../components/dashboard/TopologyControlPanel';
import TopologySummary from '../components/dashboard/TopologySummary';
import TopologyCanvas from '../components/dashboard/TopologyCanvas';
import MetricsPanel from '../components/dashboard/MetricsPanel';
import EventLogPanel from '../components/dashboard/EventLogPanel';
import AIExplanationPanel from '../components/dashboard/AIExplanationPanel';
import RecoveryStatusPanel from '../components/dashboard/RecoveryStatusPanel';
import LoadBalancingPanel from '../components/dashboard/LoadBalancingPanel';
import PredictiveRecoveryPanel from '../components/dashboard/PredictiveRecoveryPanel';

export default function Dashboard() {
  const { state, actions } = useDashboardState();

  return (
    <DashboardLayout dashboardState={state.dashboard} handlers={actions}>
      {/* Second row: Status overview cards */}
      <StatusOverview state={state} />

      {/* Main area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(400px, 2fr) minmax(280px, 1fr)', gap: 'var(--gap)' }}>
        
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <TopologyControlPanel state={state} actions={actions} />
          <TopologySummary state={state} />
          <RecoveryStatusPanel state={state} />
        </div>
        
        {/* Centre column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <TopologyCanvas state={state} />
          <EventLogPanel state={state} />
        </div>
        
        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <MetricsPanel state={state} />
          <AIExplanationPanel state={state} />
          <LoadBalancingPanel state={state} actions={actions} />
          <PredictiveRecoveryPanel state={state} actions={actions} />
        </div>
        
      </div>
    </DashboardLayout>
  );
}
