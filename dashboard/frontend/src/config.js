/* ==========================================================================
   config.js  —  Central configuration for the React dashboard.

   MOCK MODE  (Windows, no Ubuntu backend):  MOCK_MODE = true
   LIVE MODE  (Ubuntu Flask backend running): MOCK_MODE = false
                                              Set API_BASE and WS_URL to Ubuntu IP

   Find Ubuntu IP:  hostname -I   →  e.g. 192.168.1.50
   ========================================================================== */

// Toggle mock data vs real Flask backend
export const MOCK_MODE = true;

// Flask REST base URL  (only used when MOCK_MODE = false)
export const API_BASE = "http://192.168.1.50:5000/api";

// WebSocket base URL   (only used when MOCK_MODE = false)
export const WS_URL = "http://192.168.1.50:5000";

// Polling fallback interval (ms) when WebSocket is unavailable
export const REFRESH_INTERVAL_MS = 5000;
