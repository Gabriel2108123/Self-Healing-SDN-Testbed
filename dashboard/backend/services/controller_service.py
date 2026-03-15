class ControllerService:
    def __init__(self):
        """
        Phase 2-ready controller adapter.

        This service still uses simple internal state for now, but it no longer
        presents itself as a pure mock-only service. It is designed so we can
        later plug in real controller health checks, topology discovery parsing,
        and recovery telemetry from Ryu.
        """
        self._status = "offline"
        self._recovery_status = "stable"
        self._mode = "live-prep"

    def set_status(self, status: str):
        self._status = status

    def set_recovery_status(self, status: str):
        self._recovery_status = status

    def get_controller_status(self):
        return self._status

    def get_mode(self):
        return self._mode

    def get_discovered_topology(self):
        """
        Later: return live discovered topology data from the controller/log parser.
        """
        return []

    def get_recovery_status(self):
        return self._recovery_status

    def get_load_balancing_status(self):
        return False

    def get_predictive_status(self):
        return False
