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

/** Launch a new topology with given config */
export async function launchTopology(config) {
  const res = await fetch(`${API_BASE}/topology/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Topology launch failed: ${res.status}`);
  }
  return res.json();
}

/** Stop the currently running topology */
export async function stopTopology() {
  const res = await fetch(`${API_BASE}/topology/stop`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Topology stop failed: ${res.status}`);
  }
  return res.json();
}

/** Reset the currently running topology */
export async function resetTopology() {
  const res = await fetch(`${API_BASE}/topology/reset`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Topology reset failed: ${res.status}`);
  }
  return res.json();
}

/** Simulate a random link failure */
export async function simulateRandomFailure() {
  const res = await fetch(`${API_BASE}/topology/simulate-random-failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Simulation failed: ${res.status}`);
  }
  return res.json();
}

/** Recover a link */
export async function recoverLink() {
  const res = await fetch(`${API_BASE}/topology/recover-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Recovery failed: ${res.status}`);
  }
  return res.json();
}

export async function toggleLoadBalancing(enabled) {
  const res = await fetch(`${API_BASE}/features/load-balancing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Toggle failed: ${res.status}`);
  }
  return res.json();
}

export async function togglePredictiveAnalytics(enabled) {
  const res = await fetch(`${API_BASE}/features/predictive-analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Toggle failed: ${res.status}`);
  }
  return res.json();
}

export async function toggleAutoFailureMode(enabled) {
  const res = await fetch(`${API_BASE}/features/auto-failure-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Toggle failed: ${res.status}`);
  }
  return res.json();
}
