import logging

logger = logging.getLogger(__name__)

class MetricsService:
    def __init__(self):
        self._metrics = {}
        self.reset()
        
    def reset(self):
        """Reset metrics to a clean initial state (e.g. topology stopped)."""
        self._metrics = {
            "creationTimeMs": None,
            "discoveryTimeMs": None,
            "failureDetectionTimeMs": None,
            "recoveryTimeMs": None,
            "activeFlows": 0,
            "averageLatencyMs": None,
            "healthScore": 100,
            "isMock": False,
            "detectedFailures": 0,
            "successfulRecoveries": 0,
        }

    def initialise_metrics(self, config):
        """Set up placeholder safe initial metrics when topology is created."""
        self.reset()
        # Mock values for phase 1 - to be replaced by real Mininet timing later
        self.record_topology_creation_time(420)
        self.record_discovery_time(180)
        
        switch_count = config.get("switchCount", 3)
        self.set_active_flows(switch_count * 2)
        self.set_latency(6.4)
        logger.info("Metrics initialised with mock placeholder values.")
        
    def record_topology_creation_time(self, ms: int):
        self._metrics["creationTimeMs"] = ms
        
    def record_discovery_time(self, ms: int):
        self._metrics["discoveryTimeMs"] = ms
        
    def record_failure_detection_time(self, ms: int):
        self._metrics["failureDetectionTimeMs"] = ms
        
    def record_recovery_time(self, ms: int):
        self._metrics["recoveryTimeMs"] = ms
        
    def set_active_flows(self, count: int):
        self._metrics["activeFlows"] = count
        
    def set_latency(self, ms: float):
        self._metrics["averageLatencyMs"] = ms
        
    def set_health_score(self, score: int):
        self._metrics["healthScore"] = score
        
    def get_metrics(self):
        return self._metrics.copy()
        
    def increment_detected_failures(self):
        self._metrics["detectedFailures"] += 1
        
    def increment_successful_recoveries(self):
        self._metrics["successfulRecoveries"] += 1
