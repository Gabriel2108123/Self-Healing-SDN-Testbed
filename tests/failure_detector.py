import subprocess
from datetime import datetime


LOG_FILE = "docs/network_events.log"


def write_log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def ping_host(source, target_ip):
    cmd = ["sudo", "mnexec", "-a", source, "ping", "-c", "1", target_ip]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout + result.stderr


if __name__ == "__main__":
    write_log("Failure detector script created and ready for testing")
    print("failure_detector.py created successfully")
