/**
 * api.js
 * ------
 * Centralised data-fetching layer.
 * Reads MOCK_MODE from config.js — returns static mock data or hits Flask.
 */

import { MOCK_MODE, API_BASE } from './config.js';
import {
  MOCK_DASHBOARD,
  MOCK_TOPOLOGY,
  MOCK_TIMELINE,
  MOCK_RECOVERY_STATS,
  MOCK_EXPLANATIONS,
} from './mockData.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function _get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

/** Aggregated dashboard summary */
export async function fetchDashboard() {
  if (MOCK_MODE) { await delay(300); return MOCK_DASHBOARD; }
  return _get('/dashboard');
}

/** Topology nodes + links (enriched with status + kind) */
export async function fetchTopology() {
  if (MOCK_MODE) { await delay(200); return MOCK_TOPOLOGY; }
  return _get('/topology');
}

/** Raw event list */
export async function fetchEvents() {
  if (MOCK_MODE) { await delay(200); return { events: MOCK_DASHBOARD.recent_events, count: MOCK_DASHBOARD.total_events }; }
  return _get('/events');
}

/** Failure/reroute/recovery timeline */
export async function fetchTimeline() {
  if (MOCK_MODE) { await delay(200); return MOCK_TIMELINE; }
  return _get('/timeline');
}

/** Recovery performance stats */
export async function fetchRecoveryStats() {
  if (MOCK_MODE) { await delay(200); return MOCK_RECOVERY_STATS; }
  return _get('/recovery-stats');
}

/** Plain-English explainability entries */
export async function fetchExplanations() {
  if (MOCK_MODE) { await delay(200); return MOCK_EXPLANATIONS; }
  return _get('/explanations');
}

