/**
 * React hook for consuming real-time WebSocket events from the airwaves-manager.
 *
 * Provides live system stats and container state change notifications.
 * All callers share one connection (see lib/managerSocket.ts), which
 * reconnects with backoff and closes when the last caller unmounts.
 * No-ops when the API is unavailable.
 */

import { useEffect, useSyncExternalStore } from "react";
import { useApiStatus } from "./useApiStatus";
import {
  acquireManagerSocket,
  getManagerSocketState,
  subscribeManagerSocket,
  type ManagerSocketState,
} from "@/lib/managerSocket";

export type ManagerEventState = ManagerSocketState;

/** Read the shared socket state without holding the connection open. */
export function useManagerSocketState(): ManagerSocketState {
  return useSyncExternalStore(subscribeManagerSocket, getManagerSocketState);
}

export function useManagerEvents(): ManagerEventState {
  const apiAvailable = useApiStatus();

  useEffect(() => {
    if (!apiAvailable) return;
    return acquireManagerSocket();
  }, [apiAvailable]);

  return useManagerSocketState();
}
