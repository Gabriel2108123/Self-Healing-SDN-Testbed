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

/** Launch a new topology with given config */
export async function launchTopology(config) {
  const res = await fetch(`${API_BASE}/topology/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error(`Topology launch failed: ${res.status}`);
  return res.json();
}

/** Stop the currently running topology */
export async function stopTopology() {
  const res = await fetch(`${API_BASE}/topology/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Topology stop failed: ${res.status}`);
  return res.json();
}

/** Reset the currently running topology */
export async function resetTopology() {
  const res = await fetch(`${API_BASE}/topology/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`Topology reset failed: ${res.status}`);
  return res.json();
}

/** Simulate a link failure */
export async function simulateFailure(config) {
  const res = await fetch(`${API_BASE}/topology/simulate-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.status}`);
  return res.json();
}

