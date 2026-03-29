import logging
import random
from utils.validators import validate_topology_config

logger = logging.getLogger(__name__)

class TopologyService:
    def __init__(self, mininet_service, metrics_service, event_service, explanation_service, dashboard_service, link_state_service):
        self.mininet = mininet_service
        self.metrics = metrics_service
        self.events = event_service
        self.explanations = explanation_service
        self.dashboard = dashboard_service
        self.link_state = link_state_service

    def _build_switch_links(self, topology_type: str, switch_count: int):
        links = []

        if topology_type == "ring":
            for i in range(1, switch_count + 1):
                source = f"s{i}"
                target = f"s{1 if i == switch_count else i + 1}"
                links.append((source, target))

        elif topology_type == "mesh":
            for i in range(1, switch_count + 1):
                for j in range(i + 1, switch_count + 1):
                    links.append((f"s{i}", f"s{j}"))

        return links

    def _get_random_healthy_link(self):
        healthy_links = self.link_state.get_healthy_links()

        if not healthy_links:
            return None

        return random.choice(healthy_links)

    def create_topology(self, config: dict):
        is_valid, err_msg = validate_topology_config(config)

        if not is_valid:
            logger.warning(f"Validation failed: {err_msg}")
            return False, err_msg

        if self.dashboard.running:
            current = self.dashboard.current_topology_config or {}
            current_type = current.get("topologyType", "unknown")
            return False, f"A topology is already running: {current_type}"

        self.events.add_event(
            "info",
            "info",
            f"Topology configured as {config.get('topologyType')}"
        )

        self.dashboard.set_topology_state(config, status="launching")
        self.dashboard.clear_failed_links()
        self.dashboard.set_active_path_strategy("single-path")

        topology_type = config.get("topologyType")
        switch_count = config.get("switchCount")
        hosts_per_switch = config.get("hostsPerSwitch", 1)

        self.link_state.reset()
        topology_links = self._build_switch_links(topology_type, switch_count)
        self.link_state.register_links_from_pairs(topology_links)

        if topology_type == "ring":
            success, msg = self.mininet.create_ring_topology(switch_count, hosts_per_switch)
        elif topology_type == "mesh":
            success, msg = self.mininet.create_mesh_topology(switch_count, hosts_per_switch)
        else:
            self.dashboard.set_runtime_status("error")
            return False, f"Unsupported topology type: {topology_type}"

        if success:
            self.dashboard.set_runtime_status("running")
            self.metrics.initialise_metrics(config)
            self.metrics.set_path_strategy("single-path")
            self.metrics.set_prediction("low", "No immediate instability predicted.")
            event = self.events.add_event("success", "success", "Topology launched successfully")
            self.explanations.explain_topology_created(config, event_id=event["id"])
            return True, msg

        self.dashboard.set_runtime_status("error")
        self.events.add_event("error", "error", f"Topology launch failed: {msg}")
        return False, msg

    def simulate_random_link_failure(self):
        if not self.dashboard.running:
            return False, "No running topology available."

        selected_link = self._get_random_healthy_link()
        if not selected_link:
            return False, "No healthy links available to fail."

        source = selected_link["source"]
        target = selected_link["target"]

        marked = self.link_state.mark_failed(source, target)
        if not marked:
            return False, f"Failed to mark link {source}-{target} as failed."

        failed_links = self.link_state.get_failed_links()
        self.dashboard.set_failed_links(failed_links)

        self.events.add_event(
            "warning",
            "warning",
            f"Random link failure simulated on {source}-{target}"
        )

        self.metrics.increment_detected_failures()
        self.metrics.record_failure_detection_time(120)
        self.metrics.set_prediction("medium", f"Failure detected on {source}-{target}.")

        return True, {
            "failedLink": {
                "source": source,
                "target": target
            },
            "failedLinks": failed_links
        }

    def recover_one_failed_link(self):
        if not self.dashboard.running:
            return False, "No running topology available."

        failed_links = self.link_state.get_failed_links()
        if not failed_links:
            return False, "No failed links available to recover."

        link = failed_links[0]
        source = link["source"]
        target = link["target"]

        recovered = self.link_state.mark_recovered(source, target)
        if not recovered:
            return False, f"Failed to recover link {source}-{target}."

        remaining_failed_links = self.link_state.get_failed_links()
        self.dashboard.set_failed_links(remaining_failed_links)

        self.events.add_event(
            "success",
            "success",
            f"Link recovered on {source}-{target}"
        )

        self.metrics.increment_successful_recoveries()
        self.metrics.record_recovery_time(200)

        if remaining_failed_links:
            self.metrics.set_prediction("medium", "Some failed links still remain.")
        else:
            self.metrics.set_prediction("low", "No immediate instability predicted.")

        return True, {
            "recoveredLink": {
                "source": source,
                "target": target
            },
            "failedLinks": remaining_failed_links
        }

    def reset_topology(self):
        if not self.dashboard.running:
            return False, "No topology is currently running to reset."

        config = self.dashboard.current_topology_config

        self.events.add_event("info", "info", "Resetting topology requested.")
        self.dashboard.set_runtime_status("launching")
        self.dashboard.clear_failed_links()
        self.dashboard.set_active_path_strategy("single-path")

        success, msg = self.mininet.stop_topology()
        if not success:
            logger.warning(f"Failed to fully stop topology during reset: {msg}")

        t_type = config.get("topologyType")
        switches = config.get("switchCount")
        hosts = config.get("hostsPerSwitch", 1)

        if t_type == "ring":
            success, msg = self.mininet.create_ring_topology(switches, hosts)
        elif t_type == "mesh":
            success, msg = self.mininet.create_mesh_topology(switches, hosts)
        else:
            self.dashboard.set_runtime_status("error")
            return False, f"Unsupported topology type during reset: {t_type}"

        if success:
            self.dashboard.set_runtime_status("running")
            self.dashboard.controller_service.set_recovery_status("stable")
            self.metrics.initialise_metrics(config)
            self.events.add_event("success", "success", "Topology reset successfully.")
            self.explanations.explain_topology_created(config)
            return True, "Topology reset successfully."

        self.dashboard.set_runtime_status("error")
        return False, msg

    def stop_topology(self):
        success, msg = self.mininet.stop_topology()


        if success:
            self.dashboard.current_topology_config = None
            self.dashboard.set_runtime_status("stopped")
            self.dashboard.clear_failed_links()
            self.dashboard.set_active_path_strategy("single-path")
            self.metrics.reset()
            event = self.events.add_event("info", "info", "Topology stopped successfully")
            self.explanations.explain_topology_stopped(event_id=event["id"])
            return True, msg

        self.dashboard.set_runtime_status("error")
        self.events.add_event("error", "error", f"Failed to stop topology: {msg}")
        return False, msg

    def get_current_topology(self):
        return self.dashboard.get_dashboard_summary()["topology"]

    def simulate_failure(self, request_payload: dict):
        if not self.dashboard.running:
            return False, "Cannot simulate failure: network is offline."

        src = request_payload.get("sourceSwitch", "s1")
        dst = request_payload.get("targetSwitch", "s2")

        self.dashboard.set_failed_links([
            {
                "source": src,
                "target": dst,
                "status": "failed"
            }
        ])
        self.dashboard.set_active_path_strategy("rerouted")
        self.metrics.set_path_strategy("rerouted")

        # Failure detected
        self.dashboard.controller_service.set_recovery_status("failure detected")
        self.metrics.increment_detected_failures()
        self.metrics.record_failure_detection_time(120)
        self.metrics.set_health_score(65)
        self.metrics.set_prediction(
            "medium",
            f"A recent failure was detected between {src} and {dst}. Monitoring for repeated instability."
        )

        failure_event = self.events.add_event(
            "error",
            "error",
            f"Critical: Simulated link failure detected between {src} and {dst}."
        )
        self.explanations.explain_failure_detected(event_id=failure_event["id"])

        # Recovery started
        self.dashboard.controller_service.set_recovery_status("recovering")
        recovery_start_event = self.events.add_event(
            "warning",
            "warning",
            "Recovery workflow initiated. rerouting traffic..."
        )
        self.explanations.explain_recovery_started(event_id=recovery_start_event["id"])

        # Recovery completed
        self.dashboard.controller_service.set_recovery_status("recovered")
        self.metrics.increment_successful_recoveries()
        self.metrics.record_recovery_time(340)
        self.metrics.set_health_score(95)
        self.metrics.set_path_strategy("rerouted")
        self.metrics.set_prediction(
            "low",
            "The network has recovered successfully. No immediate instability is predicted."
        )

        recovery_complete_event = self.events.add_event(
            "success",
            "success",
            "Traffic rerouted successfully. Network stable."
        )
        self.explanations.explain_recovery_completed(event_id=recovery_complete_event["id"])

        return True, "Failure simulation triggered and recovery completed (mock)."

