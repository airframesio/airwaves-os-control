import { useQuery } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { isApiAvailable } from "@/lib/api";

/**
 * Full-width banner shown when the manager API is unreachable, making it
 * obvious that the UI is showing demo (mock) data rather than a live device.
 *
 * Shares the ['api-status'] query cache with useApiStatus() so it neither
 * issues a duplicate request nor flashes before the first probe resolves.
 */
export default function ApiStatusBanner() {
  const { data: available, isFetched } = useQuery({
    queryKey: ["api-status"],
    queryFn: isApiAvailable,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });

  // Don't show until the first probe completes (avoids a flash on a live
  // device), and only when the API is actually unreachable.
  if (!isFetched || available) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 text-sm px-4 py-2 flex items-center justify-center gap-2">
      <FlaskConical className="w-4 h-4 shrink-0" />
      <span>
        Showing <span className="font-medium">demo data</span> — not connected to an Airwaves OS device.
      </span>
    </div>
  );
}
