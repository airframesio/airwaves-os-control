/**
 * Hook to detect whether the Airwaves Manager API is available.
 * Used to disable live-only controls and show connection status.
 */

import { useQuery } from '@tanstack/react-query';
import { isApiAvailable } from '@/lib/api';

export function useApiStatus() {
  const { available } = useApiStatusState();
  return available;
}

/**
 * Like useApiStatus, but also reports whether the first probe has resolved,
 * so callers can distinguish "API down" from "still checking".
 */
export function useApiStatusState() {
  const { data: available = false, isFetched: resolved } = useQuery({
    queryKey: ['api-status'],
    queryFn: isApiAvailable,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });

  return { available, resolved };
}
