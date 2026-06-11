import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Globe,
  Box,
  Cpu,
  Network,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Loader2,
  Radio,
  Cable,
  ListChecks,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNodeStore } from "@/lib/nodeStore";
import { demoModeEnabled } from "@/lib/demoMode";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useToast } from "@/hooks/use-toast";
import {
  useAppCatalog,
  useContainers,
  useInstallApp,
  useUninstallApp,
  useUpsertFeed,
} from "@/hooks/useAirwavesApi";
import AppInstallWizard from "@/components/AppInstallWizard";
import type { CatalogApp, FeedConfig } from "@/lib/api";
import { AppCatalogIcon } from "@/components/AppCatalogIcon";

function normalizeAppId(id: string) {
  return id
    .replace(/^\//, "")
    .replace(/^airwaves-/, "")
    .replace("_", "-");
}

export default function AppDetails() {
  const { id } = useParams();
  const routeAppId = id ?? "";
  const normalizedRouteAppId = normalizeAppId(routeAppId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const apiAvailable = useApiStatus();

  const { data: catalog } = useAppCatalog();
  const { data: containers } = useContainers();
  const installMutation = useInstallApp();
  const uninstallMutation = useUninstallApp();
  const upsertFeed = useUpsertFeed();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: nodeData } = useNodeStore();

  const catalogApp = catalog?.find(
    (a) => normalizeAppId(a.id) === normalizedRouteAppId,
  );
  const mockApp = demoModeEnabled
    ? nodeData.apps.find((a: any) => normalizeAppId(a.id) === normalizedRouteAppId)
    : undefined;

  if (!catalogApp && !mockApp) {
    return (
      <div className="space-y-6">
        <Link href="/store">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App Catalog
          </Button>
        </Link>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            App not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const app = {
    id: catalogApp?.id ?? mockApp?.id ?? routeAppId,
    name: catalogApp?.name ?? mockApp?.name ?? routeAppId,
    description: catalogApp?.description ?? mockApp?.description ?? "",
    category: catalogApp?.category ?? mockApp?.category ?? "app",
    image: catalogApp?.image ?? "",
    version: catalogApp?.version ?? "latest",
    requiresSdr: catalogApp?.requires_sdr ?? false,
    sdrTypes: catalogApp?.sdr_types ?? [],
    ports: catalogApp?.ports ?? [],
    longDescription:
      catalogApp?.long_description ??
      mockApp?.longDescription ??
      catalogApp?.description ??
      mockApp?.description ??
      "",
    outputs: catalogApp?.outputs ?? mockApp?.outputs ?? [],
    suggestedFeeds: catalogApp?.suggested_feeds ?? mockApp?.suggestedFeeds ?? [],
    installNotes: catalogApp?.install_notes ?? mockApp?.installNotes ?? [],
    links: catalogApp?.links ?? mockApp?.links ?? [],
    valuePage: catalogApp?.value_page ?? mockApp?.valuePage,
    bundledFeatures: catalogApp?.bundled_features ?? mockApp?.bundledFeatures ?? [],
    configFields: catalogApp?.config_fields ?? mockApp?.configFields ?? [],
    env: catalogApp?.env ?? mockApp?.env ?? {},
  };

  const container = containers?.find(
    (c) => normalizeAppId(c.name) === normalizeAppId(app.id),
  );
  const installed = container ? true : demoModeEnabled && !!mockApp?.installed;
  const running = container?.state === "running";

  // The first published host port gives us a link to the app's own web UI.
  const webPort = app.ports.find((p) => p.host_port)?.host_port;
  const webUrl = webPort
    ? `${window.location.protocol}//${window.location.hostname}:${webPort}`
    : null;

  const installing = installMutation.isPending;
  const uninstalling = uninstallMutation.isPending;

  // Open the configuration wizard before installing, so the app is configurable
  // (SDR, frequencies, etc.) when added — matching the App Catalog flow. If the
  // full catalog entry isn't loaded (offline/mock), install directly.
  const handleInstall = () => {
    if (catalogApp) {
      setWizardOpen(true);
    } else {
      installMutation.mutate(
        { appId: app.id },
        {
          onSuccess: () =>
            toast({
              title: "Installing",
              description: `${app.name} is being installed.`,
            }),
          onError: (e) =>
            toast({
              title: "Install failed",
              description: String(e),
              variant: "destructive",
            }),
        },
      );
    }
  };

  const confirmInstall = (
    env: Record<string, string>,
    imageTag: string,
    feed?: FeedConfig,
  ) => {
    installMutation.mutate(
      { appId: app.id, env, imageTag },
      {
        onSuccess: () => {
          if (feed) {
            upsertFeed.mutate(feed, {
              onError: (e) =>
                toast({
                  title: "Feed setup failed",
                  description: String(e),
                  variant: "destructive",
                }),
            });
          }
          setWizardOpen(false);
          toast({
            title: "Installing",
            description: feed
              ? `${app.name} is being installed and the feed was queued.`
              : `${app.name} is being installed.`,
          });
        },
        onError: (e) =>
          toast({
            title: "Install failed",
            description: String(e),
            variant: "destructive",
          }),
      },
    );
  };

  const handleUninstall = () => {
    if (!window.confirm(`Uninstall ${app.name}? This removes its container.`))
      return;
    uninstallMutation.mutate(app.id, {
      onSuccess: () =>
        toast({
          title: "Uninstalled",
          description: `${app.name} was removed.`,
        }),
      onError: (e) =>
        toast({
          title: "Uninstall failed",
          description: String(e),
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/store">
        <Button variant="ghost" className="-ml-2 rounded-md">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App Catalog
        </Button>
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card/75 p-5 shadow-sm">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent_0%,hsl(var(--primary))_48%,transparent_82%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          <AppCatalogIcon
            appId={app.id}
            className="h-24 w-24 rounded-[1.45rem]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
              {installed && (
                <Badge
                  variant="secondary"
                  className={cn(
                    running
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {running ? "Running" : "Stopped"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {app.category} · {app.version}
            </p>
            <p className="text-base text-foreground/70 mt-3 max-w-2xl">
              {app.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              {!installed ? (
                <Button
                  onClick={handleInstall}
                  disabled={!apiAvailable || installing}
                >
                  {installing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {webUrl && (
                    <a href={webUrl} target="_blank" rel="noreferrer">
                      <Button>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open App
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/apps")}
                  >
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleUninstall}
                    disabled={uninstalling}
                  >
                    {uninstalling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Uninstall
                  </Button>
                </>
              )}
              {!apiAvailable && (
                <span className="text-xs text-muted-foreground">
                  Connect to a device to install apps.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              {app.longDescription || app.description}
            </p>
            {app.outputs.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {app.outputs.map((output) => (
                  <div
                    key={`${output.kind}-${output.label}`}
                    className="rounded-md border border-border/60 bg-background/35 p-3"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <MessageSquareText className="h-4 w-4 text-primary" />
                      {output.label}
                    </div>
                    {output.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {output.description}
                      </p>
                    )}
                    {output.port && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {output.protocol ?? "tcp"}:{output.port}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {app.bundledFeatures.length > 0 && (
              <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
                <div className="text-sm font-semibold text-primary">
                  Bundled Airwaves OS features
                </div>
                <div className="mt-2 grid gap-2">
                  {app.bundledFeatures.map((feature) => (
                    <div key={feature.id} className="text-sm">
                      <span className="font-medium">{feature.label}</span>
                      {feature.description && (
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-xs break-all">
                {app.image || "—"}
              </span>
            </div>
            {app.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {app.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary inline-flex items-center gap-1"
                  >
                    {link.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              icon={Cpu}
              label="SDR required"
              value={app.requiresSdr ? "Yes" : "No"}
            />
            {app.requiresSdr && app.sdrTypes.length > 0 && (
              <Row
                icon={Radio}
                label="SDR types"
                value={app.sdrTypes.join(", ")}
              />
            )}
            <Row
              icon={Network}
              label="Ports"
              value={
                app.ports.length
                  ? app.ports
                      .map((p) =>
                        p.host_port
                          ? `${p.host_port}→${p.container_port}`
                          : `${p.container_port}`,
                      )
                      .join(", ")
                  : "none"
              }
            />
            <Row
              icon={Cable}
              label="Outputs"
              value={
                app.outputs.length
                  ? app.outputs.map((o) => o.kind).join(", ")
                  : "none"
              }
            />
            <Row
              icon={ListChecks}
              label="Install fields"
              value={
                app.configFields.length
                  ? String(app.configFields.length)
                  : "none"
              }
            />
            {webUrl && (
              <a
                href={webUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-primary text-xs"
              >
                <Globe className="w-4 h-4" /> {webUrl}{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {app.valuePage && installed && (
              <button
                onClick={() => setLocation(app.valuePage!.path)}
                className="flex items-center gap-2 text-primary text-xs text-left"
              >
                <Globe className="w-4 h-4" /> Open {app.valuePage.label}
              </button>
            )}
            {installed && (
              <div className="flex items-center gap-2 text-emerald-500 text-xs pt-1">
                <CheckCircle2 className="w-4 h-4" /> Installed
                {running ? " and running" : ""}
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

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
