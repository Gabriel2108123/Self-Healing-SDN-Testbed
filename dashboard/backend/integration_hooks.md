# Phase 2: Open Source Controller Integration Hooks

This document highlights where the mock behaviour implemented in Phase 1 should be replaced with real SDN controller (e.g., Ryu, ONOS) and Mininet integration in later phases.

## 1. Mininet Topology Orchestration
**Location**: `backend/services/mininet_service.py`

Replace the mock `launch_ring_topology`, `launch_mesh_topology`, `stop_topology` and `reset_topology` methods.
- Call python subprocesses or Mininet APIs to actually spawn `mn` instances.
- Build the specific Python Topo classes and pass the configured `switch_count` and `hosts_per_switch`.

## 2. Controller Telemetry & Status
**Location**: `backend/services/controller_service.py`

Replace the hardcoded offline/stable states.
- `get_controller_status()`: Poll the Ryu REST API (e.g., `/v1.0/topology/switches`) or use a background WebSocket watcher to verify Ryu is actually running and connected.
- `get_discovered_topology()`: Fetch live links from Ryu to overwrite theoretical links.
- `get_recovery_status()`: Listen to Ryu PacketIn/PortStatus events to detect real Link Down and Failover Trigger occurrences.

## 3. Metrics Tracking
**Location**: `backend/services/metrics_service.py`

Remove the mocked `.initialise_metrics()` hardcoded timeouts (e.g., `420ms`, `180ms`).
- Subscribe to specific SDN events (e.g. initial FlowMod completion timestamps) to compute real discovery time and active flows dynamically.

## 4. AI Explanations
**Location**: `backend/services/explanation_service.py`

Instead of static templates (`explain_topology_created`, `explain_failure_detected`), pass the real Event metadata to a local LLM or API integration to auto-generate the textual response summarizing what the network just experienced.
