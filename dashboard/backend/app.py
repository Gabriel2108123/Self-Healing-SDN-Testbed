"""
app.py  (Phase 3–6 update)
--------------------------
Flask-SocketIO backend for the Self-Healing SDN Testbed dashboard.

Includes all REST endpoints plus WebSocket support:
  - Background thread watches network_events.log for changes
  - Emits dashboard_update, topology_update, event_update on new log lines

New endpoints vs Phase 1:
  GET /api/timeline        -- ordered failure/reroute/recovery list
  GET /api/recovery-stats  -- computed recovery metrics
  GET /api/explanations    -- plain-English controller decisions

Run on Ubuntu:
  pip install flask flask-cors flask-socketio eventlet
  python app.py
"""

import os
import time
import threading
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from log_parser import (
    parse_events_log,
    parse_monitor_log,
    detect_active_path,
    detect_controller_status,
    count_events,
    extract_link_states,
    build_link_states_from_events,
    count_metrics_from_lines,
    compute_recovery_stats,
    build_timeline,
)
from explainer import explain_events

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sdn-dashboard-secret'
CORS(app, resources={r"/api/*": {"origins": "*"}})

# SocketIO with eventlet for async support
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    logger=False,
    engineio_logger=False,
)

DOCS_DIR    = os.environ.get(
    "SDN_DOCS_DIR",
    os.path.join(os.path.dirname(__file__), "..", "..", "docs"),
)
EVENTS_LOG  = os.path.join(DOCS_DIR, "network_events.log")
MONITOR_LOG = os.path.join(DOCS_DIR, "monitor_state.log")

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _load_all():
    events    = parse_events_log(EVENTS_LOG)
    snapshots = parse_monitor_log(MONITOR_LOG)
    return events, snapshots


def _build_dashboard(events, snapshots):
    active_path       = detect_active_path(events)
    controller_status = detect_controller_status(events)

    # Merge link states from monitor log + events log for best coverage
    monitor_link_states = extract_link_states(snapshots)
    events_link_states  = build_link_states_from_events(EVENTS_LOG)
    # Build a deduplicated map; events log result takes precedence (more granular)
    link_map = {ls["link"]: ls for ls in monitor_link_states}
    for ls in events_link_states:
        link_map[ls["link"]] = ls
    link_states = list(link_map.values())

    any_down     = any(ls["state"] == "DOWN" for ls in link_states)
    connectivity = "degraded" if any_down else "connected"

    # Use raw-line counts for better accuracy on live logs
    raw_fail, raw_rec, raw_reroute = count_metrics_from_lines(EVENTS_LOG)
    failures   = raw_fail   or count_events(events, "failure")
    recoveries = raw_rec    or count_events(events, "recovery")
    reroutes   = raw_reroute or count_events(events, "reroute")

    path_is_failover = (active_path == [1, 3, 2])
    path_label       = "Failover  [1→ 3→ 2]" if path_is_failover else "Normal  [1→ 2]"
    return {
        "controller_status": controller_status,
        "connectivity":      connectivity,
        "active_path":       active_path,
        "path_label":        path_label,
        "path_is_failover":  path_is_failover,
        "failures":          failures,
        "recoveries":        recoveries,
        "reroutes":          reroutes,
        "link_states":       link_states,
        "recent_events":     events[:10],
        "total_events":      len(events),
    }


def _build_topology(events, snapshots):
    active_path  = detect_active_path(events)
    link_states  = extract_link_states(snapshots)
    down_set     = {ls["link"] for ls in link_states if ls["state"] == "DOWN"}

    switch_map = {1: "s1", 2: "s2", 3: "s3"}
    str_path   = [switch_map.get(n, str(n)) for n in active_path]

    raw_links = [
        {"source": "h1", "target": "s1", "kind": "host"},
        {"source": "s1", "target": "s2", "kind": "primary"},
        {"source": "s1", "target": "s3", "kind": "backup"},
        {"source": "s3", "target": "s2", "kind": "backup"},
        {"source": "s2", "target": "h2", "kind": "host"},
    ]
    links = []
    for lk in raw_links:
        lid  = f"{lk['source']}-{lk['target']}"
        lidr = f"{lk['target']}-{lk['source']}"
        is_down = lid in down_set or lidr in down_set
        links.append({**lk, "status": "down" if is_down else "up"})

    return {
        "nodes": [
            {"id": "h1", "type": "host"},
            {"id": "s1", "type": "switch"},
            {"id": "s2", "type": "switch"},
            {"id": "s3", "type": "switch"},
            {"id": "h2", "type": "host"},
        ],
        "links":        links,
        "activePath":   ["h1"] + str_path + ["h2"],
        "normal_path":   [1, 2],
        "failover_path": [1, 3, 2],
    }

# ---------------------------------------------------------------------------
# REST Routes
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "sdn-dashboard-backend"})


@app.route("/api/events", methods=["GET"])
def events_route():
    ev, _ = _load_all()
    return jsonify({"count": len(ev), "events": ev[:50]})


@app.route("/api/monitor", methods=["GET"])
def monitor():
    _, snaps = _load_all()
    return jsonify({"count": len(snaps), "snapshots": snaps[:50]})


@app.route("/api/status", methods=["GET"])
def status():
    ev, snaps = _load_all()
    active_path       = detect_active_path(ev)
    controller_status = detect_controller_status(ev)
    link_states       = extract_link_states(snaps)
    any_down          = any(ls["state"] == "DOWN" for ls in link_states)
    connectivity      = "degraded" if any_down else "connected"
    return jsonify({
        "controller_status": controller_status,
        "connectivity":      connectivity,
        "active_path":       active_path,
        "link_states":       link_states,
    })


@app.route("/api/topology", methods=["GET"])
def topology():
    ev, snaps = _load_all()
    return jsonify(_build_topology(ev, snaps))


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    ev, snaps = _load_all()
    return jsonify(_build_dashboard(ev, snaps))


@app.route("/api/timeline", methods=["GET"])
def timeline():
    """Return ordered list of failure/reroute/recovery events for the timeline view."""
    ev, _ = _load_all()
    tl = build_timeline(ev)
    return jsonify(tl)


@app.route("/api/recovery-stats", methods=["GET"])
def recovery_stats():
    """Return computed recovery performance statistics."""
    ev, _ = _load_all()
    stats = compute_recovery_stats(ev)
    return jsonify(stats)


@app.route("/api/explanations", methods=["GET"])
def explanations():
    """Return plain-English explanations for each controller decision."""
    ev, _ = _load_all()
    exps = explain_events(ev)
    return jsonify(exps)

# ---------------------------------------------------------------------------
# Phase 3: WebSocket — background log watcher
# ---------------------------------------------------------------------------

_last_log_size = 0

def _watch_logs():
    """
    Background thread: polls the events log file every second.
    When new content appears, emit socket events to all connected clients.
    """
    global _last_log_size
    print("[SocketIO] Log watcher started")
    while True:
        try:
            if os.path.exists(EVENTS_LOG):
                size = os.path.getsize(EVENTS_LOG)
                if size != _last_log_size:
                    _last_log_size = size
                    ev, snaps = _load_all()

                    # Emit all update events
                    socketio.emit("dashboard_update", _build_dashboard(ev, snaps))
                    socketio.emit("topology_update",  _build_topology(ev, snaps))
                    socketio.emit("event_update",     {"events": ev[:10], "count": len(ev)})
                    print(f"[SocketIO] Emitted update (log size={size})")
        except Exception as e:
            print(f"[SocketIO] Watcher error: {e}")
        time.sleep(1)


@socketio.on("connect")
def handle_connect():
    print(f"[SocketIO] Client connected: {socketio}")
    # Send current state immediately on connection
    ev, snaps = _load_all()
    emit("dashboard_update", _build_dashboard(ev, snaps))
    emit("topology_update",  _build_topology(ev, snaps))


@socketio.on("disconnect")
def handle_disconnect():
    print("[SocketIO] Client disconnected")

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"[SDN Dashboard Backend] Reading logs from: {os.path.abspath(DOCS_DIR)}")
    print("[SDN Dashboard Backend] Starting Flask-SocketIO on http://0.0.0.0:5000")

    # Start log watcher in background thread
    watcher = threading.Thread(target=_watch_logs, daemon=True)
    watcher.start()

    # Run with eventlet for async WebSocket support
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
