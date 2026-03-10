import subprocess
from datetime import datetime

LOG_FILE = "docs/network_events.log"


def write_log(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def run_command(cmd: str) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)


def get_latest_host_pid(host_name: str) -> str | None:
    """
    Get the newest PID for a running Mininet host, e.g. mininet:h1.
    """
    cmd = f"pgrep -n -f 'mininet:{host_name}'"
    result = run_command(cmd)
    pid = result.stdout.strip()
    return pid if pid else None


def ping_from_h1_to_h2() -> tuple[bool, str]:
    """
    Run ping inside the currently running h1 namespace.
    Returns (success, output).
    """
    h1_pid = get_latest_host_pid("h1")

    if not h1_pid:
        return False, "ERROR: Could not find a running Mininet host process for h1."

    cmd = f"sudo mnexec -a {h1_pid} ping -c 1 -W 1 10.0.0.2"
    result = run_command(cmd)

    success = (result.returncode == 0)
    output = f"Using h1 PID: {h1_pid}\n{result.stdout}{result.stderr}"
    return success, output


if __name__ == "__main__":
    success, output = ping_from_h1_to_h2()

    if success:
        write_log("Automatic connectivity check passed between h1 and h2")
        print("Connectivity OK")
    else:
        write_log("Automatic connectivity failure detected between h1 and h2")
        print("Connectivity FAILED")

    print(output)
