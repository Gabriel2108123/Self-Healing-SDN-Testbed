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
        hosts_per_switch = config.get("hostsPerSwitch", 1)

        if t_type == "ring":
            body = (
                f"A ring topology is now active with {switches} switches and "
                f"{hosts_per_switch} host(s) attached to each switch. "
                f"In a ring, every switch is connected to two neighbouring switches, "
                f"which makes it easier to demonstrate how traffic can be rerouted "
                f"when one connection fails. The network is currently operating normally."
            )
        else:
            body = (
                f"A mesh topology is now active with {switches} switches and "
                f"{hosts_per_switch} host(s) attached to each switch. "
                f"In a mesh, switches are connected to multiple other switches, "
                f"which provides more redundancy and more alternative paths for traffic. "
                f"The network is currently operating normally."
            )

        self._latest_explanation = {
            "title": f"{t_type.capitalize()} topology is active",
            "body": body,
            "sourceEventId": event_id
        }
        logger.info("Generated explanation for topology creation.")

    def explain_failure_detected(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Link Failure Detected",
            "body": (
                "A link between two switches has been marked as failed. "
                "This matters because traffic may no longer be able to use its original route. "
                "The controller is now identifying the disruption and preparing an alternative path "
                "so communication can continue with minimal interruption."
            ),
            "sourceEventId": event_id
        }
        logger.info("Generated explanation for failure detection.")

    def explain_recovery_started(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Recovery In Progress",
            "body": (
                "The controller has started the recovery process. "
                "It is now recalculating a valid route and preparing to install updated flow rules "
                "so traffic can avoid the failed link. "
                "At this stage, the network is adapting to the disruption."
            ),
            "sourceEventId": event_id
        }

    def explain_recovery_completed(self, event=None, event_id=None):
        self._latest_explanation = {
            "title": "Traffic Rerouted",
            "body": (
                "The controller has successfully rerouted traffic around the failed link. "
                "This means communication can continue using an alternative path. "
                "The network is now stable again, although the failed link remains marked "
                "so users can see which connection caused the disruption."
            ),
            "sourceEventId": event_id
        }

    def explain_topology_stopped(self, event_id=None):
        self._latest_explanation = {
            "title": "Network Offline",
            "body": (
                "The Mininet topology has been stopped. "
                "No active network paths are currently running, so no traffic is being routed. "
                "The controller may still be online, but the simulated network itself is offline."
            ),
            "sourceEventId": event_id
        }

    def get_latest_explanation(self):
        return self._latest_explanation.copy()
