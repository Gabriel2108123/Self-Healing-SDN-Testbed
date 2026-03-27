import logging

logger = logging.getLogger(__name__)

class ExplanationService:
    def __init__(self):
        self._latest_explanation = {
            "title": "Dashboard loaded",
            "body": "The Self-Healing SDN Testbed backend has started and is awaiting topology configuration.",
            "sourceEventId": None
        }

    def explain_topology_created(self, config, event_id=None):
        t_type = config.get("topologyType", "ring")
        switches = config.get("switchCount", 3)
        
        if t_type == "ring":
            body = f"The network is currently running in a ring structure with {switches} switches. This gives each switch two neighbouring connections, which helps demonstrate rerouting when a link fails."
        else:
            body = f"The network is currently running in a mesh structure with {switches} switches. This provides multiple paths for load balancing and redundancy."
            
        self._latest_explanation = {
            "title": f"{t_type.capitalize()} topology is active",
            "body": body,
            "sourceEventId": event_id
        }
        logger.info("Generated explanation for topology creation.")

    def explain_failure_detected(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Link Failure Simulated",
            "body": "A connection between two switches has been broken. The SDN controller is detecting the fault and recalculating alternative paths.",
            "sourceEventId": event_id
        }
        logger.info("Generated explanation for failure detection.")

    def explain_recovery_started(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Recovery workflow initiated",
            "body": "The controller is installing backup flow rules to bypass the failed link.",
            "sourceEventId": event_id
        }

    def explain_recovery_completed(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Traffic Rerouted",
            "body": "The controller has successfully installed new flow rules to bypass the failed link. Service is fully restored.",
            "sourceEventId": event_id
        }
        
    def explain_topology_stopped(self, event_id=None):
        self._latest_explanation = {
            "title": "Network Offline",
            "body": "The Mininet topology simulation has been stopped.",
            "sourceEventId": event_id
        }

    def get_latest_explanation(self):
        return self._latest_explanation.copy()
