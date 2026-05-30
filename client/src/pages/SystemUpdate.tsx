import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DownloadCloud, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Package,
  Server, LayoutGrid, FileCog, Boxes, RotateCcw, ArrowUpCircle, ExternalLink, Power
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useToast } from "@/hooks/use-toast";
import {
  updateApi, systemApi, UPDATE_CHANNELS,
  type UpdateStatus, type UpdateProgress, type Severity, type ComponentUpdate,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const COMPONENT_LABELS: Record<string, { label: string; icon: typeof Server }> = {
  manager: { label: "System Manager", icon: Server },
  gateway: { label: "Control Panel", icon: LayoutGrid },
  compose: { label: "System Configuration", icon: FileCog },
  catalog: { label: "App Catalog", icon: Boxes },
};

function severityBadge(sev: Severity) {
  switch (sev) {
    case "required":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Required</Badge>;
    case "recommended":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Recommended</Badge>;
    default:
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Nice to have</Badge>;
  }
}

const TERMINAL_STATES = ["success", "failed", "rolled_back", "idle"];

export default function SystemUpdate() {
  const apiAvailable = useApiStatus();
  const { toast } = useToast();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [applying, setApplying] = useState(false);
  const [switchingChannel, setSwitchingChannel] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSetChannel = async (channel: string) => {
    if (channel === status?.installed.channel) return;
    if ((channel === "dev" || channel === "beta") &&
        !window.confirm(`Switch to the "${channel}" channel? It may offer less-tested updates.`)) {
      return;
    }
    setSwitchingChannel(true);
    try {
      const s = await updateApi.setChannel(channel);
      setStatus(s);
      toast({ title: "Channel changed", description: `Now tracking the ${channel} channel.` });
    } catch (err) {
      toast({ title: "Couldn't switch channel", description: String(err), variant: "destructive" });
    } finally {
      setSwitchingChannel(false);
    }
  };

  const loadStatus = async (force = false) => {
    if (!apiAvailable) return;
    setChecking(true);
    try {
      const s = force ? await updateApi.check() : await updateApi.getStatus();
      setStatus(s);
    } catch (err) {
      toast({ title: "Check failed", description: String(err), variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadStatus(false);
    // Pick up any in-flight update (e.g. after a manager restart).
    if (apiAvailable) {
      updateApi.getProgress().then((p) => {
        if (p.state === "running") {
          setApplying(true);
          setProgress(p);
          startPolling();
        }
      }).catch(() => {});
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiAvailable]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const p = await updateApi.getProgress();
        setProgress(p);
        if (TERMINAL_STATES.includes(p.state)) {
          stopPolling();
          setApplying(false);
          if (p.state === "success") {
            toast({ title: "Update complete", description: p.reboot_required ? "A reboot is required to finish." : "All done." });
            loadStatus(true);
          } else if (p.state === "failed") {
            toast({ title: "Update failed", description: p.error ?? "See log for details.", variant: "destructive" });
          } else if (p.state === "rolled_back") {
            toast({ title: "Update rolled back", description: "The previous version was restored.", variant: "destructive" });
          }
        }
      } catch {
        // Manager is likely restarting mid-update; keep polling.
        setProgress((prev) => prev ? { ...prev, phase: prev.phase || "applying", state: "running" } : prev);
      }
    }, 2000);
  };

  const apply = async (components: string[]) => {
    if (!components.length) return;
    setApplying(true);
    setProgress({ state: "running", phase: "queued", percent: 0, log: [], reboot_required: false });
    try {
      await updateApi.apply(components);
      startPolling();
    } catch (err) {
      setApplying(false);
      toast({ title: "Could not start update", description: String(err), variant: "destructive" });
    }
  };

  const reboot = async () => {
    if (!window.confirm("Reboot now to finish the update?")) return;
    try {
      await systemApi.reboot();
      toast({ title: "Rebooting", description: "The device is restarting." });
    } catch (err) {
      toast({ title: "Reboot failed", description: String(err), variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    if (!window.confirm(
      "Reinstall the current release? This re-pulls the correct compose, config, catalog, and re-installs the System Manager and Control Panel at the current version. It does NOT upgrade — a backup is taken first."
    )) return;
    setApplying(true);
    setProgress({ state: "running", phase: "queued", percent: 0, log: ["Force refresh requested"], reboot_required: false });
    try {
      await updateApi.refresh();
      startPolling();
      toast({ title: "Refreshing", description: "Reinstalling the current release (a backup is taken first)." });
    } catch (err) {
      setApplying(false);
      toast({ title: "Couldn't start refresh", description: String(err), variant: "destructive" });
    }
  };

  const pendingComponents = (status?.components ?? []).filter((c) => c.update_available);
  const applyAll = () => {
    const names = pendingComponents.map((c) => c.name);
    if ((status?.os_packages_upgradable ?? 0) > 0) names.push("os_packages");
    if (status?.major_upgrade) names.push("os_major");
    apply(names);
  };

  if (!apiAvailable) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Header />
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground">
            <DownloadCloud className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Connect to an Airwaves OS device to check for and apply updates.
          </CardContent>
        </Card>
      </div>
    );
  }

  const inst = status?.installed;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Header />
        <div className="flex items-center gap-3">
          {/* Update channel selector */}
          <div className="flex items-center rounded-lg border border-border/60 p-0.5 bg-card/50">
            {UPDATE_CHANNELS.map((ch) => {
              const active = (status?.installed.channel ?? "stable") === ch;
              return (
                <button
                  key={ch}
                  onClick={() => handleSetChannel(ch)}
                  disabled={!apiAvailable || switchingChannel || applying}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors disabled:opacity-50",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`Track the ${ch} channel`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          <Button variant="outline" onClick={() => loadStatus(true)} disabled={checking || applying || switchingChannel}>
            {checking || switchingChannel ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check now
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={applying || switchingChannel}
            title="Reinstall the current release (repair) without upgrading — a backup is taken first"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Force refresh
          </Button>
        </div>
      </div>

      {status?.error && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="py-3 text-sm text-amber-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Couldn't reach the update server: {status.error}
          </CardContent>
        </Card>
      )}

      {/* Apply progress */}
      {applying && progress && (
        <Card className="bg-primary/5 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Applying update — {progress.phase || progress.state}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress.percent} className="h-2" />
            {progress.log.length > 0 && (
              <pre className="text-xs bg-black/40 rounded p-3 max-h-40 overflow-auto font-mono text-muted-foreground">
                {progress.log.slice(-12).join("\n")}
              </pre>
            )}
            <p className="text-xs text-muted-foreground">
              The manager may briefly restart during the update — this page will reconnect automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reboot prompt */}
      {progress?.reboot_required && progress.state === "success" && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> A reboot is required to finish the update.
            </span>
            <Button size="sm" variant="outline" onClick={reboot}>
              <Power className="w-4 h-4 mr-2" /> Reboot now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current versions */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" /> Installed
          </CardTitle>
          <CardDescription>
            {status?.last_checked ? `Last checked ${new Date(status.last_checked).toLocaleString()}` : "Not checked yet"}
            {inst?.channel ? ` • ${inst.channel} channel` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Field label="Airwaves OS" value={inst ? `${inst.os_version}${inst.os_codename ? ` (${inst.os_codename})` : ""}` : "—"} />
          <Field label="System Manager" value={inst?.manager ?? "—"} />
          <Field label="Control Panel" value={inst?.control_app ?? "—"} />
          <Field label="Config rev" value={inst ? `#${inst.compose}` : "—"} />
          <Field label="Catalog rev" value={inst ? `#${inst.catalog}` : "—"} />
        </CardContent>
      </Card>

      {/* Available updates */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-primary" /> Available updates
              </CardTitle>
              <CardDescription>
                {status?.update_available
                  ? "Updates are available for your device."
                  : "Your device is up to date."}
              </CardDescription>
            </div>
            {pendingComponents.length > 0 && (
              <Button onClick={applyAll} disabled={applying}>Update all</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!status?.update_available && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle2 className="w-4 h-4" /> Everything is current.
            </div>
          )}

          {pendingComponents.map((c) => (
            <ComponentRow key={c.name} c={c} applying={applying} onUpdate={() => apply([c.name])} />
          ))}

          {/* OS packages */}
          {(status?.os_packages_upgradable ?? 0) > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Operating system packages</div>
                    <div className="text-xs text-muted-foreground">{status?.os_packages_upgradable} package(s) can be upgraded</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {severityBadge("recommended")}
                  <Button variant="outline" size="sm" onClick={() => apply(["os_packages"])} disabled={applying}>Update</Button>
                </div>
              </div>
            </>
          )}

          {/* Major OS upgrade */}
          {status?.major_upgrade && (
            <>
              <Separator />
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <ArrowUpCircle className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-medium text-sm">
                      Major OS upgrade: {status.major_upgrade.from} → {status.major_upgrade.to}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      In-place upgrade; a reboot will be required.
                      {status.major_upgrade.guide_url && (
                        <a href={status.major_upgrade.guide_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">
                          Guide <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {severityBadge(status.major_upgrade.severity)}
                  <Button variant="outline" size="sm" onClick={() => apply(["os_major"])} disabled={applying}>Upgrade</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <DownloadCloud className="w-8 h-8 text-primary" /> System Update
      </h1>
      <p className="text-muted-foreground mt-1">Keep Airwaves OS, the control panel, and the base system current.</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm mt-0.5 truncate" title={value}>{value}</div>
    </div>
  );
}

function ComponentRow({ c, applying, onUpdate }: { c: ComponentUpdate; applying: boolean; onUpdate: () => void }) {
  const meta = COMPONENT_LABELS[c.name] ?? { label: c.name, icon: Boxes };
  const Icon = meta.icon;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <div className="font-medium text-sm">{meta.label}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {c.installed} <span className="mx-1">→</span> <span className="text-foreground">{c.available}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {severityBadge(c.severity)}
        <Button variant="outline" size="sm" onClick={onUpdate} disabled={applying}>Update</Button>
      </div>
    </div>
  );
}

export { severityBadge };
