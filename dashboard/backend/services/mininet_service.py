import logging
import shlex
import subprocess
import threading
import time
from pathlib import Path

logger = logging.getLogger(__name__)


class MininetService:
    def __init__(self):
        self.process = None
        self.current_topology = None
        self.current_script = None
        self.lock = threading.Lock()

        self.project_root = Path.home() / "projects" / "sdn-self-healing-project"
        self.topology_dir = self.project_root / "topology"
        self.shared_topology_script = self.topology_dir / "network_topology.py"

    def _is_running(self) -> bool:
        return self.process is not None and self.process.poll() is None

    def _run_shell_command(self, command: str, timeout: int = 30):
        logger.info("Running shell command: %s", command)
        completed = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return completed.returncode, completed.stdout.strip(), completed.stderr.strip()

    def _cleanup_mininet(self):
        logger.info("Cleaning up stale Mininet state")

        commands = [
            "sudo mn -c",
            "sudo pkill -f mininet",
            "sudo pkill -f ovs-controller",
            "sudo pkill -f ofdatapath",
            "sudo pkill -f ryu-manager",
            "sudo pkill -f osken-manager",
            "sudo pkill -f network_topology.py",
        ]

        for cmd in commands:
            try:
                self._run_shell_command(cmd, timeout=15)
            except Exception as exc:
                logger.warning("Cleanup command failed [%s]: %s", cmd, exc)

    def _build_command(self, topology_name: str, switch_count: int, hosts_per_switch: int) -> str:
        if not self.shared_topology_script.exists():
            raise FileNotFoundError(f"Topology script not found: {self.shared_topology_script}")

        args = [
            "sudo",
            "-E",
            "python3",
            str(self.shared_topology_script),
            str(topology_name),
            str(switch_count),
            str(hosts_per_switch),
        ]
        return shlex.join(args)

    def _launch_topology(self, topology_name: str, switch_count: int, hosts_per_switch: int):
        with self.lock:
            if self._is_running():
                return False, f"A topology is already running: {self.current_topology}"

            try:
                self._cleanup_mininet()

                command = self._build_command(topology_name, switch_count, hosts_per_switch)
                logger.info("Launching topology [%s] with command: %s", topology_name, command)

                self.process = subprocess.Popen(
                    command,
                    shell=True,
                    cwd=str(self.project_root),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1
                )

                self.current_topology = topology_name
                self.current_script = "network_topology.py"

                time.sleep(3)

                if self.process.poll() is not None:
                    stdout, stderr = self.process.communicate(timeout=5)
                    self.process = None
                    self.current_topology = None
                    self.current_script = None

                    error_text = stderr.strip() or stdout.strip() or "Unknown launch error"
                    logger.error("Failed to launch topology [%s]: %s", topology_name, error_text)
                    return False, error_text

                logger.info("Topology [%s] launched successfully", topology_name)
                return True, f"{topology_name} topology launched successfully"

            except Exception as exc:
                logger.exception("Error launching topology [%s]", topology_name)
                self.process = None
                self.current_topology = None
                self.current_script = None
                return False, str(exc)

    def create_ring_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology("ring", switch_count, hosts_per_switch)

    def create_star_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology("star", switch_count, hosts_per_switch)

    def create_mesh_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology("mesh", switch_count, hosts_per_switch)

    def create_linear_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology("linear", switch_count, hosts_per_switch)

    def stop_topology(self):
        with self.lock:
            if not self._is_running():
                self._cleanup_mininet()
                self.current_topology = None
                self.current_script = None
                return True, "No running topology found. Cleanup completed."

            try:
                logger.info("Stopping topology [%s]", self.current_topology)

                self.process.terminate()

                try:
                    self.process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    logger.warning("Topology did not terminate in time, killing it")
                    self.process.kill()
                    self.process.wait(timeout=5)

                self._cleanup_mininet()

                stopped_name = self.current_topology
                self.process = None
                self.current_topology = None
                self.current_script = None

                return True, f"{stopped_name} topology stopped successfully"

            except Exception as exc:
                logger.exception("Error stopping topology")
                return False, str(exc)

    def get_status(self):
        return {
            "running": self._is_running(),
            "topology": self.current_topology,
            "script": self.current_script,
            "pid": self.process.pid if self._is_running() else None
        }

    def get_process_output(self, max_lines: int = 50):
        if not self.process:
            return {"stdout": [], "stderr": []}

        stdout_lines = []
        stderr_lines = []

        try:
            if self.process.stdout:
                while True:
                    line = self.process.stdout.readline()
                    if not line:
                        break
                    stdout_lines.append(line.rstrip())
                    if len(stdout_lines) >= max_lines:
                        break
        except Exception:
            pass

        try:
            if self.process.stderr:
                while True:
                    line = self.process.stderr.readline()
                    if not line:
                        break
                    stderr_lines.append(line.rstrip())
                    if len(stderr_lines) >= max_lines:
                        break
        except Exception:
            pass

        return {
            "stdout": stdout_lines,
            "stderr": stderr_lines
        }