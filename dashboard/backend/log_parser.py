"""
log_parser.py
-------------
Utilities for parsing SDN log files produced by the Ryu controller monitor.

Expects two log files:
  - network_events.log  -- one event per line, timestamped
  - monitor_state.log   -- periodic snapshots of link/flow state
"""

import os
import re
from datetime import datetime

# ---------------------------------------------------------------------------
# network_events.log helpers
# ---------------------------------------------------------------------------

# Example log line formats we expect:
#   2024-01-01 12:00:00 LINK_FAILURE s1-s2 detected
#   2024-01-01 12:00:05 RECOVERY path=[1,3,2] restored
#   2024-01-01 12:00:01 REROUTE active_path=[1,3,2]
TIMESTAMP_RE = re.compile(r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})")
FAILURE_KW   = ["LINK_FAILURE", "link_failure", "failure", "FAILURE", "link down", "DOWN"]
RECOVERY_KW  = ["RECOVERY", "recovery", "RESTORE", "restored", "link up", "UP"]
REROUTE_KW   = ["REROUTE", "reroute", "failover", "FAILOVER"]
PATH_RE      = re.compile(r"\[[\d,\s]+\]")


def _parse_timestamp(line: str) -> str:
    """Extract ISO timestamp string from a log line, or return empty string."""
    m = TIMESTAMP_RE.search(line)
    return m.group(1) if m else ""


def _classify_event(line: str) -> str:
    """Return 'failure', 'recovery', 'reroute', or 'info'."""
    # Check reroute BEFORE recovery — reroute lines often contain both keywords
    for kw in REROUTE_KW:
        if kw in line:
            return "reroute"
    for kw in FAILURE_KW:
        if kw in line:
            return "failure"
    for kw in RECOVERY_KW:
        if kw in line:
            return "recovery"
    return "info"


def parse_events_log(path: str, max_lines: int = 200) -> list[dict]:
    """
    Parse network_events.log and return a list of event dicts (newest first).

    Each dict has:
      timestamp (str), type (str), message (str), raw (str)
    """
    events = []
    if not os.path.exists(path):
        return events

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    # Take the last max_lines lines so we don't process huge files
    for line in lines[-max_lines:]:
        line = line.rstrip()
        if not line:
            continue
        events.append({
            "timestamp": _parse_timestamp(line),
            "type":      _classify_event(line),
            "message":   line,
            "raw":       line,
        })

    events.reverse()   # newest first
    return events


# ---------------------------------------------------------------------------
# monitor_state.log helpers
# ---------------------------------------------------------------------------

def parse_monitor_log(path: str, max_lines: int = 100) -> list[dict]:
    """
    Parse monitor_state.log and return a list of state snapshot dicts.

    Expected format (flexible — we grab all key=value pairs):
      2024-01-01 12:00:00 link=s1-s2 state=DOWN dpid=1
    """
    snapshots = []
    if not os.path.exists(path):
        return snapshots

    kv_re = re.compile(r"(\w+)=([^\s]+)")

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    for line in lines[-max_lines:]:
        line = line.rstrip()
        if not line:
            continue
        entry = {
            "timestamp": _parse_timestamp(line),
            "raw":       line,
        }
        # Absorb any key=value pairs found in the line
        for key, val in kv_re.findall(line):
            entry[key] = val
        snapshots.append(entry)

    snapshots.reverse()
    return snapshots


# ---------------------------------------------------------------------------
# Active path detection
# ---------------------------------------------------------------------------

def detect_active_path(events: list[dict]) -> list[int]:
    """
    Scan events (newest first) to determine the current active path.

    Returns [1, 3, 2] if the most recent relevant event indicates failover,
    otherwise returns [1, 2] (normal path).
    """
    for ev in events:
        msg = ev.get("message", "")
        # Explicit path annotation takes priority
        m = PATH_RE.search(msg)
        if m:
            try:
                path = [int(x.strip()) for x in m.group().strip("[]").split(",")]
                return path
            except ValueError:
                pass
        # Keyword-based fallback
        if ev["type"] == "failure":
            return [1, 3, 2]   # failover path
        if ev["type"] == "recovery":
            return [1, 2]      # normal path restored
    return [1, 2]              # default: normal path


# ---------------------------------------------------------------------------
# Event counters
# ---------------------------------------------------------------------------

def count_events(events: list[dict], kind: str) -> int:
    """Count how many events of the given type exist in the list."""
    return sum(1 for e in events if e.get("type") == kind)


# ---------------------------------------------------------------------------
# Link state extraction from monitor log
# ---------------------------------------------------------------------------

def extract_link_states(snapshots: list[dict]) -> list[dict]:
    """
    Build a deduplicated list of link states from monitor snapshots.
    Returns the latest known state per link.
    """
    seen: dict[str, dict] = {}
    for snap in snapshots:
        link = snap.get("link") or snap.get("port") or snap.get("interface")
        state = snap.get("state") or snap.get("status")
        if link and state:
            # snapshots are newest-first, so first occurrence wins
            if link not in seen:
                seen[link] = {
                    "link":      link,
                    "state":     state.upper(),
                    "timestamp": snap.get("timestamp", ""),
                }
    return list(seen.values())


# ---------------------------------------------------------------------------
# Controller status
# ---------------------------------------------------------------------------

def detect_controller_status(events: list[dict]) -> str:
    """
    Return 'active', 'degraded', or 'unknown' based on recent events.
    """
    if not events:
        return "unknown"
    # If the very latest event is a failure and there's been no recovery, degraded
    for ev in events:
        if ev["type"] in ("failure",):
            return "degraded"
        if ev["type"] in ("recovery", "reroute", "info"):
            return "active"
    return "unknown"


# ---------------------------------------------------------------------------
# Link state derivation from network_events.log (for live mode)
# ---------------------------------------------------------------------------

# Matches both "Link added: ..." and "Observed link add: ..."
_OBS_ADD_LINK_RE = re.compile(
    r"(?:Observed\s+link\s+add|Link\s+added)[:\s]+s(\d+)[:\-]port(\d+)\s*[-\->]+\s*s(\d+)[:\-]port(\d+)",
    re.IGNORECASE,
)
# Matches both "Link deleted: ..." and "Observed link delete: ..."
_OBS_DEL_LINK_RE = re.compile(
    r"(?:Observed\s+link\s+delete|Link\s+deleted)[:\s]+s(\d+)[:\-]port(\d+)\s*[-\->]+\s*s(\d+)[:\-]port(\d+)",
    re.IGNORECASE,
)


def _normalize_switch_link(s1: str, p1: str, s2: str, p2: str):
    """
    Canonicalise a directional switch-switch link into one stable key.
    Both (s1,p2,s2,p2) and (s2,p2,s1,p2) map to the same key so that
    duplicate log lines in opposite directions don't create two entries.

    Returns: (key, source, target)
    """
    left  = (int(s1), int(p1))
    right = (int(s2), int(p2))
    if left <= right:
        source, target = f"s{s1}", f"s{s2}"
        key = f"{source}:p{p1}-{target}:p{p2}"
    else:
        source, target = f"s{s2}", f"s{s1}"
        key = f"{source}:p{p2}-{target}:p{p1}"
    return key, source, target


def build_link_states_from_events(path: str) -> list[dict]:
    """
    Derive latest link states from network_events.log.

    Handles all four log formats:
      - Link added: s1:port2 -> s2:port2
      - Link deleted: s1:port2 -> s2:port2
      - Observed link add: s1:port2 -> s2:port2
      - Observed link delete: s1:port2 -> s2:port2

    Normalizes both directions of the same physical link into one entry,
    so the last state seen (oldest→newest scan) is the definitive state.
    """
    if not os.path.exists(path):
        return []

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    links: dict[str, dict] = {}

    for raw_line in lines:
        line = raw_line.rstrip()
        if not line:
            continue

        ts = _parse_timestamp(line)

        m = _OBS_ADD_LINK_RE.search(line)
        if m:
            s1, p1, s2, p2 = m.groups()
            key, source, target = _normalize_switch_link(s1, p1, s2, p2)
            links[key] = {
                "link":      key,
                "state":     "UP",
                "source":    source,
                "target":    target,
                "timestamp": ts,
            }
            continue

        m = _OBS_DEL_LINK_RE.search(line)
        if m:
            s1, p1, s2, p2 = m.groups()
            key, source, target = _normalize_switch_link(s1, p1, s2, p2)
            links[key] = {
                "link":      key,
                "state":     "DOWN",
                "source":    source,
                "target":    target,
                "timestamp": ts,
            }
            continue

    return list(links.values())


# ---------------------------------------------------------------------------
# Raw-line metric counting (supplements classified-event counting)
# ---------------------------------------------------------------------------

def count_metrics_from_lines(path: str) -> tuple[int, int, int]:
    """
    Count failures, recoveries, and reroutes directly from raw log lines.
    Covers both the short 'Link added/deleted' and the Ryu controller's
    'Observed link add/delete' format.

    Returns: (failures, recoveries, reroutes)
    """
    if not os.path.exists(path):
        return 0, 0, 0

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    failures   = 0
    recoveries = 0
    reroutes   = 0

    for line in lines:
        lower = line.lower()

        if (
            "link deleted"          in lower or
            "observed link delete"  in lower or
            "link_failure"          in lower or
            "link down"             in lower
        ):
            failures += 1

        if (
            "link added"            in lower or
            "observed link add"     in lower or
            "restored"              in lower or
            "link up"               in lower
        ):
            recoveries += 1

        if (
            "reroute"               in lower or
            "backup path"           in lower or
            "failover"              in lower or
            "installing active path" in lower
        ):
            reroutes += 1

    return failures, recoveries, reroutes



LINK_RE = re.compile(r"([a-zA-Z][a-zA-Z0-9]*)[:\-]([a-zA-Z][a-zA-Z0-9]*)")

def _extract_link(msg: str) -> str | None:
    """Try to extract a simple 'sX-sY' style link name from a log line."""
    m = LINK_RE.search(msg)
    return f"{m.group(1)}-{m.group(2)}" if m else None


def build_timeline(events: list[dict]) -> list[dict]:
    """
    Return a filtered, time-ordered list of timeline entries.
    Only includes failure, reroute, and recovery events.
    Each entry: { timestamp, type, link?, path? }
    """
    timeline = []
    for ev in reversed(events):  # chronological order (oldest first)
        if ev["type"] not in ("failure", "recovery", "reroute"):
            continue
        entry: dict = {
            "timestamp": ev["timestamp"],
            "type":      ev["type"],
        }
        msg = ev.get("message", "")
        # Add path for reroute events
        m = PATH_RE.search(msg)
        if m and ev["type"] == "reroute":
            try:
                nums = [int(x.strip()) for x in m.group().strip("[]").split(",")]
                sw = {1: "s1", 2: "s2", 3: "s3"}
                entry["path"] = [sw.get(n, str(n)) for n in nums]
            except ValueError:
                pass
        # Add link for failure/recovery events
        if ev["type"] in ("failure", "recovery"):
            link = _extract_link(msg)
            if link:
                entry["link"] = link
        timeline.append(entry)
    return timeline


# ---------------------------------------------------------------------------
# Phase 5: Recovery performance computation
# ---------------------------------------------------------------------------

def _parse_dt(ts: str):
    """Parse a timestamp string to datetime, return None on failure."""
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            from datetime import datetime as dt
            return dt.strptime(ts, fmt)
        except (ValueError, TypeError):
            pass
    return None


def compute_recovery_stats(events: list[dict]) -> dict:
    """
    Pair each failure event with the next recovery event to compute
    recovery durations and aggregate statistics.

    Returns:
      {
        failuresDetected, recoveriesCompleted,
        averageRecoveryTime, lastRecoveryTime,
        availability,
        recoveryTimes: [float],
        recoveryEvents: [{timestamp, duration}]
      }
    """
    # Work in chronological order
    chron = list(reversed(events))

    recovery_times  = []   # durations in seconds
    recovery_events = []   # [{timestamp, duration}]
    total_monitoring_seconds = 0
    total_downtime_seconds   = 0

    # Find timestamps of first and last event for availability calc
    ts_list = [_parse_dt(e["timestamp"]) for e in chron if e["timestamp"]]
    ts_list = [t for t in ts_list if t]
    if len(ts_list) >= 2:
        total_monitoring_seconds = (ts_list[-1] - ts_list[0]).total_seconds()

    i = 0
    while i < len(chron):
        ev = chron[i]
        if ev["type"] == "failure":
            failure_dt = _parse_dt(ev["timestamp"])
            # Look for next recovery
            for j in range(i + 1, len(chron)):
                nev = chron[j]
                if nev["type"] == "recovery":
                    recovery_dt = _parse_dt(nev["timestamp"])
                    if failure_dt and recovery_dt:
                        dur = (recovery_dt - failure_dt).total_seconds()
                        dur = max(0.0, dur)
                        recovery_times.append(dur)
                        recovery_events.append({
                            "timestamp": nev["timestamp"],
                            "duration":  round(dur, 3),
                        })
                        total_downtime_seconds += dur
                    i = j  # skip past this recovery
                    break
        i += 1

    avg = sum(recovery_times) / len(recovery_times) if recovery_times else 0.0
    last = recovery_times[-1] if recovery_times else 0.0

    if total_monitoring_seconds > 0:
        availability = max(0.0, (1 - total_downtime_seconds / total_monitoring_seconds) * 100)
    else:
        availability = 100.0

    return {
        "failuresDetected":    count_events(events, "failure"),
        "recoveriesCompleted": count_events(events, "recovery"),
        "averageRecoveryTime": round(avg, 3),
        "lastRecoveryTime":    round(last, 3),
        "availability":        round(availability, 2),
        "recoveryTimes":       [round(t, 3) for t in recovery_times],
        "recoveryEvents":      recovery_events,
    }
