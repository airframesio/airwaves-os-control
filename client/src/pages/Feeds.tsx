import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowUpRight,
  Globe,
  Plus,
  Trash2,
  Server,
  Radio,
  Network,
  Settings,
  Edit,
  Plane,
  Ship,
  Check,
  Cast,
  Zap,
  Activity,
  Info,
  BarChart3,
} from "lucide-react";
import { mockFeeds, mockApps } from "@/lib/mockData";
import { demoModeEnabled } from "@/lib/demoMode";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  useAppCatalog,
  useContainers,
  useFeeds,
  useUpsertFeed,
  useDeleteFeed,
} from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import DemoBadge from "@/components/DemoBadge";
import { LiveDataErrorNotice, EmptyState } from "@/components/DataStates";
import { ListItemSkeleton } from "@/components/LoadingSkeleton";

const getFeedTypeDetails = (type: string) => {
  switch (type) {
    case "dedicated_app":
      return {
        label: "Dedicated App",
        icon: Server,
        variant: "default" as const,
        actionLabel: "Manage App",
        bgClass: "bg-primary/5 border-primary/20",
      };
    case "integrated_option":
      return {
        label: "Integrated",
        icon: Radio,
        variant: "secondary" as const,
        actionLabel: "Configure",
        bgClass: "bg-secondary/10 border-secondary/20",
      };
    case "raw_stream":
      return {
        label: "Raw Stream",
        icon: Network,
        variant: "outline" as const,
        actionLabel: "Edit Connection",
        bgClass: "bg-muted/30 border-border/50",
      };
    case "audio_stream":
      return {
        label: "Audio Stream",
        icon: Cast,
        variant: "secondary" as const,
        actionLabel: "Manage Stream",
        bgClass: "bg-blue-500/5 border-blue-500/10",
      };
    default:
      return {
        label: "Unknown",
        icon: Globe,
        variant: "secondary" as const,
        actionLabel: "Manage",
        bgClass: "bg-muted",
      };
  }
};

const aggregators = [
  {
    id: "fr24",
    name: "FlightRadar24",
    icon: Plane,
    type: "dedicated",
    fixedDest: true,
    description: "World's most popular flight tracker.",
    categories: ["aviation"],
  },
  {
    id: "fa",
    name: "FlightAware",
    icon: Plane,
    type: "dedicated",
    fixedDest: true,
    description: "Global aviation software and data services.",
    categories: ["aviation"],
  },
  {
    id: "airframes",
    name: "Airframes.io",
    icon: Plane,
    type: "connector",
    fixedDest: false,
    defaultDest: "feed.airframes.io:5550",
    description: "Open protocol aviation data aggregator.",
    categories: ["aviation"],
  },
  {
    id: "planewatch",
    name: "Plane.Watch",
    icon: Plane,
    type: "dedicated",
    fixedDest: true,
    description: "Community flight tracking network with MLAT.",
    categories: ["aviation"],
  },
  {
    id: "mt",
    name: "MarineTraffic",
    icon: Ship,
    type: "connector",
    fixedDest: false,
    defaultDest: "5.9.207.224:5321",
    description: "Global ship tracking intelligence.",
    categories: ["maritime"],
  },
  {
    id: "custom",
    name: "Custom Destination",
    icon: Network,
    type: "raw",
    fixedDest: false,
    description: "Send raw data to a custom IP and port.",
    categories: ["aviation", "maritime", "system", "utility", "satcom"],
  },
];

const feedCategoryFor = (id: string, category: string) => {
  if (id.includes("ais") || id.includes("ship")) return "maritime";
  if (id.includes("sat")) return "satcom";
  if (id.includes("rtl-433") || id.includes("rtl_433")) return "utility";
  if (
    category === "decoder" ||
    category === "visualization" ||
    category === "feeder"
  )
    return "aviation";
  return category;
};

export default function Feeds() {
  const apiAvailable = useApiStatus();
  const { data: liveFeeds, isLoading: feedsLoading, isError: feedsError, refetch: refetchFeeds } = useFeeds();
  const { data: catalogApps } = useAppCatalog();
  const { data: containers } = useContainers();
  const upsertFeed = useUpsertFeed();
  const deleteFeedMutation = useDeleteFeed();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAggregator, setSelectedAggregator] =
    useState<string>("custom");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [protocol, setProtocol] = useState<"tcp" | "udp">("tcp");

  const installedIds = new Set(
    (containers ?? []).map((c) =>
      c.name.replace(/^airwaves-/, "").replace(/^\//, ""),
    ),
  );
  const liveSourceApps = (catalogApps ?? [])
    .filter(
      (app) =>
        installedIds.has(app.id) || installedIds.has(app.id.replace("-", "_")),
    )
    .filter((app) =>
      (app.outputs ?? []).some((output) =>
        ["messages", "tracking", "audio", "raw"].includes(output.kind),
      ),
    )
    .map((app) => ({
      id: app.id,
      name: app.name,
      category: feedCategoryFor(app.id, app.category),
      hasOutput: true,
    }));
  const sourceApps =
    liveSourceApps.length > 0
      ? liveSourceApps
      : demoModeEnabled
        ? mockApps.filter((app) => app.hasOutput)
        : [];
  const selectedApp = sourceApps.find((app) => app.id === selectedSource);
  const activeAggregator = aggregators.find((a) => a.id === selectedAggregator);

  // Map live feeds into the format the UI expects, fall back to mock
  const feeds =
    liveFeeds
      ? liveFeeds.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.feed_type as any,
          protocol: f.protocol as any,
          host: f.host,
          destination: f.host,
          port: f.port,
          status: f.enabled
            ? ("connected" as const)
            : ("disconnected" as const),
          messageRate: 0,
          bandwidth: 0,
          appId: f.app_id ?? "",
        }))
      : demoModeEnabled
        ? mockFeeds
        : [];


  // Filter aggregators based on selected app category
  const availableAggregators = selectedApp
    ? aggregators.filter((agg) => agg.categories.includes(selectedApp.category))
    : aggregators;

  const handleSourceChange = (appId: string) => {
    setSelectedSource(appId);
    const app = sourceApps.find((a) => a.id === appId);

    // Reset aggregator selection if current one is not valid for new app
    if (app) {
      const validAggregators = aggregators.filter((agg) =>
        agg.categories.includes(app.category),
      );
      if (!validAggregators.find((a) => a.id === selectedAggregator)) {
        // Default to the first dedicated/connector option if available, otherwise custom
        const defaultAgg =
          validAggregators.find((a) => a.type !== "raw") || validAggregators[0];
        if (defaultAgg) {
          handleAggregatorChange(defaultAgg.id);
        }
      }
    }
  };

  const handleAggregatorChange = (id: string) => {
    setSelectedAggregator(id);
    const agg = aggregators.find((a) => a.id === id);
    if (agg) {
      if (agg.defaultDest) {
        const [h, p] = agg.defaultDest.split(":");
        setHost(h);
        setPort(p);
      } else {
        setHost("");
        setPort("");
      }
      setProtocol(agg.id === "mt" || agg.id === "custom" ? "udp" : "tcp");
    }
  };

  const handleCreateFeed = () => {
    if (!selectedSource || !activeAggregator) return;
    const fixed = activeAggregator.fixedDest;
    const nextHost = fixed ? activeAggregator.id : host.trim();
    const nextPort = fixed ? 0 : Number(port);
    if (!fixed && (!nextHost || !nextPort)) return;

    upsertFeed.mutate(
      {
        id: `${selectedSource}-${activeAggregator.id}`,
        name: `${selectedApp?.name ?? selectedSource} to ${activeAggregator.name}`,
        feed_type:
          activeAggregator.type === "raw"
            ? "raw_stream"
            : activeAggregator.type === "dedicated"
              ? "dedicated_app"
              : "integrated_option",
        protocol,
        host: nextHost,
        port: nextPort,
        enabled: true,
        app_id: selectedSource,
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          setSelectedSource("");
          setHost("");
          setPort("");
        },
      },
    );
  };

  // Stats calculation
  const totalFeeds = feeds.length;
  const activeFeeds = feeds.filter((f) => f.status === "connected").length;
  const totalRate = feeds.reduce((acc, f) => acc + (f.messageRate || 0), 0);
  const totalBandwidth = feeds.reduce(
    (acc, f) => acc + ((f as any).bandwidth || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">Data Feeds <DemoBadge show={demoModeEnabled && !apiAvailable} /></h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Manage connections to external data aggregators and streams. Connect
            your local receivers to global networks like FlightRadar24 and
            Airframes.io.
          </p>
        </div>

        <div className="flex gap-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-md">
                <Plus className="w-5 h-5" /> New Feed
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Data Feed</DialogTitle>
                <DialogDescription>
                  Configure a new data stream from your receivers to an external
                  destination.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Source Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    1. Select Data Source
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      value={selectedSource}
                      onValueChange={handleSourceChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a running application..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceApps.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            <div className="flex items-center gap-2">
                              {/* Icon rendering is tricky in SelectItem without the component instance, but we can use text */}
                              <span className="font-medium">{app.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({app.category})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground flex items-center h-full">
                      Choose which application's data output you want to share.
                    </p>
                  </div>
                </div>

                {/* Destination Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    2. Select Destination
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableAggregators.map((agg) => {
                      const Icon = agg.icon;
                      return (
                        <div
                          key={agg.id}
                          className={cn(
                            "cursor-pointer rounded-lg border p-4 hover:border-primary transition-all relative",
                            selectedAggregator === agg.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card",
                          )}
                          onClick={() => handleAggregatorChange(agg.id)}
                        >
                          {selectedAggregator === agg.id && (
                            <div className="absolute top-2 right-2 text-primary">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          <Icon className="w-6 h-6 mb-2 text-muted-foreground" />
                          <div className="font-medium text-sm">{agg.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {agg.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Configuration Fields */}
                <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
                    Configuration
                  </h3>

                  {activeAggregator?.fixedDest ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-500">
                      <Server className="w-4 h-4" />
                      <div>
                        This feed uses a <strong>dedicated client</strong>. The
                        destination is managed automatically by the{" "}
                        {activeAggregator.name} software.
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Destination Host / IP</Label>
                        <Input
                          value={host}
                          onChange={(e) => setHost(e.target.value)}
                          placeholder="e.g. 1.2.3.4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input
                          value={port}
                          onChange={(e) => setPort(e.target.value)}
                          placeholder="e.g. 30005"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional fields based on type */}
                  {activeAggregator?.id === "fr24" && (
                    <div className="space-y-2">
                      <Label>Sharing Key</Label>
                      <Input placeholder="Enter your FR24 sharing key..." />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to register a new key.
                      </p>
                    </div>
                  )}

                  {!activeAggregator?.fixedDest && (
                    <div className="space-y-2">
                      <Label>Protocol</Label>
                      <RadioGroup
                        value={protocol}
                        onValueChange={(v) => setProtocol(v as "tcp" | "udp")}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tcp" id="tcp" />
                          <Label htmlFor="tcp">TCP</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="udp" id="udp" />
                          <Label htmlFor="udp">UDP</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFeed}
                  disabled={
                    upsertFeed.isPending ||
                    !selectedSource ||
                    (!activeAggregator?.fixedDest &&
                      (!host.trim() || !port.trim()))
                  }
                >
                  {upsertFeed.isPending ? "Creating..." : "Create Feed"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Feeds
              </p>
              <p className="text-2xl font-bold">{totalFeeds}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Network className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Active Connections
              </p>
              <p className="text-2xl font-bold">{activeFeeds}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Rate
              </p>
              <p className="text-2xl font-bold font-mono">
                {totalRate}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  msg/min
                </span>
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Total Bandwidth
              </p>
              <p className="text-2xl font-bold font-mono">
                {totalBandwidth.toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  kbps
                </span>
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Active Configurations
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
          >
            <Settings className="w-4 h-4" /> Manage Defaults
          </Button>
        </div>

        {apiAvailable && feedsError && (
          <LiveDataErrorNotice
            message="Couldn't load feeds from the device."
            onRetry={() => refetchFeeds()}
          />
        )}

        {apiAvailable && feedsLoading && (
          <div className="space-y-3">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        )}

        {!feedsLoading && feeds.length === 0 && (
          <EmptyState
            icon={ArrowUpRight}
            title="No feeds configured"
            description="Connect your receivers to aggregators like Airframes.io or FlightRadar24 by adding your first feed."
            action={
              <Button className="gap-2 mt-1" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4" /> Add Feed
              </Button>
            }
          />
        )}

        {feeds.map((feed) => {
          const typeDetails = getFeedTypeDetails(feed.type);
          const Icon = typeDetails.icon;

          return (
            <Card
              key={feed.id}
              className={cn(
                "flex flex-col md:flex-row items-stretch p-0 overflow-hidden border-border/60 transition-all hover:border-primary/50",
                typeDetails.bgClass,
              )}
            >
              {/* Left Stripe for visual categorization */}
              <div
                className={cn(
                  "w-1.5 md:h-auto h-1.5 shrink-0",
                  feed.status === "connected"
                    ? "bg-green-500"
                    : "bg-destructive",
                )}
              ></div>

              <div className="flex-1 p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-lg">{feed.name}</h3>
                    <Badge
                      variant={
                        feed.status === "connected" ? "default" : "destructive"
                      }
                      className={cn(
                        "shadow-none",
                        feed.status === "connected"
                          ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20"
                          : "",
                      )}
                    >
                      {feed.status}
                    </Badge>
                    <Badge
                      variant={typeDetails.variant}
                      className="gap-1 pl-1.5 font-normal bg-background/50 border-border/50"
                    >
                      <Icon className="w-3 h-3" />
                      {typeDetails.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Globe className="w-3.5 h-3.5" />
                      {(feed as any).destination ?? (feed as any).host}:
                      {feed.port}
                    </div>
                    <span className="text-border">|</span>
                    <span className="text-xs border border-border px-1.5 py-0.5 rounded bg-background/50 font-mono uppercase">
                      {feed.protocol}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center border-t md:border-t-0 md:border-l border-border/50 bg-background/30 backdrop-blur-[2px] w-full md:w-auto">
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 mb-4 md:mb-0">
                  <div className="text-center min-w-[70px] md:min-w-[80px]">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Source
                    </div>
                    <div className="font-medium text-sm flex items-center justify-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                      {feed.appId}
                    </div>
                  </div>
                  <div className="text-center min-w-[70px] md:min-w-[80px]">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Rate
                    </div>
                    <div className="font-medium font-mono text-sm flex justify-center">
                      {feed.type === "audio_stream" ? (
                        <span className="flex items-center justify-center gap-1.5 text-green-600">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Live
                        </span>
                      ) : (
                        `${feed.messageRate}/min`
                      )}
                    </div>
                  </div>
                  <div className="text-center min-w-[70px] md:min-w-[80px]">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Upload
                    </div>
                    <div className="font-medium font-mono text-sm">
                      {feed.bandwidth} kbps
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end md:pl-6 md:ml-6 md:border-l border-border/50 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-background/80"
                    title={typeDetails.actionLabel}
                  >
                    {feed.type === "raw_stream" ? (
                      <Edit className="w-4 h-4" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Remove Feed"
                    onClick={() => deleteFeedMutation.mutate(feed.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        <div className="rounded-lg bg-card border border-border p-4 flex gap-3 items-start">
          <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Dedicated Apps</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Standalone feeding software managing its own connection (e.g.
              acarshub).
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-card border border-border p-4 flex gap-3 items-start">
          <div className="p-2 bg-secondary/20 rounded-md text-foreground shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Integrated Options</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Directly built-in feeding capabilities of decoders (e.g. readsb,
              dump1090).
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-card border border-border p-4 flex gap-3 items-start">
          <div className="p-2 bg-muted rounded-md text-foreground shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Raw Streams</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Simple TCP/UDP raw data streams to a specific IP:Port destination.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-card border border-border p-4 flex gap-3 items-start">
          <div className="p-2 bg-blue-500/10 rounded-md text-blue-500 shrink-0">
            <Cast className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Audio Streams</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Icecast mount points for live audio monitoring from radio
              receivers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
