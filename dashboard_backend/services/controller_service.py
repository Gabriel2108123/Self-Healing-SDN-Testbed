class ControllerService:
    def __init__(self):
        """
        Backend-facing adapter for SDN controller integration.
        For Phase 1, it provides safe mock placeholders.
        """
        self._mock_status = "unknown"
        self._recovery_status = "stable"

    def set_mock_status(self, status: str):
        self._mock_status = status
        
    def set_recovery_status(self, status: str):
        self._recovery_status = status

    def get_controller_status(self):
        return self._mock_status

    def get_discovered_topology(self):
        """Later: collect real live topology data."""
        return []

    def get_recovery_status(self):
        return self._recovery_status

    def get_load_balancing_status(self):
        return False

    def get_predictive_status(self):
        return False
