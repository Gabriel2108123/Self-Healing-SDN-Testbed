/**
 * Dashboard.jsx  (Phase 2–6 update)
 * -----------------------------------
 * Full dashboard page with all 6 feature phases:
 *   Phase 1: Status cards + EventLog + LinkStatePanel  (existing)
 *   Phase 2: D3 TopologyGraph
 *   Phase 3: WebSocket live updates via useSocket hook
 *   Phase 4: FailureTimeline
 *   Phase 5: RecoveryStats + RecoveryChart
 *   Phase 6: ExplanationPanel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_MODE, REFRESH_INTERVAL_MS } from '../config.js';
import {
  fetchDashboard, fetchTopology, fetchTimeline,
  fetchRecoveryStats, fetchExplanations,
} from '../api.js';
import { useSocket } from '../hooks/useSocket.js';

// Components
import Header           from '../components/Header.jsx';
import StatusCard       from '../components/StatusCard.jsx';
import TopologyGraph    from '../components/TopologyGraph.jsx';
import EventLog         from '../components/EventLog.jsx';
import LinkStatePanel   from '../components/LinkStatePanel.jsx';
import FailureTimeline  from '../components/FailureTimeline.jsx';
import RecoveryStats    from '../components/RecoveryStats.jsx';
import RecoveryChart    from '../components/RecoveryChart.jsx';
import ExplanationPanel from '../components/ExplanationPanel.jsx';

// ── SVG Icon helpers ────────────────────────────────────────────────────────
const IconController  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconConnectivity= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 6s5-4 11-4 11 4 11 4"/><path d="M5 10s3-2.5 7-2.5 7 2.5 7 2.5"/><path d="M9 14s1.5-1 3-1 3 1 3 1"/><line x1="12" y1="18" x2="12" y2="18"/></svg>);
const IconPath        = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
const IconFailure     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconRecovery    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconEvents      = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);

function ctrlInfo(s) { return s === 'active' ? { label:'Active', st:'ok' } : s === 'degraded' ? { label:'Degraded', st:'warning' } : { label:'Unknown', st:'info' }; }
function connInfo(c) { return c === 'connected' ? { label:'Connected', st:'ok' } : c === 'degraded' ? { label:'Degraded', st:'error' } : { label:'Unknown', st:'info' }; }

// Normalize port-qualified backend link names (e.g. "s1:p2-s2:p2") to "s1-s2"
function normalizeLinkName(link) {
  const parts = (link || '').split('-');
  if (parts.length < 2) return link;
  return `${parts[0].split(':')[0]}-${parts[1].split(':')[0]}`;
}

// ── Build topology nodes/links from dashboard data for the D3 graph ─────────
function buildTopoFromDash(topology, dashboard) {
  if (!topology) return { nodes: [], links: [], activePath: [] };

  // Determine which links are down from dashboard link_states
  const downSet = new Set(
    (dashboard?.link_states || [])
      .filter(l => l.state === 'DOWN')
      .map(l => normalizeLinkName(l.link))
  );

  const enrichedLinks = (topology.links || []).map(lk => {
    const linkId  = `${lk.source}-${lk.target}`;
    const linkIdR = `${lk.target}-${lk.source}`;
    const isDown = downSet.has(linkId) || downSet.has(linkIdR);
    return { ...lk, status: isDown ? 'down' : 'up' };
  });

  // Convert numeric active_path [1,2] → string ["s1","s2"]
  const switchMap = { 1: 's1', 2: 's2', 3: 's3' };
  const numPath = dashboard?.active_path || topology.normal_path || [1, 2];
  const strPath = numPath.map(n => switchMap[n] || String(n));
  // Include hosts at edges
  const fullPath = ['h1', ...strPath, 'h2'];

  return { nodes: topology.nodes || [], links: enrichedLinks, activePath: fullPath };
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [dash,        setDash]        = useState(null);
  const [topology,    setTopology]    = useState(null);
  const [timeline,    setTimeline]    = useState([]);
  const [recStats,    setRecStats]    = useState(null);
  const [explanations,setExplanations]= useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastRefreshed,setLastRefreshed] = useState(null);

  // Phase 3: WebSocket hook
  const { connected: wsConnected, on: wsOn } = useSocket();

  // ── Load all data ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [d, t, tl, rs, ex] = await Promise.all([
        fetchDashboard(),
        fetchTopology(),
        fetchTimeline(),
        fetchRecoveryStats(),
        fetchExplanations(),
      ]);
      setDash(d);
      setTopology(t);
      setTimeline(Array.isArray(tl) ? tl : []);
      setRecStats(rs);
      setExplanations(Array.isArray(ex) ? ex : []);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Phase 3: Socket event subscriptions ──────────────────────────────────
  useEffect(() => {
    const unsub1 = wsOn('dashboard_update', data => {
      setDash(data);
      setLastRefreshed(new Date());
    });
    const unsub2 = wsOn('topology_update', data => {
      setTopology(data);
    });
    const unsub3 = wsOn('event_update', data => {
      if (data?.events) setDash(prev => prev ? { ...prev, recent_events: data.events } : prev);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [wsOn]);

  // ── Polling fallback in live mode (catches up if WebSocket drops) ──────────
  useEffect(() => {
    if (MOCK_MODE) return;
    const t = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [load]);

  // ── Derived topology for D3 ───────────────────────────────────────────────
  const topoData    = buildTopoFromDash(topology, dash);
  const isFailover  = dash?.path_is_failover;

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="full-center"><div className="spinner"/><p className="loading-text">Loading SDN data…</p></div>
  );
  if (error) return (
    <div className="full-center">
      <div className="error-box">
        <h2>⚠ Could not reach backend</h2>
        <p>{error}</p>
        <p className="error-hint">Set <code>MOCK_MODE = true</code> in <code>src/config.js</code> to use mock data, or start Flask on Ubuntu and set <code>API_BASE</code>.</p>
        <button className="btn-retry" onClick={load}>Retry</button>
      </div>
    </div>
  );

  const ctrl = ctrlInfo(dash?.controller_status);
  const conn = connInfo(dash?.connectivity);

  return (
    <div className="dashboard-root">
      <Header lastRefreshed={lastRefreshed} onRefresh={load} wsConnected={wsConnected} />

      <main className="dashboard-main">

        {/* ── Phase 1: Status Cards ── */}
        <section className="cards-grid" aria-label="Status overview">
          <StatusCard title="Controller Status" value={ctrl.label} status={ctrl.st}  icon={<IconController />}  sub="Ryu OpenFlow 1.3"/>
          <StatusCard title="Connectivity"       value={conn.label} status={conn.st}  icon={<IconConnectivity />} sub="h1 → h2"/>
          <StatusCard title="Active Path"        value={dash?.path_label || '—'}
                      status={isFailover ? 'warning' : 'ok'}  icon={<IconPath />}
                      sub={isFailover ? 'Traffic via s3 (backup)' : 'Direct s1→s2 route'}/>
          <StatusCard title="Link Failures"  value={dash?.failures ?? 0}
                      status={dash?.failures > 0 ? 'error' : 'ok'}  icon={<IconFailure />}  sub="Since controller start"/>
          <StatusCard title="Recoveries"     value={dash?.recoveries ?? 0}
                      status={dash?.recoveries > 0 ? 'ok' : 'info'} icon={<IconRecovery />}
                      sub={`${dash?.reroutes ?? 0} reroutes`}/>
          <StatusCard title="Total Events"   value={dash?.total_events ?? 0}
                      status="info" icon={<IconEvents />}
                      sub="All log entries"/>
        </section>

        {/* ── Phase 2: D3 Topology + Link State ── */}
        <section className="panels-row" aria-label="Network topology">
          <TopologyGraph
            nodes={topoData.nodes}
            links={topoData.links}
            activePath={topoData.activePath}
            pathIsFailover={isFailover}
          />
          <LinkStatePanel linkStates={dash?.link_states} />
        </section>

        {/* ── Phase 4: Failure Timeline + Event Log ── */}
        <section className="panels-row-half" aria-label="Events">
          <FailureTimeline events={timeline} />
          <EventLog events={dash?.recent_events} />
        </section>

        {/* ── Phase 5: Recovery Performance ── */}
        <section className="panels-row" aria-label="Recovery charts">
          <RecoveryChart stats={recStats} />
          <RecoveryStats stats={recStats} />
        </section>

        {/* ── Phase 6: Explainability ── */}
        <section aria-label="Explainability">
          <ExplanationPanel explanations={explanations} />
        </section>

      </main>

      <footer className="dashboard-footer">
        <span>Self-Healing SDN Testbed — Final Year Project</span>
        <span>
          {MOCK_MODE
            ? 'Running in MOCK mode'
            : wsConnected ? '🟢 Live (WebSocket)' : '🟡 Live (polling)'}
        </span>
        {!MOCK_MODE && (
          <span className="data-source">
            Source: <code>http://localhost:5000/api/dashboard</code>
          </span>
        )}
      </footer>
    </div>
  );
}
