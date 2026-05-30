import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DownloadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiStatus } from "@/hooks/useApiStatus";
import { updateApi, type Severity } from "@/lib/api";

/**
 * Condensed "updates available" indicator for the sidebar footer (shown above
 * System Status). Appears app-wide whenever updates are available, replacing
 * the per-page content banner. Renders nothing when up to date or offline.
 */
export default function SidebarUpdateIndicator({ collapsed }: { collapsed?: boolean }) {
  const apiAvailable = useApiStatus();
  const { data } = useQuery({
    queryKey: ["update", "status"],
    queryFn: updateApi.getStatus,
    enabled: apiAvailable,
    // Poll for freshness without a reload; also invalidated immediately by the
    // manager's UpdateAvailable WebSocket event and by Check/Update actions.
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    retry: false,
  });

  if (!apiAvailable || !data?.update_available) return null;

  const count =
    data.components.filter((c) => c.update_available).length +
    ((data.os_packages_upgradable ?? 0) > 0 ? 1 : 0) +
    (data.major_upgrade ? 1 : 0);

  const severity: Severity = data.highest_severity ?? "nice-to-have";
  const tone =
    severity === "required"
      ? "text-red-500 bg-red-500/10 hover:bg-red-500/15 border-red-500/30"
      : severity === "recommended"
        ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30"
        : "text-sky-500 bg-sky-500/10 hover:bg-sky-500/15 border-sky-500/30";

  if (collapsed) {
    return (
      <Link href="/updates">
        <div
          className={cn("relative flex items-center justify-center w-10 h-10 rounded-lg border cursor-pointer", tone)}
          title={`${count} update${count === 1 ? "" : "s"} available`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-current text-[10px] font-bold leading-4 text-center text-background">
            {count}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/updates">
      <div className={cn("mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors", tone)}>
        <DownloadCloud className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          {count} update{count === 1 ? "" : "s"} available
        </span>
        <span className="capitalize opacity-80">{severity.replace(/-/g, " ")}</span>
      </div>
    </Link>
  );
}
