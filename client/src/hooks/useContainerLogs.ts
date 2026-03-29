/**
 * WebSocket hook for streaming container logs in real-time.
 * Connects to /ws/logs/{containerId} and accumulates log lines.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApiStatus } from './useApiStatus';

export interface LogLine {
  line: string;
  timestamp: string;
}

export function useContainerLogStream(containerId: string | null, maxLines = 500) {
  const apiAvailable = useApiStatus();
  const wsRef = useRef<WebSocket | null>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);

  const clear = useCallback(() => setLines([]), []);

  useEffect(() => {
    if (!apiAvailable || !containerId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/logs/${encodeURIComponent(containerId)}`;

    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'log' && data.line) {
          setLines(prev => {
            const next = [...prev, { line: data.line, timestamp: data.timestamp }];
            return next.length > maxLines ? next.slice(-maxLines) : next;
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => ws.close();

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [apiAvailable, containerId, maxLines]);

  return { lines, connected, clear };
}
