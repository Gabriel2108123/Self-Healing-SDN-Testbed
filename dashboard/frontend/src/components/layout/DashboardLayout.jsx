import React from 'react';
import Topbar from './Topbar';
import PageContainer from './PageContainer';

export default function DashboardLayout({ children, dashboardState, handlers }) {
  return (
    <div className="dashboard-root">
      <Topbar dashboardState={dashboardState} onRefresh={handlers.handleResetTopology} />
      <main className="dashboard-main">
        <PageContainer>
          {children}
        </PageContainer>
      </main>
      <footer className="dashboard-footer">
        <span>Self-Healing SDN Testbed — Phase 1</span>
        <span>{dashboardState.mockMode ? 'Running in MOCK mode' : 'Live'}</span>
      </footer>
    </div>
  );
}
