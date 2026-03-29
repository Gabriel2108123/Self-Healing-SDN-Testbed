import { useState, useCallback, useEffect } from 'react';
import { 
  fetchDashboard, launchTopology, stopTopology, resetTopology,
  simulateRandomFailure as simulateRandomFailureAPI, 
  recoverLink as recoverLinkAPI,
  toggleLoadBalancing as toggleLoadBalancingAPI, 
  togglePredictiveAnalytics as togglePredictiveAnalyticsAPI,
  toggleAutoFailureMode as toggleAutoFailureModeAPI
} from '../api';
import { REFRESH_INTERVAL_MS } from '../config';

// Helper to reliably match graph link IDs (e.g. s1-s4 with s4-s1)
export const normalizeLinkKey = (a, b) => [a, b].sort().join("--");

export function useDashboardState() {
  const [topology, setTopology] = useState({
    type: 'unknown', switchCount: 0, hostsPerSwitch: 0, estimatedLinks: 0,
    status: 'idle', running: false, activePathStrategy: 'single-path',
    graph: { nodes: [], links: [] }
  });
  const [dashboard, setDashboard] = useState({ 
    controllerStatus: 'offline', controllerMode: 'unknown',
    recoveryStatus: 'stable', mockMode: false,
    loadBalancingEnabled: false, predictiveRecoveryEnabled: false, autoFailureEnabled: false
  });
  const [metrics, setMetrics] = useState({});
  const [events, setEvents] = useState([]);
  const [explanation, setExplanation] = useState({ title: '', body: '' });
  
  // New granular states from backend
  const [linkStates, setLinkStates] = useState([]);
  const [riskyLinks, setRiskyLinks] = useState([]);
  const [riskSummary, setRiskSummary] = useState({ count: 0, level: 'low', message: '' });
  
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Shared state-updater from a raw dashboard response
  const applyDashboardData = useCallback((data) => {
    setTopology({
      type: data.topology?.topologyType || 'unknown',
      switchCount: data.topology?.switchCount || 0,
      hostsPerSwitch: data.topology?.hostsPerSwitch || 0,
      estimatedLinks: data.topology?.estimatedLinks || 0,
      status: data.topology?.runtimeStatus || (data.topology?.running ? 'running' : 'idle'),
      running: data.topology?.running || false,
      activePathStrategy: data.topology?.activePathStrategy || 'single-path',
      graph: data.topology?.graph || { nodes: [], links: [] }
    });
    setDashboard({ 
      controllerStatus: data.controller?.status || 'offline',
      controllerMode: data.controller?.mode || 'unknown',
      recoveryStatus: data.recovery?.status || 'stable',
      mockMode: false,
      loadBalancingEnabled: data.features?.loadBalancingEnabled || false,
      predictiveRecoveryEnabled: data.features?.predictiveRecoveryEnabled || false,
      autoFailureEnabled: data.features?.autoFailureEnabled || false
    });
    setMetrics(data.metrics || {});
    setEvents(data.recentEvents || []);
    setExplanation({
      title: data.latestExplanation?.title || 'Explanation unavailable',
      body: data.latestExplanation?.body || 'No explanation has been generated yet.'
    });
    setLinkStates(data.link_states || []);
    setRiskyLinks(data.riskyLinks || []);
    setRiskSummary(data.riskSummary || { count: 0, level: 'low', message: 'No elevated-risk links detected.' });
  }, []);

  // Immediate on-demand refresh (called after actions)
  const refreshNow = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      applyDashboardData(data);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [applyDashboardData]);

  useEffect(() => {
    let interval;
    const loadState = async () => {
      try {
        const data = await fetchDashboard();
        applyDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard state", err);
      }
    };

    loadState();
    interval = setInterval(loadState, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [applyDashboardData]);

  const addEvent = useCallback((severity, message) => {
    // We just optimistically insert into UI state. 
    // Ideally the backend will return the authoritative log next poll.
    const newEvent = {
        id: 'local_evt_' + Date.now(),
        timestamp: new Date().toISOString(),
        severity,
        message,
        type: severity
    };
    setEvents(prev => [newEvent, ...prev].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50)); 
  }, []);

  const handleTopologyTypeChange = useCallback((type) => {
    setTopology(prev => ({ ...prev, type }));
  }, []);

  const handleSwitchCountChange = useCallback((count) => {
    const validCount = Math.max(3, Math.min(10, count));
    setTopology(prev => ({ ...prev, switchCount: validCount }));
  }, []);

  const handleHostsChange = useCallback((count) => {
    const validCount = Math.max(1, Math.min(5, count));
    setTopology(prev => ({ ...prev, hostsPerSwitch: validCount }));
  }, []);

  const handleLaunchTopology = useCallback(async (type, switchCount, hostsPerSwitch) => {
    setTopology(prev => ({ ...prev, status: 'launching' }));
    try {
      await launchTopology({ topologyType: type, switchCount, hostsPerSwitch });
      addEvent('info', `Launching ${type} topology with ${switchCount} switches…`);
      // Refresh after a short delay to let backend update
      setTimeout(refreshNow, 2000);
    } catch (err) {
      console.error(err);
      addEvent('error', 'Failed to launch topology: ' + err.message);
      setTopology(prev => ({ ...prev, status: 'error' }));
    }
  }, [addEvent, refreshNow]);

  const handleStopTopology = useCallback(async () => {
    try {
      await stopTopology();
      addEvent('info', 'Stop topology requested.');
    } catch (err) {
      console.error(err);
      addEvent('error', 'Stop failed: ' + err.message);
    }
  }, [addEvent]);

  const handleResetTopology = useCallback(async () => {
    try {
      await resetTopology();
      addEvent('info', 'Reset topology requested.');
    } catch (err) {
      console.error(err);
      addEvent('error', 'Reset failed: ' + err.message);
    }
  }, [addEvent]);

  const handleSimulateFailure = useCallback(async () => {
    if (topology.status !== 'running' || isSimulatingFailure) return;

    setIsSimulatingFailure(true);
    try {
      await simulateRandomFailureAPI();
      addEvent('warning', 'Random link failure requested.');
    } catch (err) {
      console.error(err);
      addEvent('error', 'Failed to simulate link failure: ' + err.message);
    } finally {
      setIsSimulatingFailure(false);
    }
  }, [topology.status, isSimulatingFailure, addEvent]);
  
  const handleRecoverLink = useCallback(async () => {
    if (topology.status !== 'running' || isRecovering) return;

    setIsRecovering(true);
    try {
      await recoverLinkAPI();
      addEvent('info', 'Link recovery requested.');
    } catch (err) {
      console.error(err);
      addEvent('error', 'Failed to recover link: ' + err.message);
    } finally {
      setIsRecovering(false);
    }
  }, [topology.status, isRecovering, addEvent]);

  const toggleLoadBalancing = useCallback(async () => {
    const newVal = !dashboard.loadBalancingEnabled;
    try {
      await toggleLoadBalancingAPI(newVal);
      addEvent('info', `Adaptive Load Distribution ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error(err);
      addEvent('error', `Failed to toggle load balancing: ${err.message}`);
    }
  }, [dashboard.loadBalancingEnabled, addEvent, refreshNow]);

  const togglePredictiveRecovery = useCallback(async () => {
    const newVal = !dashboard.predictiveRecoveryEnabled;
    try {
      await togglePredictiveAnalyticsAPI(newVal);
      addEvent('info', `Predictive Insights ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error(err);
      addEvent('error', `Failed to toggle predictive insights: ${err.message}`);
    }
  }, [dashboard.predictiveRecoveryEnabled, addEvent, refreshNow]);

  const toggleAutoFailureMode = useCallback(async () => {
    const newVal = !dashboard.autoFailureEnabled;
    try {
      await toggleAutoFailureModeAPI(newVal);
      addEvent('info', `Auto-Failure Demo Mode ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error(err);
      addEvent('error', `Failed to toggle auto-failure mode: ${err.message}`);
    }
  }, [dashboard.autoFailureEnabled, addEvent, refreshNow]);

  return {
    state: {
      topology,
      dashboard,
      metrics,
      events,
      explanation,
      linkStates,
      riskyLinks,
      riskSummary,
      isSimulatingFailure,
      isRecovering
    },
    actions: {
      handleTopologyTypeChange,
      handleSwitchCountChange,
      handleHostsChange,
      handleLaunchTopology,
      handleStopTopology,
      handleResetTopology,
      handleSimulateFailure,
      handleRecoverLink,
      toggleLoadBalancing,
      togglePredictiveRecovery,
      toggleAutoFailureMode
    }
  };
}
