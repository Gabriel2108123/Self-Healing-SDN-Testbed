/**
 * mockData.js
 * -----------
 * Static mock payloads matching all real Flask API response shapes.
 * Used when MOCK_MODE = true in config.js.
 */

// ── /api/dashboard ─────────────────────────────────────────────────────────
export const MOCK_DASHBOARD = {
  controller_status: "active",
  connectivity: "connected",
  active_path: [1, 2],
  path_label: "Normal  [1→2]",
  path_is_failover: false,
  failures: 3,
  recoveries: 3,
  reroutes: 3,
  link_states: [
    { link: "s1-s2", state: "UP",   timestamp: "2026-03-10 10:24:57" },
    { link: "s1-s3", state: "UP",   timestamp: "2026-03-10 10:24:57" },
    { link: "s3-s2", state: "UP",   timestamp: "2026-03-10 10:24:57" },
    { link: "h1-s1", state: "UP",   timestamp: "2026-03-10 10:24:57" },
    { link: "s2-h2", state: "UP",   timestamp: "2026-03-10 10:24:57" },
  ],
  recent_events: [
    { timestamp: "2026-03-10 10:24:57", type: "recovery", message: "RECOVERY: path=[1,2] restored after s1-s2 link up" },
    { timestamp: "2026-03-10 10:24:35", type: "reroute",  message: "REROUTE: active_path=[1,3,2] via backup switch s3" },
    { timestamp: "2026-03-10 10:24:35", type: "failure",  message: "LINK_FAILURE: s1-s2 detected — initiating failover" },
    { timestamp: "2026-03-10 10:20:12", type: "recovery", message: "RECOVERY: path=[1,2] restored after s1-s2 link up" },
    { timestamp: "2026-03-10 10:20:08", type: "reroute",  message: "REROUTE: active_path=[1,3,2] via backup switch s3" },
    { timestamp: "2026-03-10 10:20:08", type: "failure",  message: "LINK_FAILURE: s1-s2 detected — initiating failover" },
    { timestamp: "2026-03-10 10:15:40", type: "recovery", message: "RECOVERY: path=[1,2] restored after s1-s2 link up" },
    { timestamp: "2026-03-10 10:15:32", type: "reroute",  message: "REROUTE: active_path=[1,3,2] via backup switch s3" },
    { timestamp: "2026-03-10 10:15:32", type: "failure",  message: "LINK_FAILURE: s1-s2 detected — initiating failover" },
    { timestamp: "2026-03-10 10:00:00", type: "info",     message: "Controller started: Ryu OpenFlow 1.3" },
  ],
  total_events: 10,
};

// ── /api/topology (enriched shape for D3 graph) ────────────────────────────
export const MOCK_TOPOLOGY = {
  nodes: [
    { id: "h1", type: "host" },
    { id: "s1", type: "switch" },
    { id: "s2", type: "switch" },
    { id: "s3", type: "switch" },
    { id: "h2", type: "host" },
  ],
  links: [
    { source: "h1", target: "s1", status: "up",   kind: "host"    },
    { source: "s1", target: "s2", status: "up",   kind: "primary" },
    { source: "s1", target: "s3", status: "up",   kind: "backup"  },
    { source: "s3", target: "s2", status: "up",   kind: "backup"  },
    { source: "s2", target: "h2", status: "up",   kind: "host"    },
  ],
  activePath: ["s1", "s2"],
  normal_path:   [1, 2],
  failover_path: [1, 3, 2],
};

// ── /api/timeline ──────────────────────────────────────────────────────────
export const MOCK_TIMELINE = [
  { timestamp: "2026-03-10 10:15:32", type: "failure",  link: "s1-s2" },
  { timestamp: "2026-03-10 10:15:32", type: "reroute",  path: ["s1","s3","s2"] },
  { timestamp: "2026-03-10 10:15:40", type: "recovery", link: "s1-s2" },
  { timestamp: "2026-03-10 10:20:08", type: "failure",  link: "s1-s2" },
  { timestamp: "2026-03-10 10:20:08", type: "reroute",  path: ["s1","s3","s2"] },
  { timestamp: "2026-03-10 10:20:12", type: "recovery", link: "s1-s2" },
  { timestamp: "2026-03-10 10:24:35", type: "failure",  link: "s1-s2" },
  { timestamp: "2026-03-10 10:24:35", type: "reroute",  path: ["s1","s3","s2"] },
  { timestamp: "2026-03-10 10:24:57", type: "recovery", link: "s1-s2" },
];

// ── /api/recovery-stats ────────────────────────────────────────────────────
export const MOCK_RECOVERY_STATS = {
  failuresDetected:    3,
  recoveriesCompleted: 3,
  averageRecoveryTime: 1.87,
  lastRecoveryTime:    2.10,
  availability:        99.4,
  recoveryTimes:       [1.50, 1.80, 2.10],
  recoveryEvents: [
    { timestamp: "2026-03-10 10:15:40", duration: 1.50 },
    { timestamp: "2026-03-10 10:20:12", duration: 1.80 },
    { timestamp: "2026-03-10 10:24:57", duration: 2.10 },
  ],
};

// ── /api/explanations ──────────────────────────────────────────────────────
export const MOCK_EXPLANATIONS = [
  {
    timestamp: "2026-03-10 10:24:57",
    type:      "recovery",
    title:     "Primary path restored",
    explanation:
      "The direct link between s1 and s2 became available again. " +
      "The Ryu controller detected the port re-joining the OpenFlow domain and " +
      "immediately reinstalled the shortest path flows. Traffic is now flowing directly " +
      "s1→s2 without passing through the backup switch s3.",
  },
  {
    timestamp: "2026-03-10 10:24:35",
    type:      "reroute",
    title:     "Traffic rerouted via s3",
    explanation:
      "After detecting the s1-s2 link failure, the controller selected the next " +
      "shortest path: s1→s3→s2. New flow rules were installed on all three switches " +
      "to forward packets along the backup route. Connectivity between h1 and h2 " +
      "was maintained with no loss of end-to-end reachability.",
  },
  {
    timestamp: "2026-03-10 10:24:35",
    type:      "failure",
    title:     "Failure detected on s1-s2",
    explanation:
      "The OpenFlow controller received a port-status message indicating that the " +
      "link between s1 (port 2) and s2 (port 1) went down. The controller removed " +
      "the existing flow rules that used this path and triggered rerouting immediately.",
  },
  {
    timestamp: "2026-03-10 10:00:00",
    type:      "info",
    title:     "Controller started",
    explanation:
      "The Ryu SDN controller initialised successfully with OpenFlow 1.3. " +
      "Topology discovery completed: 3 switches (s1, s2, s3) and 2 hosts (h1, h2) " +
      "were detected. The initial active path was set to the primary route s1→s2.",
  },
];

