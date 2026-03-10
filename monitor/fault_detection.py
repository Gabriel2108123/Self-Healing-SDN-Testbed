import time
import os

LOG_FILE = "docs/network_events.log"
STATE_FILE = "docs/monitor_state.log"

FAILURE_KEYWORDS = [
    "Potential link failure or recovery detected",
    "reason DELETE",
    "Unregister switch"
]

HEALTHY_KEYWORDS = [
    "Connectivity check passed between h1 and h2",
    "Automatic connectivity check passed between h1 and h2",
    "PacketIn on switch",
    "Switch connected",
    "Register switch"
]


def write_state(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(STATE_FILE, "a") as f:
        f.write(f"[{timestamp}] {message}\n")


def monitor_log():
    if not os.path.exists(LOG_FILE):
        write_state("ERROR: network_events.log does not exist")
        return

    write_state("Monitor started: watching network event log for failures")

    with open(LOG_FILE, "r") as f:
        f.seek(0, os.SEEK_END)

        while True:
            line = f.readline()

            if not line:
                time.sleep(1)
                continue

            line = line.strip()

            if any(keyword in line for keyword in FAILURE_KEYWORDS):
                write_state(f"ALERT: failure-related event detected -> {line}")
                write_state("Triggering recovery mechanism")

            elif any(keyword in line for keyword in HEALTHY_KEYWORDS):
                write_state(f"INFO: healthy event detected -> {line}")


if __name__ == "__main__":
    monitor_log()
