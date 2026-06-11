import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Play, 
  Square, 
  Terminal, 
  Search, 
  Settings, 
  Trash2, 
  MoreVertical,
  Radio,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Power,
  ArrowLeft,
  Menu,
  Plus,
  Save
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { mockApps } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import AppMetrics from "@/components/AppMetrics";
import { motion, useSpring, useTransform } from "framer-motion";
import { useContainers, useContainerStats, useContainerStart, useContainerStop, useUninstallApp, useContainerLogs } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import DemoBadge from "@/components/DemoBadge";
import { LiveDataErrorNotice } from "@/components/DataStates";
import { ListItemSkeleton } from "@/components/LoadingSkeleton";

const fmtUptime = (createdSec: number): string => {
  if (!createdSec) return "-";
  const s = Math.max(0, Math.floor(Date.now() / 1000) - createdSec);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
};

const AnimatedNumber = ({ value, format = (v: number) => v.toFixed(0) }: { value: number, format?: (v: number) => string }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => format(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

interface ExternalFeed {
  id: string;
  url: string;
  interval: number;
  enabled: boolean;
  useProxy: boolean;
}

function ExternalFeedConfig() {
  const [feeds, setFeeds] = useState<ExternalFeed[]>(() => {
    const saved = localStorage.getItem('external_feeds');
    return saved ? JSON.parse(saved) : [
      { id: '1', url: 'http://adsbexchange.local/tar1090/data/aircraft.json', interval: 5, enabled: true, useProxy: false }
    ];
  });
  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem('external_feeds', JSON.stringify(feeds));
    toast({
      title: "Configuration Saved",
      description: "External feed settings have been updated.",
    });
  };

  const addFeed = () => {
    setFeeds([...feeds, { id: Math.random().toString(36).substr(2, 9), url: '', interval: 5, enabled: true, useProxy: true }]);
  };

  const removeFeed = (id: string) => {
    setFeeds(feeds.filter(f => f.id !== id));
  };

  const updateFeed = (id: string, field: keyof ExternalFeed, value: any) => {
    setFeeds(feeds.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-1">External Data Sources</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure external aircraft.json feeds to visualize on the map. 
          <br/>
          <span className="text-amber-500 font-medium text-xs">Note: These sources are strictly for visualization and are never forwarded to aggregators.</span>
        </p>

        <div className="space-y-4">
          {feeds.map((feed) => (
            <div key={feed.id} className="flex flex-col gap-3 p-4 border border-border/50 rounded-lg bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-3 space-y-1">
                       <label className="text-xs font-medium text-muted-foreground">Source URL (aircraft.json)</label>
                       <Input 
                        value={feed.url} 
                        onChange={(e) => updateFeed(feed.id, 'url', e.target.value)}
                        placeholder="http://192.168.1.x/tar1090/data/aircraft.json"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-medium text-muted-foreground">Interval (sec)</label>
                       <Input 
                        type="number"
                        min="1"
                        max="60"
                        value={feed.interval} 
                        onChange={(e) => updateFeed(feed.id, 'interval', parseInt(e.target.value) || 5)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id={`proxy-${feed.id}`}
                      checked={feed.useProxy ?? true}
                      onChange={(e) => updateFeed(feed.id, 'useProxy', e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`proxy-${feed.id}`} className="text-xs text-muted-foreground select-none cursor-pointer">
                      Use CORS Proxy (Required for public external feeds, disable for local network)
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-6">
                   <Button 
                    variant={feed.enabled ? "default" : "secondary"} 
                    size="sm"
                    className={cn("h-9 w-24", feed.enabled ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                    onClick={() => updateFeed(feed.id, 'enabled', !feed.enabled)}
                   >
                     {feed.enabled ? "Enabled" : "Disabled"}
                   </Button>
                   <Button variant="ghost" size="sm" className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFeed(feed.id)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addFeed} className="w-full border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5">
            <Plus className="w-4 h-4 mr-2" /> Add New Source
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}

export default function MyApps() {
  const apiAvailable = useApiStatus();
  const { data: liveContainers, isError: containersError, refetch: refetchContainers } = useContainers();
  const { data: liveStats } = useContainerStats();
  const startMutation = useContainerStart();
  const stopMutation = useContainerStop();
  const uninstallMutation = useUninstallApp();

  // Map live containers to app-like objects when API is available, joined with
  // live per-container CPU/memory stats.
  const statsByName = new Map((liveStats ?? []).map(s => [s.name, s]));
  const statsById = new Map((liveStats ?? []).map(s => [s.id, s]));
  const containerApps = apiAvailable && liveContainers
    ? liveContainers
        .filter(c => c.name.startsWith('airwaves-') && c.name !== 'airwaves-gateway' && c.name !== 'airwaves-manager')
        .map(c => {
          const appId = c.name.replace(/^airwaves-/, '');
          const mockApp = mockApps.find(a => a.id === appId);
          const st = statsByName.get(c.name) ?? statsById.get(c.id.slice(0, 12));
          const memLimitMb = st && st.memory_limit ? Math.round(st.memory_limit / (1024 * 1024)) : 512;
          return {
            ...mockApp,
            id: appId,
            name: mockApp?.name ?? appId,
            description: mockApp?.description ?? c.image,
            status: c.state === 'running' ? 'running' as const : 'stopped' as const,
            installed: true,
            cpuUsage: st ? Math.round(st.cpu_percent) : 0,
            memoryUsage: st ? Math.round(st.memory_used / (1024 * 1024)) : 0,
            memoryLimit: memLimitMb,
            icon: mockApp?.icon ?? Radio,
            category: mockApp?.category ?? 'system',
            version: mockApp?.version ?? 'latest',
            image: c.image,
            ports: c.ports ?? [],
            createdAt: c.created ?? 0,
            uptime: c.state === 'running' ? fmtUptime(c.created ?? 0) : '-',
            containerId: c.id,
          };
        })
    : null;

  const [apps, setApps] = useState(mockApps.filter(app => app.installed));
  // Transitional per-app state ("starting"/"stopping") shown immediately on a
  // toggle and cleared only once the live container state reaches the target,
  // so the button/badge don't flicker back to the old state on the next poll.
  const [pending, setPending] = useState<Record<string, "starting" | "stopping">>({});

  // Sync with live data when available (containers + their stats).
  useEffect(() => {
    if (apiAvailable && containerApps) {
      setApps(containerApps as any);
      // Clear any pending transition that the live data now confirms.
      setPending((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        for (const app of containerApps) {
          const want = prev[app.id];
          if (want === "starting" && app.status === "running") delete next[app.id];
          if (want === "stopping" && app.status === "stopped") delete next[app.id];
        }
        return next;
      });
    }
  }, [liveContainers, liveStats, apiAvailable]);

  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  // We use a custom breakpoint check here because this specific layout 
  // switches to desktop mode at 'lg' (1024px), not the standard mobile breakpoint.
  const [isCompact, setIsCompact] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const checkCompact = () => setIsCompact(window.innerWidth < 1024);
    
    // Initial check
    checkCompact();
    
    // Listen for resize
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);

  const selectedApp = apps.find(app => app.id === selectedAppId);

  // Live container logs for the selected app (polls every 5s when API is up).
  const { data: logData } = useContainerLogs(
    apiAvailable && selectedAppId ? `airwaves-${selectedAppId}` : "",
    300,
  );
  const logLines: string[] = (logData?.logs ?? "")
    .split("\n")
    .map(l => l.replace(/[\x00-\x08]/g, "").trimEnd())
    .filter(l => l.length > 0);

  // Reset showDetail when switching to desktop
  useEffect(() => {
    if (!isCompact) {
      setShowDetail(true);
    } else {
      // On mobile/tablet, if we have a selected app initially, we might not want to show it immediately 
      // unless user navigated there. But for simplicity, let's start with list view 
      // unless specifically requested.
      if (!showDetail) setShowDetail(false); 
    }
  }, [isCompact]);

  // Filter apps based on search
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    if (isCompact) {
      setShowDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowDetail(false);
  };

  const handleUninstall = (appId: string) => {
    if (apiAvailable) {
      uninstallMutation.mutate(appId, {
        onSuccess: () => {
          toast({ title: "App Uninstalled", description: "The application has been removed." });
        },
        onError: (err) => {
          toast({ title: "Uninstall Failed", description: String(err), variant: "destructive" });
        },
      });
    }
    // Optimistic update for UI
    const newApps = apps.filter(a => a.id !== appId);
    setApps(newApps);

    if (newApps.length === 0) {
      setSelectedAppId("");
      setShowDetail(false);
    } else if (selectedAppId === appId) {
      setSelectedAppId(newApps[0].id);
      if (isCompact) setShowDetail(false);
    }
  };

  const toggleAppStatus = (appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    // Ignore taps while a transition is already in flight.
    if (pending[appId]) return;

    const containerName = `airwaves-${appId}`;
    const isRunning = app.status === "running";
    const transition = isRunning ? "stopping" : "starting";

    // Show the transitional state immediately and keep it until the live poll
    // confirms the target state (handled in the sync effect above). Without API
    // we just flip to the final state since there's no live data to reconcile.
    if (apiAvailable) {
      setPending((prev) => ({ ...prev, [appId]: transition }));
      const mutation = isRunning ? stopMutation : startMutation;
      mutation.mutate(containerName, {
        onError: (err) => {
          setPending((prev) => { const n = { ...prev }; delete n[appId]; return n; });
          toast({ title: "Action Failed", description: String(err), variant: "destructive" });
        },
      });
    } else {
      const newStatus = isRunning ? "stopped" : "running";
      setApps(apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    }
  };

  /** Display status including in-flight transitions. */
  const displayStatus = (app: { id: string; status: string }): "running" | "stopped" | "starting" | "stopping" =>
    (pending[app.id] ?? app.status) as "running" | "stopped" | "starting" | "stopping";

  // On a real device, don't show mock apps while containers load (or fail) —
  // show a skeleton or an error with retry instead.
  if (apiAvailable && !liveContainers) {
    return (
      <div className="space-y-4 max-w-xl">
        {containersError ? (
          <LiveDataErrorNotice
            message="Couldn't load installed apps from the device."
            onRetry={() => refetchContainers()}
          />
        ) : (
          <>
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </>
        )}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-3xl bg-card/50">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">No Apps Installed</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          You haven't installed any apps yet. Visit the App Catalog to discover and install radio software.
        </p>
        <Button onClick={() => window.location.href = '/store'}>
          Go to App Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-3rem)] flex flex-col lg:flex-row gap-6 relative">
      {/* Sidebar - App List */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col gap-4 transition-all duration-300 absolute lg:relative inset-0 z-10 bg-background lg:bg-transparent",
        isCompact && showDetail ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
      )}>
        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">My Apps <DemoBadge show={!apiAvailable} /></h1>
          <Badge variant="outline" className="ml-auto">
            {apps.length} Installed
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search installed apps..." 
            className="pl-9 bg-card border-border/60"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 pr-3 -mr-3">
          <div className="space-y-3 pb-4">
            {filteredApps.map(app => (
              <div 
                key={app.id} 
                onClick={() => handleAppSelect(app.id)}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left",
                  selectedAppId === app.id && !isCompact
                    ? "bg-card border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20" 
                    : "bg-card/40 border-border/50 hover:bg-card hover:border-border hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    selectedAppId === app.id && !isCompact ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    <app.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate pr-2">{app.name}</h3>
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        pending[app.id]
                          ? "bg-amber-500 animate-pulse"
                          : app.status === "running"
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                            : "bg-muted-foreground/30"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      {app.status === "running" && (
                        <>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                            <Cpu className="w-3 h-3" /> {app.cpuUsage}%
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                            <Database className="w-3 h-3" /> {app.memoryUsage}MB
                          </div>
                          {app.messageRate !== undefined && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600/80 font-medium">
                              <Activity className="w-3 h-3" /> {app.messageRate}/s
                            </div>
                          )}
                        </>
                      )}
                      {app.status !== "running" && (
                        <div className={cn(
                          "text-[10px] font-medium capitalize",
                          pending[app.id] ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {pending[app.id] ?? "Stopped"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredApps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No apps found matching "{searchQuery}"
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Detail View */}
      <div className={cn(
        "flex-1 flex flex-col bg-card/30 backdrop-blur-sm rounded-3xl border border-border/60 shadow-sm overflow-hidden transition-all duration-300 absolute lg:relative inset-0 z-20 bg-background lg:bg-card/30",
        isCompact && !showDetail ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
      )}>
        {selectedApp ? (
          <>
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-border/40 bg-card/40">
            {isCompact && (
              <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent" onClick={handleBackToList}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Apps
              </Button>
            )}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner shrink-0">
                  <selectedApp.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">{selectedApp.name}</h2>
                    {(() => {
                      const st = displayStatus(selectedApp);
                      const transitioning = st === "starting" || st === "stopping";
                      return (
                        <Badge variant={st === "running" ? "default" : "secondary"} className={cn(
                          "capitalize",
                          st === "running" ? "bg-emerald-500 hover:bg-emerald-600 border-transparent" : ""
                        )}>
                          {transitioning
                            ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            : st === "running" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {st}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="text-muted-foreground max-w-lg mb-4 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                    {selectedApp.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Uptime:</span> {selectedApp.status === "running" ? ((selectedApp as any).uptime ?? "-") : "-"}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                      <Radio className="w-3.5 h-3.5" />
                      {selectedApp.assignedDevice ? selectedApp.assignedDevice : 'No Device'}
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                      v{selectedApp.version}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {(() => {
                  const st = displayStatus(selectedApp);
                  const transitioning = st === "starting" || st === "stopping";
                  return (
                    <Button
                      variant={st === "running" ? "destructive" : "default"}
                      disabled={transitioning}
                      className={cn("flex-1 md:flex-none gap-2 shadow-sm", st === "running" || transitioning ? "" : "bg-emerald-600 hover:bg-emerald-700")}
                      onClick={() => toggleAppStatus(selectedApp.id)}
                    >
                      {transitioning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="capitalize">{st}</span><span className="hidden sm:inline">…</span>
                        </>
                      ) : st === "running" ? (
                        <>
                          <Power className="w-4 h-4" /> Stop <span className="hidden sm:inline">App</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" /> Start <span className="hidden sm:inline">App</span>
                        </>
                      )}
                    </Button>
                  );
                })()}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Uninstall {selectedApp.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the application and its configuration data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleUninstall(selectedApp.id)}>
                        Uninstall
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b border-border/40 overflow-x-auto no-scrollbar">
              <TabsList className="bg-transparent h-12 p-0 space-x-6 w-auto justify-start inline-flex">
                <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="metrics" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="logs" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Live Logs
                </TabsTrigger>
                <TabsTrigger value="config" className="h-full rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium">
                  Configuration
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 md:p-8 pb-20 md:pb-8">
                <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Resource Usage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
                        <Cpu className="w-4 h-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          <AnimatedNumber value={selectedApp.status === "running" ? selectedApp.cpuUsage : 0} />%
                        </div>
                        <Progress value={selectedApp.status === "running" ? selectedApp.cpuUsage : 0} className="h-1.5 bg-muted" indicatorClassName="bg-primary" />
                        <p className="text-xs text-muted-foreground mt-2">Core 1</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Memory</CardTitle>
                        <Database className="w-4 h-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          <AnimatedNumber value={selectedApp.status === "running" ? selectedApp.memoryUsage : 0} /> MB
                        </div>
                        <Progress value={selectedApp.status === "running" ? (selectedApp.memoryUsage / ((selectedApp as any).memoryLimit || 512)) * 100 : 0} className="h-1.5 bg-muted" indicatorClassName="bg-purple-500" />
                        <p className="text-xs text-muted-foreground mt-2">of {(selectedApp as any).memoryLimit || 512} MB Limit</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Published Ports</CardTitle>
                        <HardDrive className="w-4 h-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">
                          {((selectedApp as any).ports ?? []).filter((p: any) => p.host_port).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {((selectedApp as any).ports ?? [])
                            .filter((p: any) => p.host_port)
                            .map((p: any) => `${p.host_port}→${p.container_port}`)
                            .join(", ") || "none"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Assigned Radio</h3>
                    <Card className="bg-muted/30 border-dashed border-border">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Radio className="w-6 h-6 text-emerald-500" />
                        </div>
                        {selectedApp.assignedDevice ? (
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{selectedApp.assignedDevice}</h4>
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">Active</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Connected via USB • Sample Rate: 2.4 MSPS</p>
                          </div>
                        ) : (
                          <div className="flex-1">
                             <h4 className="font-semibold text-muted-foreground">No Device Assigned</h4>
                             <p className="text-sm text-muted-foreground">Go to Settings to assign an SDR device to this app.</p>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">Configure</Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Logs Preview */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <h3 className="text-lg font-medium">Recent Activity</h3>
                       <Button variant="link" size="sm" className="h-auto p-0 text-primary">View all logs</Button>
                     </div>
                     <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto">
                       {logLines.length > 0 ? (
                         logLines.slice(-6).map((line, i) => (
                           <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                         ))
                       ) : (
                         <div className="text-muted-foreground/60">{apiAvailable ? "No recent log output." : "Connect to a device to view logs."}</div>
                       )}
                     </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="mt-0 p-4 md:p-6 pb-20 md:pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AppMetrics />
                </TabsContent>

                <TabsContent value="logs" className="mt-0 h-[400px] md:h-[500px] flex flex-col rounded-xl overflow-hidden border border-border/50 bg-black shadow-inner">
                   <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs font-mono">
                     <div className="flex items-center gap-2">
                       <Terminal className="w-3.5 h-3.5" />
                       <span className="truncate max-w-[150px] md:max-w-none">docker logs airwaves-{selectedApp.id}</span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="hidden sm:inline">Live</span>
                       </div>
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300">
                         <RefreshCw className="w-3.5 h-3.5" />
                       </Button>
                     </div>
                   </div>
                   <ScrollArea className="flex-1 p-4 font-mono text-xs md:text-sm text-zinc-300 selection:bg-zinc-700">
                      <div className="space-y-0.5">
                        {logLines.length > 0 ? (
                          logLines.map((line, i) => {
                            const lower = line.toLowerCase();
                            const cls = /\berror\b|\bfatal\b/.test(lower)
                              ? "text-red-400"
                              : /\bwarn(ing)?\b/.test(lower)
                                ? "text-yellow-400"
                                : /\bsuccess\b|\bready\b|\bstarted\b/.test(lower)
                                  ? "text-emerald-400"
                                  : "";
                            return <div key={i} className={cn("whitespace-pre-wrap break-all", cls)}>{line}</div>;
                          })
                        ) : (
                          <div className="text-zinc-500">
                            {apiAvailable ? `No log output from ${selectedApp.name}.` : "Connect to a device to stream logs."}
                          </div>
                        )}
                        {logLines.length > 0 && <div className="animate-pulse text-zinc-500">_</div>}
                      </div>
                   </ScrollArea>
                </TabsContent>

                <TabsContent value="config" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {selectedApp.id === 'external-feed-source' ? (
                    <ExternalFeedConfig />
                  ) : (
                  <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Container</h3>
                      <p className="text-sm text-muted-foreground mb-4">Live configuration of the running container.</p>
                      <dl className="grid gap-3 text-sm">
                        <div className="flex justify-between gap-4 py-2 border-b border-border/40">
                          <dt className="text-muted-foreground">Image</dt>
                          <dd className="font-mono text-right break-all">{(selectedApp as any).image ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4 py-2 border-b border-border/40">
                          <dt className="text-muted-foreground">Container</dt>
                          <dd className="font-mono">airwaves-{selectedApp.id}</dd>
                        </div>
                        <div className="flex justify-between gap-4 py-2 border-b border-border/40">
                          <dt className="text-muted-foreground">State</dt>
                          <dd className="capitalize">{selectedApp.status}</dd>
                        </div>
                        <div className="flex justify-between gap-4 py-2 border-b border-border/40">
                          <dt className="text-muted-foreground">Restart policy</dt>
                          <dd>unless-stopped</dd>
                        </div>
                        <div className="flex justify-between gap-4 py-2">
                          <dt className="text-muted-foreground">Published ports</dt>
                          <dd className="font-mono text-right">
                            {((selectedApp as any).ports ?? []).filter((p: any) => p.host_port).length
                              ? ((selectedApp as any).ports ?? [])
                                  .filter((p: any) => p.host_port)
                                  .map((p: any) => `${p.host_port}→${p.container_port}/${p.protocol}`)
                                  .join(", ")
                              : "none"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <Separator />

                    <p className="text-xs text-muted-foreground">
                      App-specific settings (frequency, gain, env vars) are defined by the catalog
                      app and applied at install. Editable per-app configuration is coming soon.
                    </p>
                  </div>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Settings className="w-10 h-10 text-muted-foreground/50" />
             </div>
             <h3 className="text-xl font-semibold mb-2">Select an App</h3>
             <p className="max-w-xs mx-auto text-muted-foreground">Choose an application from the list to manage its settings, view logs, and monitor performance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
