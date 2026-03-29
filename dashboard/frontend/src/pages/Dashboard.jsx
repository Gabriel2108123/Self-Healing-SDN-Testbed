import React from 'react';
import { useDashboardState } from '../hooks/useDashboardState';

import DashboardLayout from '../components/layout/DashboardLayout';
import StatusOverview from '../components/dashboard/StatusOverview';
import TopologyControlPanel from '../components/dashboard/TopologyControlPanel';
import TopologySummary from '../components/dashboard/TopologySummary';
import TopologyCanvas from '../components/dashboard/TopologyCanvas';
import EventLogPanel from '../components/dashboard/EventLogPanel';
import AIExplanationPanel from '../components/dashboard/AIExplanationPanel';
import RiskInsightPanel from '../components/dashboard/RiskInsightPanel';

export default function Dashboard() {
  const { state, actions } = useDashboardState();

  return (
    <DashboardLayout state={state} handlers={actions}>
      {/* Second row: Status overview cards */}
      <StatusOverview state={state} />

      {/* Main area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 2.5fr) minmax(320px, 1fr)', gap: 'var(--gap)' }}>
        
        {/* Left column / large area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <TopologyCanvas state={state} />
          <EventLogPanel state={state} />
        </div>
        
        {/* Right column / stacked panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
          <TopologyControlPanel state={state} actions={actions} />
          <TopologySummary state={state} />
          <RiskInsightPanel state={state} />
          <AIExplanationPanel state={state} />
        </div>
        
      </div>
    </DashboardLayout>
  );
}
