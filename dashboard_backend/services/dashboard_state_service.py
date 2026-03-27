from utils.topology_helpers import estimate_link_count

class DashboardStateService:
    def __init__(self, metrics_service, event_service, explanation_service, controller_service):
        self.metrics_service = metrics_service
        self.event_service = event_service
        self.explanation_service = explanation_service
        self.controller_service = controller_service
        
        self.current_topology_config = None
        self.running = False
        self.runtime_status = "idle" # Options: idle, launching, running, stopped, error
        self.feature_flags = {
            "loadBalancingEnabled": False,
            "predictiveRecoveryEnabled": False
        }

    def set_topology_state(self, config, status="launching"):
        self.current_topology_config = config
        self.set_runtime_status(status)

    def set_runtime_status(self, status: str):
        self.runtime_status = status
        self.running = (status == "running")
        
    def set_feature_flags(self, lb_enabled=None, pr_enabled=None):
        if lb_enabled is not None:
            self.feature_flags["loadBalancingEnabled"] = lb_enabled
        if pr_enabled is not None:
            self.feature_flags["predictiveRecoveryEnabled"] = pr_enabled

    def get_dashboard_summary(self):
        """Assembles a full snapshot of the system for the UI base dashboard route."""
        topo = {
            "topologyType": None,
            "switchCount": 0,
            "hostsPerSwitch": 0,
            "estimatedLinks": 0,
            "runtimeStatus": self.runtime_status,
            "running": self.running
        }
        
        if self.current_topology_config:
            t_type = self.current_topology_config.get("topologyType")
            switches = self.current_topology_config.get("switchCount", 0)
            
            topo["topologyType"] = t_type
            topo["switchCount"] = switches
            topo["hostsPerSwitch"] = self.current_topology_config.get("hostsPerSwitch", 0)
            topo["estimatedLinks"] = estimate_link_count(t_type, switches)
        
        return {
            "topology": topo,
            "controller": {
                "status": self.controller_service.get_controller_status(),
                "mode": "mock"
            },
            "metrics": self.metrics_service.get_metrics(),
            "recovery": {
                "status": self.controller_service.get_recovery_status()
            },
            "features": self.feature_flags,
            "latestExplanation": self.explanation_service.get_latest_explanation(),
            "recentEvents": self.event_service.get_recent_events()
        }
