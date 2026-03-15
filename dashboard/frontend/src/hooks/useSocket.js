/**
 * useSocket.js
 * ------------
 * Custom hook wrapping socket.io-client.
 * In MOCK_MODE it returns a no-op stub so the rest of the app
 * can call socket methods safely without a running server.
 *
 * Usage:
 *   const { connected, on, off } = useSocket();
 */

import { useEffect, useRef, useState } from 'react';
import { MOCK_MODE, WS_URL } from '../config.js';

// ── Mock socket for MOCK_MODE ──────────────────────────────────────────────
function createMockSocket() {
  return {
    connected: false,
    on:        () => {},
    off:       () => {},
    disconnect:() => {},
  };
}

// ── Real socket factory (lazy-imported so bundle doesn't fail in mock) ─────
let _io = null;
async function getIO() {
  if (!_io) {
    const mod = await import('socket.io-client');
    _io = mod.default || mod.io;
  }
  return _io;
}

export function useSocket() {
  const socketRef   = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (MOCK_MODE) {
      socketRef.current = createMockSocket();
      return;
    }

    let socket;
    getIO().then(io => {
      socket = io(WS_URL, {
        transports:       ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;

      socket.on('connect',    () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  /**
   * Subscribe to a socket event.
   * Returns a cleanup function — use inside useEffect.
   */
  function on(event, handler) {
    const s = socketRef.current;
    if (!s || MOCK_MODE) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }

  return { connected, on };
}
