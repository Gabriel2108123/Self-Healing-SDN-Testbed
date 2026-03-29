import { useState, useCallback, useEffect } from 'react';
import {
  fetchDashboard, launchTopology, stopTopology, resetTopology,
  simulateRandomFailure as simulateRandomFailureAPI,
  recoverLink as recoverLinkAPI,
  toggleLoadBalancing as toggleLoadBalancingAPI,
  togglePredictiveAnalytics as togglePredictiveAnalyticsAPI,
  toggleAutoFailureMode as toggleAutoFailureModeAPI,
} from '../api';
import { REFRESH_INTERVAL_MS } from '../config';

// Helper to reliably match graph link IDs (e.g. s1-s4 with s4-s1)
export const normalizeLinkKey = (a, b) => [a, b].sort().join('--');

const INITIAL_TOPOLOGY = {
  type: 'unknown', switchCount: 0, hostsPerSwitch: 0, estimatedLinks: 0,
  status: 'idle', running: false, activePathStrategy: 'single-path',
  graph: { nodes: [], links: [] },
};

const INITIAL_DASHBOARD = {
  controllerStatus: 'offline', controllerMode: 'unknown',
  recoveryStatus: 'stable', mockMode: false,
  loadBalancingEnabled: false, predictiveRecoveryEnabled: false, autoFailureEnabled: false,
};

export function useDashboardState() {
  // ── 1. All useState declarations ──────────────────────────────────────────
  const [topology,            setTopology]            = useState(INITIAL_TOPOLOGY);
  const [dashboard,           setDashboard]           = useState(INITIAL_DASHBOARD);
  const [metrics,             setMetrics]             = useState({});
  const [events,              setEvents]              = useState([]);
  const [explanation,         setExplanation]         = useState({ title: '', body: '' });
  const [linkStates,          setLinkStates]          = useState([]);
  const [riskyLinks,          setRiskyLinks]          = useState([]);
  const [riskSummary,         setRiskSummary]         = useState({ count: 0, level: 'low', message: '' });
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [isRecovering,        setIsRecovering]        = useState(false);
  const [actionError,         setActionError]         = useState(null);

  // ── 2. All useCallback declarations ───────────────────────────────────────

  /** Apply a raw /api/dashboard payload to all state slices */
  const applyDashboardData = useCallback((data) => {
    setTopology({
      type: data.topology?.topologyType || 'unknown',
      switchCount: data.topology?.switchCount || 0,
      hostsPerSwitch: data.topology?.hostsPerSwitch || 0,
      estimatedLinks: data.topology?.estimatedLinks || 0,
      status: data.topology?.runtimeStatus || (data.topology?.running ? 'running' : 'idle'),
      running: data.topology?.running || false,
      activePathStrategy: data.topology?.activePathStrategy || 'single-path',
      graph: data.topology?.graph || { nodes: [], links: [] },
    });
    setDashboard({
      controllerStatus: data.controller?.status || 'offline',
      controllerMode: data.controller?.mode || 'unknown',
      recoveryStatus: data.recovery?.status || 'stable',
      mockMode: false,
      loadBalancingEnabled: data.features?.loadBalancingEnabled || false,
      predictiveRecoveryEnabled: data.features?.predictiveRecoveryEnabled || false,
      autoFailureEnabled: data.features?.autoFailureEnabled || false,
    });
    setMetrics(data.metrics || {});
    setEvents(data.recentEvents || []);
    setExplanation({
      title: data.latestExplanation?.title || 'Explanation unavailable',
      body: data.latestExplanation?.body || 'No explanation has been generated yet.',
    });
    setLinkStates(data.link_states || []);
    setRiskyLinks(data.riskyLinks || []);
    setRiskSummary(data.riskSummary || { count: 0, level: 'low', message: 'No elevated-risk links detected.' });
  }, []); // no deps — only uses setters which are stable

  /** Immediate on-demand refresh — called after any mutating action */
  const refreshNow = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      applyDashboardData(data);
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
    }
  }, [applyDashboardData]);

  /** Optimistically insert a local event (backend is authoritative on next poll) */
  const addEvent = useCallback((severity, message) => {
    setEvents(prev =>
      [
        { id: 'local_' + Date.now(), timestamp: new Date().toISOString(), severity, message, type: severity },
        ...prev,
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50)
    );
  }, []);

  // Topology actions
  const handleLaunchTopology = useCallback(async (type, switchCount, hostsPerSwitch) => {
    setActionError(null);
    setTopology(prev => ({ ...prev, status: 'launching' }));
    try {
      await launchTopology({ topologyType: type, switchCount, hostsPerSwitch });
      addEvent('info', `Launching ${type} topology with ${switchCount} switches…`);
      setTimeout(refreshNow, 2000); // allow backend time to spin up
    } catch (err) {
      console.error('Launch failed:', err);
      addEvent('error', 'Failed to launch topology: ' + err.message);
      setTopology(prev => ({ ...prev, status: 'error' }));
      setActionError(err.message);
    }
  }, [addEvent, refreshNow]);

  const handleStopTopology = useCallback(async () => {
    setActionError(null);
    try {
      await stopTopology();
      addEvent('info', 'Stop topology requested.');
      await refreshNow();
    } catch (err) {
      console.error('Stop failed:', err);
      addEvent('error', 'Stop failed: ' + err.message);
      setActionError(err.message);
    }
  }, [addEvent, refreshNow]);

  /**
   * Reset — ONLY fires if topology.running is true.
   * Guards against the 400 that occurs when reset is called while idle.
   */
  const handleResetTopology = useCallback(async () => {
    setActionError(null);
    // Read topology running state via functional updater to get latest value
    let currentlyRunning = false;
    setTopology(prev => { currentlyRunning = prev.running; return prev; });

    if (!currentlyRunning) {
      console.warn('Reset skipped — no topology is currently running.');
      return;
    }
    try {
      await resetTopology();
      addEvent('info', 'Reset topology requested.');
      await refreshNow();
    } catch (err) {
      console.error('Reset failed:', err);
      // Backend 400 message surfaced cleanly — do not rethrow
      addEvent('warning', 'Reset: ' + (err.message || 'No topology running to reset.'));
      setActionError(err.message);
    }
  }, [addEvent, refreshNow]);

  const handleSimulateFailure = useCallback(async () => {
    setActionError(null);
    if (isSimulatingFailure) return;
    setIsSimulatingFailure(true);
    try {
      await simulateRandomFailureAPI();
      addEvent('warning', 'Random link failure simulated.');
    } catch (err) {
      console.error('Simulate failure error:', err);
      addEvent('error', 'Failed to simulate link failure: ' + err.message);
      setActionError(err.message);
    } finally {
      setIsSimulatingFailure(false);
    }
  }, [isSimulatingFailure, addEvent]);

  const handleRecoverLink = useCallback(async () => {
    setActionError(null);
    if (isRecovering) return;
    setIsRecovering(true);
    try {
      await recoverLinkAPI();
      addEvent('info', 'Link recovery requested.');
    } catch (err) {
      console.error('Recovery error:', err);
      addEvent('error', 'Failed to recover link: ' + err.message);
      setActionError(err.message);
    } finally {
      setIsRecovering(false);
    }
  }, [isRecovering, addEvent]);

  // Feature toggles
  const toggleLoadBalancing = useCallback(async () => {
    setActionError(null);
    const newVal = !dashboard.loadBalancingEnabled;
    try {
      await toggleLoadBalancingAPI(newVal);
      addEvent('info', `Adaptive Load Distribution ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error('Toggle load balancing failed:', err);
      addEvent('error', `Failed to toggle load balancing: ${err.message}`);
      setActionError(err.message);
    }
  }, [dashboard.loadBalancingEnabled, addEvent, refreshNow]);

  const togglePredictiveRecovery = useCallback(async () => {
    setActionError(null);
    const newVal = !dashboard.predictiveRecoveryEnabled;
    try {
      await togglePredictiveAnalyticsAPI(newVal);
      addEvent('info', `Predictive Insights ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error('Toggle predictive insights failed:', err);
      addEvent('error', `Failed to toggle predictive insights: ${err.message}`);
      setActionError(err.message);
    }
  }, [dashboard.predictiveRecoveryEnabled, addEvent, refreshNow]);

  const toggleAutoFailureMode = useCallback(async () => {
    setActionError(null);
    const newVal = !dashboard.autoFailureEnabled;
    try {
      await toggleAutoFailureModeAPI(newVal);
      addEvent('info', `Auto-Failure Demo Mode ${newVal ? 'enabled' : 'disabled'}.`);
      await refreshNow();
    } catch (err) {
      console.error('Toggle auto-failure failed:', err);
      addEvent('error', `Failed to toggle auto-failure mode: ${err.message}`);
      setActionError(err.message);
    }
  }, [dashboard.autoFailureEnabled, addEvent, refreshNow]);

  // Deprecated local field handlers — kept for API compat, no longer used by new control panel
  const handleTopologyTypeChange = useCallback((type) => {
    setTopology(prev => ({ ...prev, type }));
  }, []);

  const handleSwitchCountChange = useCallback((count) => {
    setTopology(prev => ({ ...prev, switchCount: Math.max(3, Math.min(10, count)) }));
  }, []);

  const handleHostsChange = useCallback((count) => {
    setTopology(prev => ({ ...prev, hostsPerSwitch: Math.max(1, Math.min(5, count)) }));
  }, []);

  // ── 3. useEffect — always last, after all hooks ────────────────────────────
  useEffect(() => {
    let interval;

    const loadState = async () => {
      try {
        const data = await fetchDashboard();
        applyDashboardData(data);
      } catch (err) {
        console.error('Background poll failed:', err);
      }
    };

    loadState(); // initial fetch
    interval = setInterval(loadState, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [applyDashboardData]); // stable — applyDashboardData never changes

  // ── 4. Return ──────────────────────────────────────────────────────────────
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
      isRecovering,
      actionError,
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
      toggleAutoFailureMode,
      refreshNow,
    },
  };
}
