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

interface ExternalFeed {
  id: string;
  url: string;
  interval: number;
  enabled: boolean;
}

function ExternalFeedConfig() {
  const [feeds, setFeeds] = useState<ExternalFeed[]>(() => {
    const saved = localStorage.getItem('external_feeds');
    return saved ? JSON.parse(saved) : [
      { id: '1', url: 'http://adsbexchange.local/tar1090/data/aircraft.json', interval: 5, enabled: true }
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
    setFeeds([...feeds, { id: Math.random().toString(36).substr(2, 9), url: '', interval: 5, enabled: true }]);
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
  const [apps, setApps] = useState(mockApps.filter(app => app.installed));
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
    // In a real app, this would make an API call
    toast({
      title: "App Uninstalled",
      description: "The application has been removed from your system.",
    });
    const newApps = apps.filter(a => a.id !== appId);
    setApps(newApps);
    
    if (newApps.length === 0) {
      setSelectedAppId("");
      setShowDetail(false);
    } else if (selectedAppId === appId) {
      // Select next available
      setSelectedAppId(newApps[0].id);
      if (isCompact) setShowDetail(false); // Go back to list on mobile after uninstall
    }
  };

  const toggleAppStatus = (appId: string) => {
    setApps(apps.map(app => {
      if (app.id === appId) {
        const newStatus = app.status === "running" ? "stopped" : "running";
        toast({
          title: `App ${newStatus === "running" ? "Started" : "Stopped"}`,
          description: `${app.name} is now ${newStatus}.`,
        });
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

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
          <h1 className="text-2xl font-bold tracking-tight">My Apps</h1>
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
                        app.status === "running" 
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
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Stopped
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
                    <Badge variant={selectedApp.status === "running" ? "default" : "secondary"} className={cn(
                      "capitalize", 
                      selectedApp.status === "running" ? "bg-emerald-500 hover:bg-emerald-600 border-transparent" : ""
                    )}>
                      {selectedApp.status === "running" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {selectedApp.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground max-w-lg mb-4 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                    {selectedApp.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Uptime:</span> {selectedApp.status === "running" ? "2d 4h" : "-"}
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
                <Button 
                  variant={selectedApp.status === "running" ? "destructive" : "default"} 
                  className={cn("flex-1 md:flex-none gap-2 shadow-sm", selectedApp.status === "running" ? "" : "bg-emerald-600 hover:bg-emerald-700")}
                  onClick={() => toggleAppStatus(selectedApp.id)}
                >
                  {selectedApp.status === "running" ? (
                    <>
                      <Power className="w-4 h-4" /> Stop <span className="hidden sm:inline">App</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Start <span className="hidden sm:inline">App</span>
                    </>
                  )}
                </Button>
                
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
                        <div className="text-2xl font-bold mb-2">{selectedApp.status === "running" ? selectedApp.cpuUsage : 0}%</div>
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
                        <div className="text-2xl font-bold mb-2">{selectedApp.status === "running" ? selectedApp.memoryUsage : 0} MB</div>
                        <Progress value={selectedApp.status === "running" ? (selectedApp.memoryUsage / 512) * 100 : 0} className="h-1.5 bg-muted" indicatorClassName="bg-purple-500" />
                        <p className="text-xs text-muted-foreground mt-2">of 512 MB Limit</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Disk I/O</CardTitle>
                        <HardDrive className="w-4 h-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{selectedApp.status === "running" ? "1.2" : "0"} MB/s</div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                          <div className="h-full bg-orange-500 w-[15%]"></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Write Heavy</p>
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
                     <div className="bg-card border border-border/50 rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-2">
                       <div className="flex gap-2"><span className="text-muted-foreground/50">12:00:01</span> <span className="text-blue-400">[INFO]</span> Application service starting...</div>
                       <div className="flex gap-2"><span className="text-muted-foreground/50">12:00:02</span> <span className="text-blue-400">[INFO]</span> Device initialized successfully.</div>
                       <div className="flex gap-2"><span className="text-muted-foreground/50">12:05:00</span> <span className="text-yellow-400">[WARN]</span> Signal strength low on channel 1.</div>
                       <div className="flex gap-2"><span className="text-muted-foreground/50">12:05:05</span> <span className="text-emerald-400">[DATA]</span> Packet received: ID #49281</div>
                     </div>
                  </div>
                </TabsContent>

                <TabsContent value="metrics" className="mt-0 p-4 md:p-8 pb-20 md:pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AppMetrics />
                </TabsContent>

                <TabsContent value="logs" className="mt-0 h-[400px] md:h-[500px] flex flex-col rounded-xl overflow-hidden border border-border/50 bg-black shadow-inner">
                   <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs font-mono">
                     <div className="flex items-center gap-2">
                       <Terminal className="w-3.5 h-3.5" />
                       <span className="truncate max-w-[150px] md:max-w-none">/var/log/{selectedApp.id}.log</span>
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
                      <div className="space-y-1">
                        <div className="opacity-50">2026-01-01 12:00:01 [INFO] Starting {selectedApp.name} v{selectedApp.version}...</div>
                        <div className="opacity-50">2026-01-01 12:00:02 [INFO] Loading configuration from /etc/{selectedApp.name}/config.json</div>
                        {selectedApp.assignedDevice && (
                          <div className="text-emerald-400">2026-01-01 12:00:03 [SUCCESS] Device {selectedApp.assignedDevice} initialized successfully.</div>
                        )}
                        <div>2026-01-01 12:00:05 [INFO] Listening on port 30005...</div>
                        <div>2026-01-01 12:01:12 [DATA] Message received from ICAO 485921 (Level 12)</div>
                        <div>2026-01-01 12:01:14 [DATA] Message received from ICAO 881922 (Level 9)</div>
                        <div>2026-01-01 12:02:30 [INFO] Statistics update: 42 messages/min</div>
                        <div className="text-yellow-400">2026-01-01 12:05:00 [WARN] Weak signal detected on channel 2</div>
                        <div>2026-01-01 12:05:05 [DATA] Message received from ICAO 112345</div>
                        <div>2026-01-01 12:06:12 [DATA] Message received from ICAO 485921 (Level 11)</div>
                        <div className="text-red-400">2026-01-01 12:07:00 [ERROR] Connection reset by peer (192.168.1.105)</div>
                        <div>2026-01-01 12:07:01 [INFO] Reconnecting...</div>
                        <div className="text-emerald-400">2026-01-01 12:07:02 [SUCCESS] Connection restored.</div>
                        <div>2026-01-01 12:08:45 [DATA] Message received from ICAO 993821 (Level 8)</div>
                        <div className="animate-pulse">_</div>
                      </div>
                   </ScrollArea>
                </TabsContent>

                <TabsContent value="config" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {selectedApp.id === 'external-feed-source' ? (
                    <ExternalFeedConfig />
                  ) : (
                  <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Network Settings</h3>
                      <p className="text-sm text-muted-foreground mb-4">Configure how this app communicates with other services.</p>
                      <div className="grid gap-4 md:grid-cols-2">
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Listening Port</label>
                           <Input defaultValue="30005" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Protocol</label>
                           <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                             <option>TCP</option>
                             <option>UDP</option>
                           </select>
                         </div>
                      </div>
                    </div>
                    
                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-1">Device Settings</h3>
                      <p className="text-sm text-muted-foreground mb-4">Radio frequency and gain control.</p>
                      <div className="grid gap-4 md:grid-cols-2">
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Frequency (MHz)</label>
                           <Input defaultValue="1090.00" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium">Gain (dB)</label>
                           <Input defaultValue="45.0" />
                         </div>
                         <div className="space-y-2 md:col-span-2">
                           <label className="text-sm font-medium">PPM Correction</label>
                           <div className="flex items-center gap-4">
                             <Input type="range" className="flex-1" />
                             <span className="w-12 text-sm font-mono text-right">0</span>
                           </div>
                         </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
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
