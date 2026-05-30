import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Loader2 } from "lucide-react";
import { isApiAvailable } from "@/lib/api";

/** localStorage key set by the System Update page while an update is applying. */
export const UPDATING_FLAG = "airwaves_updating_until";

/** True if an update was marked in-progress within the last few minutes. */
function isUpdating(): boolean {
  try {
    const until = Number(localStorage.getItem(UPDATING_FLAG) || 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

/**
 * Full-width banner shown when the manager API is unreachable. Distinguishes
 * two cases:
 *  - an update is in progress (manager/gateway briefly restarting) → "updating"
 *  - otherwise → "demo data" (genuinely not connected to a device)
 *
 * Shares the ['api-status'] query cache with useApiStatus() so it neither
 * issues a duplicate request nor flashes before the first probe resolves.
 */
export default function ApiStatusBanner() {
  const { data: available, isFetched } = useQuery({
    queryKey: ["api-status"],
    queryFn: isApiAvailable,
    staleTime: 30_000,
    // Poll faster while unavailable so the banner clears quickly post-update.
    refetchInterval: (q) => (q.state.data ? 60_000 : 5_000),
    retry: false,
  });

  if (!isFetched || available) return null;

  if (isUpdating()) {
    return (
      <div className="bg-primary/10 border-b border-primary/30 text-primary text-sm px-4 py-2 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        <span>
          <span className="font-medium">Updating Airwaves OS</span> — the device is briefly unavailable and will reconnect automatically.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 text-sm px-4 py-2 flex items-center justify-center gap-2">
      <FlaskConical className="w-4 h-4 shrink-0" />
      <span>
        Showing <span className="font-medium">demo data</span> — not connected to an Airwaves OS device.
      </span>
    </div>
  );
}
