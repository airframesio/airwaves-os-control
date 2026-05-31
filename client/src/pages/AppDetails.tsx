import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Download, Globe, Box, Cpu, Network, CheckCircle2, ExternalLink,
  Trash2, Loader2, Radio, Plane, Ship, Satellite, Waves, BarChart3, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNodeStore } from "@/lib/nodeStore";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useToast } from "@/hooks/use-toast";
import {
  useAppCatalog, useContainers, useInstallApp, useUninstallApp,
} from "@/hooks/useAirwavesApi";
import AppInstallWizard from "@/components/AppInstallWizard";
import type { CatalogApp } from "@/lib/api";

const appIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ultrafeeder: Plane, readsb: Plane, acarsdec: Radio, dumpvdl2: Waves,
  dumphfdl: Satellite, "acars-router": Waves, "ais-catcher": Ship,
  "rtl-airband": Radio, "rtl-433": Waves, satdump: Satellite, dump978: Plane,
  acarshub: BarChart3, tar1090: Map, shipfeeder: Ship, graphs1090: BarChart3,
};

export default function AppDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const apiAvailable = useApiStatus();

  const { data: catalog } = useAppCatalog();
  const { data: containers } = useContainers();
  const installMutation = useInstallApp();
  const uninstallMutation = useUninstallApp();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Mock fallback so the page still renders without a device.
  const { data: nodeData } = useNodeStore();

  const catalogApp = catalog?.find(a => a.id === id);
  const mockApp = nodeData.apps.find((a: any) => a.id === id);

  if (!catalogApp && !mockApp) {
    return (
      <div className="space-y-6">
        <Link href="/store"><Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Back to App Catalog</Button></Link>
        <Card><CardContent className="py-16 text-center text-muted-foreground">App not found.</CardContent></Card>
      </div>
    );
  }

  const app = {
    id: id!,
    name: catalogApp?.name ?? mockApp?.name ?? id!,
    description: catalogApp?.description ?? mockApp?.description ?? "",
    category: catalogApp?.category ?? "app",
    image: catalogApp?.image ?? "",
    version: catalogApp?.version ?? "latest",
    requiresSdr: catalogApp?.requires_sdr ?? false,
    sdrTypes: catalogApp?.sdr_types ?? [],
    ports: catalogApp?.ports ?? [],
  };

  const containerName = `airwaves-${app.id}`;
  const container = containers?.find(c => c.name.replace(/^\//, "") === containerName);
  const installed = !!container;
  const running = container?.state === "running";
  const Icon = appIcons[app.id] ?? Box;

  // The first published host port gives us a link to the app's own web UI.
  const webPort = app.ports.find(p => p.host_port)?.host_port;
  const webUrl = webPort ? `${window.location.protocol}//${window.location.hostname}:${webPort}` : null;

  const installing = installMutation.isPending;
  const uninstalling = uninstallMutation.isPending;

  // Open the configuration wizard before installing, so the app is configurable
  // (SDR, frequencies, etc.) when added — matching the App Catalog flow. If the
  // full catalog entry isn't loaded (offline/mock), install directly.
  const handleInstall = () => {
    if (catalogApp) {
      setWizardOpen(true);
    } else {
      installMutation.mutate({ appId: app.id }, {
        onSuccess: () => toast({ title: "Installing", description: `${app.name} is being installed.` }),
        onError: (e) => toast({ title: "Install failed", description: String(e), variant: "destructive" }),
      });
    }
  };

  const confirmInstall = (env: Record<string, string>) => {
    installMutation.mutate({ appId: app.id, env }, {
      onSuccess: () => { setWizardOpen(false); toast({ title: "Installing", description: `${app.name} is being installed.` }); },
      onError: (e) => toast({ title: "Install failed", description: String(e), variant: "destructive" }),
    });
  };

  const handleUninstall = () => {
    if (!window.confirm(`Uninstall ${app.name}? This removes its container.`)) return;
    uninstallMutation.mutate(app.id, {
      onSuccess: () => toast({ title: "Uninstalled", description: `${app.name} was removed.` }),
      onError: (e) => toast({ title: "Uninstall failed", description: String(e), variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/store">
        <Button variant="ghost" className="-ml-2"><ArrowLeft className="w-4 h-4 mr-2" />Back to App Catalog</Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
            {installed && (
              <Badge variant="secondary" className={cn(
                running ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {running ? "Running" : "Stopped"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground capitalize mt-1">{app.category} · {app.version}</p>
          <p className="text-base text-muted-foreground mt-3 max-w-2xl">{app.description}</p>

          <div className="flex items-center gap-3 mt-5">
            {!installed ? (
              <Button onClick={handleInstall} disabled={!apiAvailable || installing}>
                {installing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Installing…</> : <><Download className="w-4 h-4 mr-2" />Install App</>}
              </Button>
            ) : (
              <>
                {webUrl && (
                  <a href={webUrl} target="_blank" rel="noreferrer">
                    <Button><ExternalLink className="w-4 h-4 mr-2" />Open App</Button>
                  </a>
                )}
                <Button variant="outline" onClick={() => setLocation("/apps")}>Manage</Button>
                <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={handleUninstall} disabled={uninstalling}>
                  {uninstalling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Uninstall
                </Button>
              </>
            )}
            {!apiAvailable && (
              <span className="text-xs text-muted-foreground">Connect to a device to install apps.</span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50">
          <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">{app.description}</p>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-xs break-all">{app.image || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader><CardTitle className="text-lg">Requirements</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Cpu} label="SDR required" value={app.requiresSdr ? "Yes" : "No"} />
            {app.requiresSdr && app.sdrTypes.length > 0 && (
              <Row icon={Radio} label="SDR types" value={app.sdrTypes.join(", ")} />
            )}
            <Row
              icon={Network}
              label="Ports"
              value={app.ports.length ? app.ports.map(p => p.host_port ? `${p.host_port}→${p.container_port}` : `${p.container_port}`).join(", ") : "none"}
            />
            {webUrl && (
              <a href={webUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary text-xs">
                <Globe className="w-4 h-4" /> {webUrl} <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {installed && (
              <div className="flex items-center gap-2 text-emerald-500 text-xs pt-1">
                <CheckCircle2 className="w-4 h-4" /> Installed{running ? " and running" : ""}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AppInstallWizard
        app={catalogApp as CatalogApp | null}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        installing={installing}
        onConfirm={confirmInstall}
      />
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-2"><Icon className="w-4 h-4" />{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
