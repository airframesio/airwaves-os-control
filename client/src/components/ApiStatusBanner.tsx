import { useApiStatus } from "@/hooks/useApiStatus";
import { useManagerEvents } from "@/hooks/useManagerEvents";
import { Wifi, WifiOff, Radio } from "lucide-react";

/**
 * Compact connection status indicator for the app layout.
 * Shows whether the manager API and WebSocket are connected.
 */
export default function ApiStatusBanner() {
  const apiAvailable = useApiStatus();
  const { connected: wsConnected } = useManagerEvents();

  if (!apiAvailable) return null; // Don't show in dev/offline mode

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
      <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span>{wsConnected ? 'Connected' : 'API only'}</span>
    </div>
  );
}
