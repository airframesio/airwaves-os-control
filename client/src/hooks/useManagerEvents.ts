/**
 * React hook for consuming real-time WebSocket events from the airwaves-manager.
 *
 * Provides live system stats and container state change notifications.
 * Automatically reconnects on disconnect. No-ops when API is unavailable.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiStatus } from './useApiStatus';
import type { WsEvent, SystemStats } from '@/lib/api';

export interface ManagerEventState {
  connected: boolean;
  liveStats: SystemStats | null;
  lastContainerEvent: { id: string; name: string; status: string } | null;
}

export function useManagerEvents(): ManagerEventState {
  const apiAvailable = useApiStatus();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [connected, setConnected] = useState(false);
  const [liveStats, setLiveStats] = useState<SystemStats | null>(null);
  const [lastContainerEvent, setLastContainerEvent] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/events`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (msg) => {
        try {
          const event: WsEvent = JSON.parse(msg.data);

          switch (event.type) {
            case 'SystemStats':
              setLiveStats(event.data);
              break;

            case 'ContainerStatusChanged':
              setLastContainerEvent(event.data);
              // Invalidate container queries so the UI refreshes
              queryClient.invalidateQueries({ queryKey: ['containers'] });
              break;

            case 'AppInstalled':
              queryClient.invalidateQueries({ queryKey: ['containers'] });
              queryClient.invalidateQueries({ queryKey: ['apps', 'catalog'] });
              break;

            case 'AppUninstalled':
              queryClient.invalidateQueries({ queryKey: ['containers'] });
              break;

            case 'SdrDeviceChanged':
              queryClient.invalidateQueries({ queryKey: ['hardware', 'sdr'] });
              break;

            case 'UpdateAvailable':
              // Refresh the update status everywhere (sidebar indicator, page)
              // without a reload when the manager's background check finds one.
              queryClient.invalidateQueries({ queryKey: ['update'] });
              break;
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Reconnect after 5 seconds
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // WebSocket construction failed
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [queryClient]);

  useEffect(() => {
    if (apiAvailable) {
      connect();
    }

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [apiAvailable, connect]);

  return { connected, liveStats, lastContainerEvent };
}
