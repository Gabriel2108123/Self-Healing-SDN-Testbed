import React from 'react';
import Topbar from './Topbar';
import PageContainer from './PageContainer';

export default function DashboardLayout({ children, state, handlers }) {
  return (
    <div className="dashboard-root">
      <Topbar state={state} onRefresh={handlers.handleResetTopology} />
      <main className="dashboard-main">
        <PageContainer>
          {children}
        </PageContainer>
      </main>
      <footer className="dashboard-footer">
        <span>Self-Healing SDN Testbed — Final Project</span>
        <span>{state.dashboard.mockMode ? 'Running in MOCK mode' : 'Live Mode'}</span>
      </footer>
    </div>
  );
}
