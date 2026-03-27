import subprocess


class ControllerService:
    def __init__(self):
        self._recovery_status = "stable"

    def _is_controller_running(self) -> bool:
        patterns = [
            "ryu-manager",
            "osken-manager",
            "controller/ryu_controller.py",
            "simple_switch_13_osken.py",
        ]

        for pattern in patterns:
            result = subprocess.run(
                ["pgrep", "-f", pattern],
                capture_output=True,
                text=True
            )
            if result.returncode == 0 and result.stdout.strip():
                return True

        return False

    def set_recovery_status(self, status: str):
        self._recovery_status = status

    def get_controller_status(self):
        return "online" if self._is_controller_running() else "offline"

    def get_discovered_topology(self):
        return []

    def get_recovery_status(self):
        return self._recovery_status

    def get_load_balancing_status(self):
        return False

    def get_predictive_status(self):
        return False
