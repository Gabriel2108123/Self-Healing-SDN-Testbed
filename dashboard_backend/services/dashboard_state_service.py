from utils.topology_helpers import estimate_link_count

class DashboardStateService:
    def __init__(self, metrics_service, event_service, explanation_service, controller_service):
        self.metrics_service = metrics_service
        self.event_service = event_service
        self.explanation_service = explanation_service
        self.controller_service = controller_service
        self.failed_links = []
        self.active_path_strategy = "single-path"
        
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
    def set_failed_links(self, failed_links):
        self.failed_links = failed_links or []

    def clear_failed_links(self):
        self.failed_links = []

    def set_active_path_strategy(self, strategy: str):
        self.active_path_strategy = strategy

    def _build_topology_graph(self, topology_type, switch_count, hosts_per_switch):
        nodes = []
        links = []

        if not topology_type or switch_count <= 0:
            return {"nodes": [], "links": []}

        failed_pairs = {
            tuple(sorted((link["source"], link["target"])))
            for link in self.failed_links
        }

        # Switch nodes
        for i in range(1, switch_count + 1):
            nodes.append({
                "id": f"s{i}",
                "label": f"s{i}",
                "type": "switch",
                "status": "active"
            })

        # Host nodes and host-switch links
        host_id = 1
        for i in range(1, switch_count + 1):
            for _ in range(hosts_per_switch):
                hid = f"h{host_id}"
                sid = f"s{i}"

                nodes.append({
                    "id": hid,
                    "label": hid,
                    "type": "host",
                    "status": "active"
                })

                links.append({
                    "source": hid,
                    "target": sid,
                    "kind": "host",
                    "status": "active"
                })

                host_id += 1

        # Inter-switch links
        switch_links = []

        if topology_type == "ring":
            for i in range(1, switch_count + 1):
                src = f"s{i}"
                dst = f"s{1 if i == switch_count else i + 1}"
                pair = tuple(sorted((src, dst)))
                if pair not in {tuple(sorted((l["source"], l["target"]))) for l in switch_links}:
                    switch_links.append({"source": src, "target": dst})

        elif topology_type == "mesh":
            for i in range(1, switch_count + 1):
                for j in range(i + 1, switch_count + 1):
                    switch_links.append({
                        "source": f"s{i}",
                        "target": f"s{j}"
                    })

        for link in switch_links:
            pair = tuple(sorted((link["source"], link["target"])))
            links.append({
                "source": link["source"],
                "target": link["target"],
                "kind": "switch",
                "status": "failed" if pair in failed_pairs else "active"
            })

        return {
            "nodes": nodes,
            "links": links
        }

    def get_dashboard_summary(self):
        """Assembles a full snapshot of the system for the UI base dashboard route."""
        topo = {
            "topologyType": None,
            "switchCount": 0,
            "hostsPerSwitch": 0,
            "estimatedLinks": 0,
            "runtimeStatus": self.runtime_status,
            "running": self.running,
            "failedLinks": self.failed_links,
            "activePathStrategy": self.active_path_strategy,
            "graph": {
                "nodes": [],
                "links": []
            }
        }

        if self.current_topology_config:
            t_type = self.current_topology_config.get("topologyType")
            switches = self.current_topology_config.get("switchCount", 0)

            topo["topologyType"] = t_type
            topo["switchCount"] = switches
            topo["hostsPerSwitch"] = self.current_topology_config.get("hostsPerSwitch", 0)
            topo["estimatedLinks"] = estimate_link_count(t_type, switches)
            topo["graph"] = self._build_topology_graph(
                t_type,
                switches,
                topo["hostsPerSwitch"]
            )

        return {
            "topology": topo,
            "controller": {
                "status": self.controller_service.get_controller_status(),
                "mode": "live"
            },
            "metrics": self.metrics_service.get_metrics(),
            "recovery": {
                "status": self.controller_service.get_recovery_status()
            },
            "features": self.feature_flags,
            "latestExplanation": self.explanation_service.get_latest_explanation(),
            "recentEvents": self.event_service.get_recent_events()
        }

