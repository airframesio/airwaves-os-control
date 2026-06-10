import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  ArrowRight,
  LayoutGrid,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useNodeStore } from "@/lib/nodeStore";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  useAppCatalog,
  useContainers,
  useInstallApp,
  useUpsertFeed,
} from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import { demoModeEnabled } from "@/lib/demoMode";
import AppInstallWizard from "@/components/AppInstallWizard";
import type { CatalogApp, FeedConfig } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AppCatalogIcon } from "@/components/AppCatalogIcon";

type CatalogListApp = {
  id: string;
  name: string;
  description: string;
  category: string;
  installed: boolean;
  status?: string;
  bundledFeatures?: CatalogApp["bundled_features"];
  valuePage?: CatalogApp["value_page"];
};

function appIdAliases(id: string) {
  const normalized = id.replace(/^\//, "").replace(/^airwaves-/, "");
  return [normalized, normalized.replace("_", "-")];
}

function appFeatureBadges(app: CatalogListApp) {
  const badges =
    app.bundledFeatures?.map((feature) => ({
      key: feature.id,
      label: feature.label,
      isPage: feature.kind === "control_page",
      path: feature.path,
    })) ?? [];

  if (
    app.valuePage &&
    !badges.some((badge) => badge.path === app.valuePage?.path)
  ) {
    badges.push({
      key: app.valuePage.path,
      label: app.valuePage.label,
      isPage: true,
      path: app.valuePage.path,
    });
  }

  return badges;
}

export default function AppStore() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { data, activeNode } = useNodeStore();

  // Real API data
  const apiAvailable = useApiStatus();
  const { data: catalogApps } = useAppCatalog();
  const { data: containers } = useContainers();
  const installMutation = useInstallApp();
  const upsertFeed = useUpsertFeed();
  const { toast } = useToast();

  // App being configured in the pre-install wizard (null = closed).
  const [wizardApp, setWizardApp] = useState<CatalogApp | null>(null);

  const doInstall = (
    app: { id: string; name: string },
    env?: Record<string, string>,
    imageTag?: string,
    feed?: FeedConfig,
  ) => {
    installMutation.mutate(
      { appId: app.id, env, imageTag },
      {
        onSuccess: () => {
          if (feed) {
            upsertFeed.mutate(feed, {
              onError: (err) =>
                toast({
                  title: "Feed setup failed",
                  description: String(err),
                  variant: "destructive",
                }),
            });
          }
          setWizardApp(null);
          toast({
            title: "App installed",
            description: feed
              ? `${app.name} is ready and the feed was queued.`
              : `${app.name} is ready.`,
          });
        },
        onError: (err) =>
          toast({
            title: "Install failed",
            description: String(err),
            variant: "destructive",
          }),
      },
    );
  };

  // Apps that need configuration (declared fields, or an SDR) open a wizard
  // before install; everything else installs directly.
  const startInstall = (appId: string) => {
    const full = (catalogApps ?? []).find((a) => a.id === appId);
    // Always open the configuration wizard so every app is configurable before
    // it's added. The wizard renders an "Install" button even when an app has
    // no config_fields, so a no-options app still gets a confirm step rather
    // than installing blind. Fall back to a direct install only if the full
    // catalog entry isn't available (e.g. mock/offline).
    if (full) {
      setWizardApp(full);
    } else {
      installMutation.mutate({ appId });
    }
  };

  // Determine installed container names
  const installedNames = new Set(
    (containers ?? []).flatMap((container) => appIdAliases(container.name)),
  );

  // Build the app list: use catalog API when available, or demo fixtures only
  // for explicitly configured example deployments.
  const apps: CatalogListApp[] =
    catalogApps
      ? catalogApps.map((app) => ({
          id: app.id,
          name: app.name,
          description: app.description,
          category: app.category,
          bundledFeatures: app.bundled_features ?? [],
          valuePage: app.value_page,
          installed: appIdAliases(app.id).some((id) => installedNames.has(id)),
          status:
            installMutation.isPending &&
            installMutation.variables?.appId === app.id
              ? ("installing" as const)
              : ("running" as const),
        }))
      : demoModeEnabled
        ? data.apps.map((app) => ({
            ...app,
            bundledFeatures: app.bundledFeatures ?? [],
            valuePage: app.valuePage,
          }))
        : [];

  const categories = [
    "All",
    ...Array.from(new Set(apps.map((app) => app.category))).filter(Boolean),
  ];
  const installedCount = apps.filter((app) => app.installed).length;
  const signalAppCount = apps.filter((app) => {
    const category = app.category.toLowerCase();
    return ["decoder", "aviation", "maritime", "satcom"].some((kind) =>
      category.includes(kind),
    );
  }).length;

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      app.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card/75 shadow-sm">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,transparent_0%,hsl(var(--primary))_45%,transparent_78%)]" />
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent_0_18px,hsl(var(--border))_18px_19px)]" />
        <div className="relative flex flex-col gap-6 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Curated SDR catalog
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              App Catalog
            </h1>
            <p className="mt-2 max-w-2xl text-base text-foreground/70">
              Install decoders, feeds, maps, and signal tools on{" "}
              {activeNode.name}.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[22rem]">
            <CatalogStat label="Apps" value={apps.length} />
            <CatalogStat label="Installed" value={installedCount} />
            <CatalogStat label="Signal apps" value={signalAppCount} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            defaultValue="All"
            className="w-full lg:w-auto"
            onValueChange={setActiveCategory}
          >
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 border-b-0 bg-transparent p-0">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-md border border-border/60 px-3.5 py-2 text-sm capitalize transition-all hover:bg-muted/60 data-[state=active]:border-primary/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search apps"
              className="h-11 rounded-md bg-card/70 pl-10 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="group relative isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/55 hover:shadow-xl hover:shadow-primary/10"
              onClick={() => setLocation(`/store/${app.id}`)}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-amber-300 opacity-70" />
              <div className="flex h-full flex-col p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <AppCatalogIcon
                    appId={app.id}
                    className="h-16 w-16 transition-transform duration-300 group-hover:scale-105"
                  />
                  {app.installed ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Installed
                    </Badge>
                  ) : app.status === "installing" ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-500 flex gap-1"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" /> Installing
                    </Badge>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                      disabled={!apiAvailable || installMutation.isPending}
                      title={
                        apiAvailable
                          ? "Install"
                          : "Connect to a device to install"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        startInstall(app.id);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="mb-2">
                  <h3 className="text-lg font-bold leading-tight transition-colors group-hover:text-primary">
                    {app.name}
                  </h3>
                  <p className="text-xs font-semibold text-primary/80 capitalize mt-1">
                    {app.category}
                  </p>
                </div>

                {appFeatureBadges(app).length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {appFeatureBadges(app).map((feature) => (
                      <Badge
                        key={feature.key}
                        variant="outline"
                        className="border-primary/30 bg-primary/5 text-[0.68rem] text-primary"
                      >
                        Adds {feature.label}
                        {feature.isPage ? " page" : ""}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-foreground/65 line-clamp-3 mb-4 flex-1">
                  {app.description}
                </p>

                <div className="mt-auto flex items-center text-xs font-semibold text-primary opacity-0 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100">
                  {app.installed ? "Manage App" : "Click to Install"}{" "}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No apps found</p>
            <p className="text-sm">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      <AppInstallWizard
        app={wizardApp}
        open={wizardApp !== null}
        onOpenChange={(v) => {
          if (!v) setWizardApp(null);
        }}
        installing={
          installMutation.isPending &&
          installMutation.variables?.appId === wizardApp?.id
        }
        onConfirm={(env, imageTag, feed) =>
          wizardApp && doInstall(wizardApp, env, imageTag, feed)
        }
      />
    </div>
  );
}

function CatalogStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/35 px-3 py-2">
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[0.68rem] font-medium uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
