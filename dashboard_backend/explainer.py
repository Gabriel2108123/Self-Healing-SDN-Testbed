"""
explainer.py
------------
Rule-based explainability module for the SDN controller.

Translates technical log lines into plain-English explanations that are
suitable for a final-year project report and viva presentation.

Rules:
  "Link deleted" or "LINK_FAILURE" → failure explanation
  "Installing active path" with [1,3,2] → reroute via backup
  "Installing active path" with [1,2]   → path restored
  "Link added" + any recovery keyword   → restoration note
"""

import re
from log_parser import _parse_timestamp, _classify_event

# ----- Rule patterns ----------------------------------------------------------

# Failure
FAILURE_PATTERNS = [
    re.compile(r"Link deleted:\s*(\S+)\s*->\s*(\S+)", re.IGNORECASE),
    re.compile(r"LINK_FAILURE[:\s]+(\S+)", re.IGNORECASE),
    re.compile(r"port.*down", re.IGNORECASE),
]

# Reroute / failover
REROUTE_PATTERNS = [
    re.compile(r"Installing active path[:\s]+\[1[,\s]*3[,\s]*2\]", re.IGNORECASE),
    re.compile(r"REROUTE.*\[1.*3.*2\]", re.IGNORECASE),
    re.compile(r"failover.*path", re.IGNORECASE),
]

# Recovery
RECOVERY_PATTERNS = [
    re.compile(r"Link added[:\s]+(\S+)\s*->\s*(\S+)", re.IGNORECASE),
    re.compile(r"Installing active path[:\s]+\[1[,\s]*2\]", re.IGNORECASE),
    re.compile(r"RECOVERY.*path.*\[1.*2\]", re.IGNORECASE),
    re.compile(r"port.*up", re.IGNORECASE),
]

# Info / controller start
INFO_PATTERNS = [
    re.compile(r"(Controller|Ryu|ryu-manager)\s+start", re.IGNORECASE),
    re.compile(r"Topology\s+discover", re.IGNORECASE),
]

# Link name extractor
LINK_RE = re.compile(r"([a-zA-Z][a-zA-Z0-9]*)[:\-]port(\d+)\s*->\s*([a-zA-Z][a-zA-Z0-9]*)[:\-]port(\d+)")
SIMPLE_LINK_RE = re.compile(r"(s\d+)[\-:](s\d+|h\d+)", re.IGNORECASE)


def _extract_link(line: str) -> str:
    """Try to extract a human-readable link name like 's1-s2' from a log line."""
    m = LINK_RE.search(line)
    if m:
        return f"{m.group(1)}-{m.group(3)}"
    m = SIMPLE_LINK_RE.search(line)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return "unknown link"


# ----- Explanation templates --------------------------------------------------

def _explain_failure(line: str) -> dict:
    link = _extract_link(line)
    return {
        "type":  "failure",
        "title": f"Failure detected on {link}",
        "explanation": (
            f"The OpenFlow controller received a port-status DOWN message on the "
            f"link {link}. All existing flow rules that used this link were "
            f"immediately removed, and the controller began calculating an "
            f"alternative path to maintain end-to-end connectivity."
        ),
    }


def _explain_reroute(line: str) -> dict:
    return {
        "type":  "reroute",
        "title": "Traffic rerouted via backup path (s1→s3→s2)",
        "explanation": (
            "After detecting the primary link failure, the Ryu controller ran a "
            "shortest-path calculation on the remaining topology and selected the "
            "backup route through switch s3. New flow rules were installed on s1, "
            "s3 and s2 so that all traffic between h1 and h2 is forwarded "
            "via the backup path s1→s3→s2. Connectivity is maintained."
        ),
    }


def _explain_recovery(line: str) -> dict:
    link = _extract_link(line)
    return {
        "type":  "recovery",
        "title": "Primary path restored",
        "explanation": (
            f"The link {link} came back up. The controller received a port-status UP "
            f"message, confirmed reachability, and reinstalled the optimal shortest-path "
            f"flow rules along s1→s2. Traffic has been switched back to the primary "
            f"route. The backup path through s3 is now idle."
        ),
    }


def _explain_info(line: str) -> dict:
    return {
        "type":  "info",
        "title": "Controller event",
        "explanation": (
            "The Ryu SDN controller processed a topology or lifecycle event. "
            "This is informational — no rerouting was required."
        ),
    }


# ----- Main API ---------------------------------------------------------------

def explain_events(events: list[dict]) -> list[dict]:
    """
    Given the parsed event list from log_parser, return a list of explanation dicts.
    Each dict: { timestamp, type, title, explanation }
    Only events that match a meaningful rule are included.
    """
    explanations = []

    for ev in events:
        line = ev.get("message", "")
        ts   = ev.get("timestamp", "")

        result = None

        # Check reroute before recovery (reroute lines often also contain path info)
        if any(p.search(line) for p in REROUTE_PATTERNS):
            result = _explain_reroute(line)
        elif any(p.search(line) for p in RECOVERY_PATTERNS):
            result = _explain_recovery(line)
        elif any(p.search(line) for p in FAILURE_PATTERNS):
            result = _explain_failure(line)
        elif any(p.search(line) for p in INFO_PATTERNS):
            result = _explain_info(line)

        if result:
            result["timestamp"] = ts
            explanations.append(result)

    return explanations
