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
  const [lines, setLines] = useState<LogLine[]>([]);
  const [connected, setConnected] = useState(false);
  // The cap is client-side only, so changing it must not reopen the stream.
  const maxLinesRef = useRef(maxLines);

  const clear = useCallback(() => setLines([]), []);

  useEffect(() => {
    maxLinesRef.current = maxLines;
    setLines(prev => (prev.length > maxLines ? prev.slice(-maxLines) : prev));
  }, [maxLines]);

  useEffect(() => {
    // A new container (or none) starts with an empty, disconnected stream.
    setLines([]);
    setConnected(false);
    if (!apiAvailable || !containerId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/logs/${encodeURIComponent(containerId)}`;

    const ws = new WebSocket(url);
    let active = true;

    ws.onopen = () => {
      if (active) setConnected(true);
    };

    ws.onmessage = (msg) => {
      if (!active) return;
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'log' && data.line) {
          setLines(prev => {
            const next = [...prev, { line: data.line, timestamp: data.timestamp }];
            const cap = maxLinesRef.current;
            return next.length > cap ? next.slice(-cap) : next;
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      if (active) setConnected(false);
    };
    ws.onerror = () => ws.close();

    return () => {
      active = false;
      ws.close();
    };
  }, [apiAvailable, containerId]);

  return { lines, connected, clear };
}
