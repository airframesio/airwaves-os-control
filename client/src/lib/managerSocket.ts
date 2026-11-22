/**
 * One shared WebSocket to the manager's /ws/events stream.
 *
 * Every component that calls useManagerEvents() shares this connection, so
 * the layout and the current page no longer open a socket each, and each
 * event invalidates queries once instead of once per subscriber.
 *
 * The socket is reference counted: it opens with the first subscriber and
 * closes (with no reconnect) when the last one goes away. Reconnects back off
 * from 1 s to 30 s with jitter, so a flapping manager is not hammered.
 */

import { queryClient } from "./queryClient";
import type { SystemStats, WsEvent } from "./api";

export interface ManagerSocketState {
  connected: boolean;
  liveStats: SystemStats | null;
  lastContainerEvent: { id: string; name: string; status: string } | null;
}

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

let state: ManagerSocketState = {
  connected: false,
  liveStats: null,
  lastContainerEvent: null,
};
const listeners = new Set<() => void>();
let refCount = 0;
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;

function setState(patch: Partial<ManagerSocketState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function handleEvent(event: WsEvent) {
  switch (event.type) {
    case "SystemStats":
      setState({ liveStats: event.data });
      break;
    case "ContainerStatusChanged":
      setState({ lastContainerEvent: event.data });
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      break;
    case "AppInstalled":
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.invalidateQueries({ queryKey: ["apps", "catalog"] });
      break;
    case "AppUninstalled":
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      break;
    case "SdrDeviceChanged":
      queryClient.invalidateQueries({ queryKey: ["hardware", "sdr"] });
      break;
    case "UpdateAvailable":
      queryClient.invalidateQueries({ queryKey: ["update"] });
      break;
  }
}

function scheduleReconnect() {
  if (refCount === 0 || reconnectTimer) return;
  const base = Math.min(MAX_BACKOFF_MS, MIN_BACKOFF_MS * 2 ** attempt);
  const delay = base / 2 + Math.random() * (base / 2);
  attempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open();
  }, delay);
}

function open() {
  if (refCount === 0 || ws) return;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  let socket: WebSocket;
  try {
    socket = new WebSocket(`${protocol}//${window.location.host}/ws/events`);
  } catch {
    scheduleReconnect();
    return;
  }
  ws = socket;

  socket.onopen = () => {
    if (ws !== socket) return;
    attempt = 0;
    setState({ connected: true });
  };

  socket.onmessage = (msg) => {
    if (ws !== socket) return;
    try {
      handleEvent(JSON.parse(msg.data) as WsEvent);
    } catch {
      // Ignore malformed messages
    }
  };

  socket.onerror = () => socket.close();

  socket.onclose = () => {
    // A socket we closed on purpose (last subscriber left) is no longer
    // `ws`, so it must not schedule a reconnect.
    if (ws !== socket) return;
    ws = null;
    setState({ connected: false });
    scheduleReconnect();
  };
}

function close() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  attempt = 0;
  const socket = ws;
  ws = null;
  socket?.close();
  if (state.connected) setState({ connected: false });
}

/** Hold the connection open until the returned release function is called. */
export function acquireManagerSocket(): () => void {
  refCount += 1;
  if (refCount === 1) open();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount -= 1;
    if (refCount === 0) close();
  };
}

export function subscribeManagerSocket(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getManagerSocketState(): ManagerSocketState {
  return state;
}
