import { useState, useCallback, useEffect } from 'react';
import { 
  INITIAL_TOPOLOGY, 
  INITIAL_DASHBOARD_STATE, 
  INITIAL_METRICS, 
  INITIAL_EVENTS, 
  INITIAL_EXPLANATION 
} from '../data/mockData';
import { fetchDashboard, launchTopology, stopTopology, resetTopology, simulateFailure } from '../api';
import { REFRESH_INTERVAL_MS } from '../config';

export function useDashboardState() {
  const [topology, setTopology] = useState(INITIAL_TOPOLOGY);
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD_STATE);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [explanation, setExplanation] = useState(INITIAL_EXPLANATION);
  const [failedLink, setFailedLink] = useState(null); // format: { source: 1, target: 2 } or null
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);

  useEffect(() => {
    let interval;
    const loadState = async () => {
      try {
        const data = await fetchDashboard();
        
        // Update all related component state using the backend payload
        setTopology({
          type: data.topology?.topologyType || 'unknown',
          switchCount: data.topology?.switchCount || 0,
          hostsPerSwitch: data.topology?.hostsPerSwitch || 0,
          estimatedLinks: data.topology?.estimatedLinks || 0,
          status: data.topology?.runtimeStatus || 'unknown'
        });
        
        setDashboard({ 
          controllerStatus: data.controller?.status || 'offline',
          recoveryStatus: data.recovery?.status || 'stable',
          mockMode: false,
          loadBalancingEnabled: data.features?.loadBalancingEnabled || false,
          predictiveRecoveryEnabled: data.features?.predictiveRecoveryEnabled || false
        });
        setMetrics(data.metrics || INITIAL_METRICS);
        setEvents(data.recentEvents || INITIAL_EVENTS);
        setExplanation(data.latestExplanation || INITIAL_EXPLANATION);

      } catch (err) {
        console.error("Failed to fetch dashboard state", err);
      }
    };

    loadState();
    interval = setInterval(loadState, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const addEvent = useCallback((severity, message) => {
    const newEvent = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        severity,
        message,
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // keep last 50
  }, []);

  const handleTopologyTypeChange = useCallback((type) => {
    setTopology(prev => ({ ...prev, type }));
    addEvent('info', `Topology type changed to ${type}`);
    setExplanation({
      title: 'Topology Type Changed',
      body: type === 'ring' 
        ? 'A ring topology connects each switch to exactly two other switches, forming a continuous pathway. It is efficient and offers a simple failover path.' 
        : 'A mesh topology connects each switch to multiple other switches. It provides high redundancy and multiple paths for load balancing.'
    });
  }, [addEvent]);

  const handleSwitchCountChange = useCallback((count) => {
    const validCount = Math.max(3, Math.min(10, count));
    setTopology(prev => ({ ...prev, switchCount: validCount }));
    addEvent('info', `Switch count set to ${validCount}`);
  }, [addEvent]);

  const handleHostsChange = useCallback((count) => {
    const validCount = Math.max(1, Math.min(5, count));
    setTopology(prev => ({ ...prev, hostsPerSwitch: validCount }));
  }, []);

  const handleLaunchTopology = useCallback(async (type, switchCount, hostsPerSwitch) => {
    setTopology(prev => ({ ...prev, status: 'launching', type, switchCount, hostsPerSwitch }));
    addEvent('info', 'Topology launch requested...');
    
    try {
      await launchTopology({
        topologyType: type,
        switchCount,
        hostsPerSwitch
      });
      addEvent('success', 'Topology launch command sent successfully.');
    } catch (err) {
      console.error(err);
      addEvent('error', 'Failed to launch topology: ' + err.message);
      setTopology(prev => ({ ...prev, status: 'error' }));
    }
  }, [addEvent]);

  const handleStopTopology = useCallback(async () => {
    addEvent('info', 'Stopping topology...');
    try {
      await stopTopology();
      
      setTopology(prev => ({ ...prev, status: 'stopped' }));
      setFailedLink(null);
      setMetrics(INITIAL_METRICS);
      setExplanation({
        title: 'Network Stopped',
        body: 'The simulated network has been halted.'
      });
    } catch (err) {
      console.error(err);
      addEvent('error', 'Stop failed: ' + err.message);
    }
  }, [addEvent]);

  const handleResetTopology = useCallback(async () => {
    setTopology(prev => ({ ...prev, status: 'launching' }));
    setFailedLink(null);
    addEvent('info', 'Resetting topology...');
    
    try {
      await resetTopology();
      addEvent('success', 'Topology reset successful.');
      setExplanation({
          title: 'Network Reset',
          body: 'The network has been cleanly reset to its default running state.'
      });
      setMetrics(prev => ({ ...prev, healthScore: 100 }));
    } catch (err) {
      console.error(err);
      addEvent('error', 'Reset failed: ' + err.message);
      setTopology(prev => ({ ...prev, status: 'error' }));
    }
  }, [addEvent]);

  const handleSimulateFailure = useCallback(async () => {
    if (topology.status !== 'running' || isSimulatingFailure) return;

    setIsSimulatingFailure(true);
    addEvent('warning', 'Sending simulated link failure command...');

    try {
      await simulateFailure({ sourceSwitch: 's1', targetSwitch: 's2' });
    } catch (err) {
      console.error(err);
      addEvent('error', 'Failed to simulate link failure: ' + err.message);
    } finally {
      setTimeout(() => setIsSimulatingFailure(false), 1000);
    }
  }, [topology.status, isSimulatingFailure, addEvent]);

  const toggleLoadBalancing = useCallback(() => {
    setDashboard(prev => {
      const newVal = !prev.loadBalancingEnabled;
      addEvent('info', `Load balancing ${newVal ? 'enabled' : 'disabled'}.`);
      return { ...prev, loadBalancingEnabled: newVal };
    });
  }, [addEvent]);

  const togglePredictiveRecovery = useCallback(() => {
    setDashboard(prev => {
      const newVal = !prev.predictiveRecoveryEnabled;
      addEvent('info', `Predictive recovery ${newVal ? 'enabled' : 'disabled'}.`);
      return { ...prev, predictiveRecoveryEnabled: newVal };
    });
  }, [addEvent]);

  return {
    state: {
      topology,
      dashboard,
      metrics,
      events,
      explanation,
      failedLink,
      isSimulatingFailure,
    },
    actions: {
      handleTopologyTypeChange,
      handleSwitchCountChange,
      handleHostsChange,
      handleLaunchTopology,
      handleStopTopology,
      handleResetTopology,
      handleSimulateFailure,
      toggleLoadBalancing,
      togglePredictiveRecovery,
    }
  };
}
