/**
 * Mock data for the SDN Dashboard Phase 1 setup
 */

export const INITIAL_TOPOLOGY = {
  type: 'ring',
  switchCount: 6,
  hostsPerSwitch: 2,
  status: 'stopped', // idle, launching, running, stopped, recovering
};

export const INITIAL_DASHBOARD_STATE = {
  controllerStatus: 'online', // online, offline
  recoveryStatus: 'stable',    // stable, monitoring, failure detected, recovering, recovered
  mockMode: true,
  loadBalancingEnabled: false,
  predictiveRecoveryEnabled: false,
};

export const INITIAL_METRICS = {
  creationTime: '—',
  discoveryTime: '—',
  failureDetectionTime: '—',
  recoveryTime: '—',
  activeFlows: 0,
  averageLatency: '—',
  healthScore: 100,
};

export const INITIAL_EVENTS = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    severity: 'info',
    message: 'Dashboard loaded in mock mode. Awaiting topology launch...',
  }
];

export const INITIAL_EXPLANATION = {
  title: 'Welcome to the Self-Healing SDN Testbed',
  body: 'This dashboard allows you to control the simulated SDN network. Start by selecting a topology and clicking "Launch Topology".',
};
