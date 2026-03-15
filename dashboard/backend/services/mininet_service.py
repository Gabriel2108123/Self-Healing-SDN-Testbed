import logging
import os
import shlex
import subprocess
import threading
import time
from pathlib import Path


logger = logging.getLogger(__name__)


class MininetService:
    """
    Phase 2 real Mininet launcher.

    This service:
    - launches Mininet topologies through sudo/python3
    - keeps track of the running process
    - exposes helpers for ring/star/mesh/linear topologies
    - performs cleanup before and after runs
    - can stop the topology safely

    Assumption:
    You have (or will create) executable topology scripts under:
        ~/projects/sdn-self-healing-project/topology/

    Example expected files:
        ring_topology.py
        star_topology.py
        mesh_topology.py
        linear_topology.py

    Each topology script should:
    - start Mininet
    - keep running until interrupted
    - clean up on exit
    """

    def __init__(self):
        self.process = None
        self.current_topology = None
        self.current_script = None
        self.lock = threading.Lock()

        self.project_root = Path.home() / "projects" / "sdn-self-healing-project"
        self.topology_dir = self.project_root / "topology"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

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
        """
        Force cleanup stale Mininet state.
        """
        logger.info("Cleaning up stale Mininet state")

        commands = [
            "sudo mn -c",
            "sudo pkill -f mininet",
            "sudo pkill -f ovs-controller",
            "sudo pkill -f ofdatapath",
            "sudo pkill -f ryu-manager",
        ]

        for cmd in commands:
            try:
                self._run_shell_command(cmd, timeout=15)
            except Exception as exc:
                logger.warning("Cleanup command failed [%s]: %s", cmd, exc)

    def _build_command(self, script_name: str, **kwargs) -> str:
        """
        Build a safe command like:
        sudo -E python3 /path/to/script.py --switches 3 --hosts-per-switch 2
        """
        script_path = self.topology_dir / script_name
        if not script_path.exists():
            raise FileNotFoundError(f"Topology script not found: {script_path}")

        args = ["sudo", "-E", "python3", str(script_path)]

        for key, value in kwargs.items():
            if value is None:
                continue
            cli_key = f"--{key.replace('_', '-')}"
            args.append(cli_key)
            args.append(str(value))

        return shlex.join(args)

    def _launch_topology(self, script_name: str, topology_name: str, **kwargs):
        with self.lock:
            if self._is_running():
                return False, f"A topology is already running: {self.current_topology}"

            try:
                self._cleanup_mininet()

                command = self._build_command(script_name, **kwargs)
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
                self.current_script = script_name

                # Give the process a moment to fail fast if there is a syntax/runtime issue
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

    # ------------------------------------------------------------------
    # Public topology launchers
    # ------------------------------------------------------------------

    def create_ring_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology(
            script_name="ring_topology.py",
            topology_name="ring",
            switches=switch_count,
            hosts_per_switch=hosts_per_switch
        )

    def create_star_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology(
            script_name="star_topology.py",
            topology_name="star",
            switches=switch_count,
            hosts_per_switch=hosts_per_switch
        )

    def create_mesh_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology(
            script_name="mesh_topology.py",
            topology_name="mesh",
            switches=switch_count,
            hosts_per_switch=hosts_per_switch
        )

    def create_linear_topology(self, switch_count: int, hosts_per_switch: int = 1):
        return self._launch_topology(
            script_name="linear_topology.py",
            topology_name="linear",
            switches=switch_count,
            hosts_per_switch=hosts_per_switch
        )

    # ------------------------------------------------------------------
    # Status / stop / logs
    # ------------------------------------------------------------------

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
        """
        Best-effort read of currently buffered stdout/stderr.
        Useful for debugging launch issues.
        """
        if not self.process:
            return {
                "stdout": [],
                "stderr": []
            }

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
