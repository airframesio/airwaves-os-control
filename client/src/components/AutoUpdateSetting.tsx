import { Loader2, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutoUpdate, useRunAutoUpdate, useSetAutoUpdate } from "@/hooks/useAirwavesApi";
import { useToast } from "@/hooks/use-toast";
import type { AutoUpdateStatus } from "@/lib/api";

const INTERVALS = [
  { hours: 6, label: "Every 6 hours" },
  { hours: 12, label: "Every 12 hours" },
  { hours: 24, label: "Daily" },
  { hours: 168, label: "Weekly" },
];

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function summary(run: NonNullable<AutoUpdateStatus["last_run"]>): string {
  const count = (o: string) => run.results.filter((r) => r.outcome === o).length;
  const parts = [
    count("updated") && `${count("updated")} updated`,
    count("up_to_date") && `${count("up_to_date")} up to date`,
    count("failed") && `${count("failed")} failed`,
  ].filter(Boolean);
  return `Last checked ${timeAgo(run.finished_at)}: ${parts.join(", ") || "no apps installed"}.`;
}

/** Automatic updates for installed apps, run by the manager on a schedule. */
export default function AutoUpdateSetting({ apiAvailable }: { apiAvailable: boolean }) {
  const { data: status } = useAutoUpdate(apiAvailable);
  const setAutoUpdate = useSetAutoUpdate();
  const runNow = useRunAutoUpdate();
  const { toast } = useToast();

  const onError = (title: string) => (err: unknown) =>
    toast({
      title,
      description: err instanceof Error ? err.message : String(err),
      variant: "destructive",
    });

  const running = Boolean(status?.running || runNow.isPending);
  const failures = status?.last_run?.results.filter((r) => r.outcome === "failed") ?? [];
  const intervalValue = String(status?.check_interval_hours ?? 24);
  const intervalOptions = INTERVALS.some((i) => String(i.hours) === intervalValue)
    ? INTERVALS
    : [...INTERVALS, { hours: Number(intervalValue), label: `Every ${intervalValue} hours` }];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="auto-update-switch">Auto-update Apps</Label>
          <p className="text-sm text-muted-foreground">
            {apiAvailable
              ? "Install new versions of your apps automatically. Apps you pinned to a version stay on it."
              : "Connect to the device to manage app updates."}
          </p>
        </div>
        <Switch
          id="auto-update-switch"
          checked={Boolean(status?.enabled)}
          disabled={!apiAvailable || !status || setAutoUpdate.isPending}
          onCheckedChange={(enabled) =>
            setAutoUpdate.mutate({ enabled }, { onError: onError("Could not change auto-update") })
          }
        />
      </div>

      {apiAvailable && status && (
        <div className="flex flex-wrap items-center gap-3 pl-0.5">
          <Select
            value={intervalValue}
            disabled={!status.enabled || setAutoUpdate.isPending}
            onValueChange={(v) =>
              setAutoUpdate.mutate(
                { check_interval_hours: Number(v) },
                { onError: onError("Could not change the schedule") },
              )
            }
          >
            <SelectTrigger className="w-40 h-8" aria-label="Check interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((i) => (
                <SelectItem key={i.hours} value={String(i.hours)}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={running}
            onClick={() => runNow.mutate(undefined, { onError: onError("Could not start the check") })}
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
            )}
            {running ? "Checking…" : "Check now"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {running
              ? "Checking installed apps for new versions…"
              : status.last_run
                ? summary(status.last_run)
                : "Not checked yet."}
          </span>
        </div>
      )}

      {failures.length > 0 && !running && (
        <ul className="text-xs text-destructive space-y-0.5 pl-0.5">
          {failures.map((f) => (
            <li key={f.app_id}>
              {f.app_id}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
