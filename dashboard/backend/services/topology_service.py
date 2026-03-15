import logging
from utils.validators import validate_topology_config

logger = logging.getLogger(__name__)


class TopologyService:

    def __init__(self, mininet_service, metrics_service, event_service, explanation_service, dashboard_service):
        self.mininet = mininet_service
        self.metrics = metrics_service
        self.events = event_service
        self.explanations = explanation_service
        self.dashboard = dashboard_service

    def create_topology(self, config: dict):

        is_valid, err_msg = validate_topology_config(config)

        if not is_valid:
            logger.warning(f"Validation failed: {err_msg}")
            return False, err_msg

        self.events.add_event(
            "info",
            "info",
            f"Topology configured as {config.get('topologyType')}"
        )

        self.dashboard.set_topology_state(config, status="launching")

        topology_type = config.get("topologyType")
        switch_count = config.get("switchCount")
        hosts_per_switch = config.get("hostsPerSwitch", 1)

        if topology_type == "ring":
            success, msg = self.mininet.launch_ring_topology(switch_count, hosts_per_switch)
        else:
            success, msg = self.mininet.launch_mesh_topology(switch_count, hosts_per_switch)

        if success:

            self.dashboard.set_runtime_status("running")

            self.dashboard.controller_service.set_status("online")
            self.dashboard.controller_service.set_recovery_status("stable")

            self.metrics.initialise_metrics(config)

            ev = self.events.add_event(
                "success",
                "success",
                "Topology launched successfully"
            )

            self.explanations.explain_topology_created(config, event_id=ev["id"])

            return True, "Topology created successfully"

        self.dashboard.set_runtime_status("error")

        self.events.add_event(
            "error",
            "error",
            f"Topology launch failed: {msg}"
        )

        return False, msg

    def reset_topology(self):

        if not self.dashboard.running:
            return False, "No topology is currently running to reset"

        config = self.dashboard.current_topology_config

        self.events.add_event(
            "info",
            "info",
            "Resetting topology requested"
        )

        self.dashboard.set_runtime_status("launching")

        reset_config = {
            "topology_type": config.get("topologyType", "ring"),
            "switch_count": config.get("switchCount", 3),
            "hosts_per_switch": config.get("hostsPerSwitch", 1)
        }

        success, msg = self.mininet.reset_topology(reset_config)

        if success:

            self.dashboard.set_runtime_status("running")

            self.dashboard.controller_service.set_status("online")
            self.dashboard.controller_service.set_recovery_status("stable")

            self.metrics.initialise_metrics(config)

            ev = self.events.add_event(
                "success",
                "success",
                "Topology reset successfully"
            )

            self.explanations.explain_topology_created(config, event_id=ev["id"])

            return True, "Topology reset successfully"

        self.dashboard.set_runtime_status("error")

        self.events.add_event(
            "error",
            "error",
            f"Topology reset failed: {msg}"
        )

        return False, msg

    def stop_topology(self):

        success, msg = self.mininet.stop_topology()

        if success:

            self.dashboard.set_runtime_status("stopped")

            self.dashboard.controller_service.set_status("offline")
            self.dashboard.controller_service.set_recovery_status("stable")

            self.metrics.reset()

            ev = self.events.add_event(
                "info",
                "info",
                "Topology stopped safely by user"
            )

            self.explanations.explain_topology_stopped(event_id=ev["id"])

            return True, "Topology stopped"

        return False, msg

    def get_current_topology(self):

        return self.dashboard.get_dashboard_summary()["topology"]

    def simulate_failure(self, request_payload: dict):

        if not self.dashboard.running:
            return False, "Cannot simulate failure: network is offline"

        src = request_payload.get("sourceSwitch", "s1")
        dst = request_payload.get("targetSwitch", "s2")

        self.dashboard.controller_service.set_recovery_status("failure detected")

        ev = self.events.add_event(
            "error",
            "error",
            f"Critical: Simulated link failure detected between {src} and {dst}"
        )

        self.explanations.explain_failure_detected(event_id=ev["id"])

        # Placeholder behaviour until real failure injection is implemented

        self.dashboard.controller_service.set_recovery_status("recovering")

        self.events.add_event(
            "warning",
            "warning",
            "Recovery workflow initiated. Rerouting traffic..."
        )

        self.explanations.explain_recovery_started()

        self.dashboard.controller_service.set_recovery_status("recovered")

        self.events.add_event(
            "success",
            "success",
            "Traffic rerouted successfully. Network stable"
        )

        self.explanations.explain_recovery_completed()

        return True, "Failure simulation triggered and recovery completed"
