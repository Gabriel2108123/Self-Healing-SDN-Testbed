import logging

logger = logging.getLogger(__name__)

class MininetService:
    def __init__(self):
        """
        Abstraction layer for starting/stopping the Mininet topology.
        For Phase 1, it implements safe stub/mock behaviour.
        """
        self._is_running = False

    def launch_ring_topology(self, switch_count: int, hosts_per_switch: int):
        logger.info(f"Mock launching Ring topology with {switch_count} switches...")
        self._is_running = True
        return True, "Ring topology mock launched."

    def launch_mesh_topology(self, switch_count: int, hosts_per_switch: int):
        logger.info(f"Mock launching Mesh topology with {switch_count} switches...")
        self._is_running = True
        return True, "Mesh topology mock launched."

    def stop_topology(self):
        if self._is_running:
            logger.info("Mock stopping topology...")
            self._is_running = False
            return True, "Topology stopped successfully."
        return False, "No topology was running."

    def reset_topology(self, config):
        logger.info("Mock resetting topology...")
        return True, "Topology reset successfully."

    def get_runtime_status(self):
        return "running" if self._is_running else "stopped"
