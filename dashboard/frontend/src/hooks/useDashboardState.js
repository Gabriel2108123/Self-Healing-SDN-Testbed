import { useState, useCallback } from 'react';
import { 
  INITIAL_TOPOLOGY, 
  INITIAL_DASHBOARD_STATE, 
  INITIAL_METRICS, 
  INITIAL_EVENTS, 
  INITIAL_EXPLANATION 
} from '../data/mockData';

export function useDashboardState() {
  const [topology, setTopology] = useState(INITIAL_TOPOLOGY);
  const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD_STATE);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [explanation, setExplanation] = useState(INITIAL_EXPLANATION);
  const [failedLink, setFailedLink] = useState(null); // format: { source: 1, target: 2 } or null

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

  const handleLaunchTopology = useCallback(() => {
    setTopology(prev => ({ ...prev, status: 'launching' }));
    setDashboard(prev => ({ ...prev, controllerStatus: 'online' }));
    addEvent('info', 'Topology launch requested...');
    
    // Simulate delay
    setTimeout(() => {
      setTopology(prev => ({ ...prev, status: 'running' }));
      setDashboard(prev => ({ ...prev, recoveryStatus: 'stable' }));
      setFailedLink(null);
      setMetrics({
        creationTime: '1.2s',
        discoveryTime: '0.8s',
        failureDetectionTime: '—',
        recoveryTime: '—',
        activeFlows: topology.switchCount * 4,
        averageLatency: '12ms',
        healthScore: 100,
      });
      addEvent('success', 'Topology launched and stable.');
      setExplanation({
        title: 'Network Active',
        body: `The ${topology.type} topology with ${topology.switchCount} switches is now running securely. The controller is monitoring the network state.`
      });
    }, 1500);
  }, [topology, addEvent]);

  const handleStopTopology = useCallback(() => {
    setTopology(prev => ({ ...prev, status: 'stopped' }));
    setDashboard(prev => ({ ...prev, controllerStatus: 'offline', recoveryStatus: 'stable' }));
    setFailedLink(null);
    setMetrics(INITIAL_METRICS);
    addEvent('info', 'Topology stopped.');
    setExplanation({
      title: 'Network Stopped',
      body: 'The simulated network has been halted. Controller and all links are offline.'
    });
  }, [addEvent]);

  const handleResetTopology = useCallback(() => {
    setTopology(prev => ({ ...prev, status: 'launching' }));
    setFailedLink(null);
    addEvent('info', 'Resetting topology...');
    setTimeout(() => {
      setTopology(prev => ({ ...prev, status: 'running' }));
      setDashboard(prev => ({ ...prev, recoveryStatus: 'stable', controllerStatus: 'online' }));
      addEvent('success', 'Topology reset successful.');
      setExplanation({
          title: 'Network Reset',
          body: 'The network has been cleanly reset to its default running state.'
      });
      setMetrics(prev => ({ ...prev, healthScore: 100 }));
    }, 1000);
  }, [addEvent]);

  const handleSimulateFailure = useCallback(() => {
    if (topology.status !== 'running') return;
    
    // Pick a random link (e.g. S1 -> S2) for mock
    setFailedLink({ source: 's1', target: 's2' });
    setDashboard(prev => ({ ...prev, recoveryStatus: 'failure detected' }));
    addEvent('error', 'Critical: Simulated link failure detected between S1 and S2.');
    setExplanation({
      title: 'Link Failure Simulated',
      body: 'A connection between two switches has been broken. The SDN controller is now detecting the fault and recalculating alternative paths.'
    });
    setMetrics(prev => ({ ...prev, healthScore: 65, failureDetectionTime: '45ms' }));

    // Simulate recovery process
    setTimeout(() => {
      setDashboard(prev => ({ ...prev, recoveryStatus: 'recovering' }));
      addEvent('warning', 'Recovery workflow initiated. rerouting traffic...');
      
      setTimeout(() => {
        setDashboard(prev => ({ ...prev, recoveryStatus: 'recovered' }));
        addEvent('success', 'Traffic rerouted successfully. Network stable.');
        setExplanation({
          title: 'Traffic Rerouted',
          body: 'The controller has successfully installed new flow rules to bypass the failed link. Service is fully restored.'
        });
        setMetrics(prev => ({ ...prev, healthScore: 95, recoveryTime: '120ms' }));
      }, 1500);
    }, 1000);
  }, [topology.status, addEvent]);

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
