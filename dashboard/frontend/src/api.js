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
  return _get('/dashboard');
}

/** Topology nodes + links (enriched with status + kind) */
export async function fetchTopology() {
  return _get('/topology');
}

/** Raw event list */
export async function fetchEvents() {
  return _get('/events');
}

/** Failure/reroute/recovery timeline */
export async function fetchTimeline() {
  return _get('/timeline');
}

/** Recovery performance stats */
export async function fetchRecoveryStats() {
  return _get('/recovery-stats');
}

/** Plain-English explainability entries */
export async function fetchExplanations() {
  return _get('/explanations');
}

