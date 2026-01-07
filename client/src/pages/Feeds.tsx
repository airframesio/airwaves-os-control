import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowUpRight, Globe, Plus, Trash2, Server, Radio, Network, Settings, Edit, Plane, Ship, Check } from "lucide-react";
import { mockFeeds, mockApps } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const getFeedTypeDetails = (type: string) => {
  switch (type) {
    case "dedicated_app":
      return { label: "Dedicated App", icon: Server, variant: "default" as const, actionLabel: "Manage App" };
    case "integrated_option":
      return { label: "Integrated", icon: Radio, variant: "secondary" as const, actionLabel: "Configure" };
    case "raw_stream":
      return { label: "Raw Stream", icon: Network, variant: "outline" as const, actionLabel: "Edit Connection" };
    default:
      return { label: "Unknown", icon: Globe, variant: "secondary" as const, actionLabel: "Manage" };
  }
};

const aggregators = [
  { id: "fr24", name: "FlightRadar24", icon: Plane, type: "dedicated", fixedDest: true, description: "World's most popular flight tracker." },
  { id: "fa", name: "FlightAware", icon: Plane, type: "dedicated", fixedDest: true, description: "Global aviation software and data services." },
  { id: "airframes", name: "Airframes.io", icon: Plane, type: "connector", fixedDest: false, defaultDest: "feed.airframes.io:5550", description: "Open protocol aviation data aggregator." },
  { id: "mt", name: "MarineTraffic", icon: Ship, type: "connector", fixedDest: false, defaultDest: "5.9.207.224:5321", description: "Global ship tracking intelligence." },
  { id: "custom", name: "Custom Destination", icon: Network, type: "raw", fixedDest: false, description: "Send raw data to a custom IP and port." },
];

export default function Feeds() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAggregator, setSelectedAggregator] = useState<string>("custom");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");

  const activeAggregator = aggregators.find(a => a.id === selectedAggregator);
  const sourceApps = mockApps.filter(app => ["aviation", "maritime"].includes(app.category));

  const handleAggregatorChange = (id: string) => {
    setSelectedAggregator(id);
    const agg = aggregators.find(a => a.id === id);
    if (agg) {
       if (agg.defaultDest) {
         const [h, p] = agg.defaultDest.split(':');
         setHost(h);
         setPort(p);
       } else {
         setHost("");
         setPort("");
       }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Feeds</h1>
          <p className="text-muted-foreground mt-1">Manage connections to external data aggregators and streams.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Data Feed</DialogTitle>
              <DialogDescription>
                Configure a new data stream from your receivers to an external destination.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Source Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">1. Select Data Source</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a running application..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceApps.map(app => (
                        <SelectItem key={app.id} value={app.id}>
                          <div className="flex items-center gap-2">
                            {/* Icon rendering is tricky in SelectItem without the component instance, but we can use text */}
                            <span className="font-medium">{app.name}</span>
                            <span className="text-xs text-muted-foreground">({app.category})</span>
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
                <Label className="text-base font-medium">2. Select Destination</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aggregators.map((agg) => {
                    const Icon = agg.icon;
                    return (
                      <div
                        key={agg.id}
                        className={cn(
                          "cursor-pointer rounded-lg border p-4 hover:border-primary transition-all relative",
                          selectedAggregator === agg.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
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
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{agg.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4 rounded-lg border border-border/50 bg-muted/20 p-4">
                <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Configuration</h3>
                
                {activeAggregator?.fixedDest ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-500">
                    <Server className="w-4 h-4" />
                    <div>
                      This feed uses a <strong>dedicated client</strong>. The destination is managed automatically by the {activeAggregator.name} software.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Destination Host / IP</Label>
                      <Input value={host} onChange={e => setHost(e.target.value)} placeholder="e.g. 1.2.3.4" />
                    </div>
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input value={port} onChange={e => setPort(e.target.value)} placeholder="e.g. 30005" />
                    </div>
                  </div>
                )}

                {/* Additional fields based on type */}
                {activeAggregator?.id === 'fr24' && (
                  <div className="space-y-2">
                    <Label>Sharing Key</Label>
                    <Input placeholder="Enter your FR24 sharing key..." />
                    <p className="text-xs text-muted-foreground">Leave empty to register a new key.</p>
                  </div>
                )}
                
                {!activeAggregator?.fixedDest && (
                   <div className="space-y-2">
                    <Label>Protocol</Label>
                    <RadioGroup defaultValue="tcp" className="flex gap-4">
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
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button>Create Feed</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {mockFeeds.map(feed => {
          const typeDetails = getFeedTypeDetails(feed.type);
          const Icon = typeDetails.icon;
          
          return (
            <Card key={feed.id} className="flex flex-col md:flex-row items-center p-2 bg-card/50 backdrop-blur-sm border-border/50 transition-all hover:bg-card/80">
              <div className="flex-1 p-4 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                 </div>
                 <div className="flex-1">
                   <div className="flex flex-wrap items-center gap-3">
                     <h3 className="font-semibold text-lg">{feed.name}</h3>
                     <Badge variant={feed.status === "connected" ? "default" : "destructive"} className={feed.status === "connected" ? "bg-green-500 hover:bg-green-600" : ""}>
                       {feed.status}
                     </Badge>
                     <Badge variant={typeDetails.variant} className="gap-1 pl-1.5">
                        <Icon className="w-3 h-3" />
                        {typeDetails.label}
                     </Badge>
                   </div>
                   <div className="text-sm text-muted-foreground mt-1 font-mono flex items-center gap-2">
                     <Globe className="w-3 h-3" />
                     {feed.destination}:{feed.port} <span className="text-xs border border-border px-1 rounded bg-muted/50">{feed.protocol}</span>
                   </div>
                 </div>
              </div>
              
              <div className="p-4 flex items-center gap-6 border-t md:border-t-0 md:border-l border-border/50 w-full md:w-auto justify-between md:justify-end bg-muted/10 md:bg-transparent rounded-b-lg md:rounded-none">
                 <div className="text-center min-w-[80px]">
                   <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Source</div>
                   <div className="font-medium text-sm">{feed.appId}</div>
                 </div>
                 <div className="text-center min-w-[80px]">
                   <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Rate</div>
                   <div className="font-medium font-mono text-sm">{feed.messageRate}/min</div>
                 </div>
                 <div className="flex gap-2 pl-4 border-l border-border/50">
                   {feed.type === "dedicated_app" && (
                     <Button variant="ghost" size="sm" className="gap-2">
                       <Settings className="w-4 h-4" /> <span className="hidden lg:inline">{typeDetails.actionLabel}</span>
                     </Button>
                   )}
                   {feed.type === "integrated_option" && (
                     <Button variant="ghost" size="sm" className="gap-2">
                       <Settings className="w-4 h-4" /> <span className="hidden lg:inline">{typeDetails.actionLabel}</span>
                     </Button>
                   )}
                   {feed.type === "raw_stream" && (
                     <Button variant="ghost" size="sm" className="gap-2">
                       <Edit className="w-4 h-4" /> <span className="hidden lg:inline">{typeDetails.actionLabel}</span>
                     </Button>
                   )}
                   
                   <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Server className="w-4 h-4" /> Dedicated Apps
          </h3>
          <p className="text-sm text-muted-foreground">
            Standalone feeding software like <strong>acarshub</strong> that runs independently to forward aggregated data.
          </p>
        </div>
        <div className="rounded-xl bg-secondary/20 border border-secondary/20 p-6">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Radio className="w-4 h-4" /> Integrated Options
          </h3>
          <p className="text-sm text-muted-foreground">
            Built-in feeding capabilities within decoders like <strong>readsb</strong> or <strong>dump1090</strong>.
          </p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-6">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Network className="w-4 h-4" /> Raw Streams
          </h3>
          <p className="text-sm text-muted-foreground">
            Direct TCP/UDP data streams sent from a local port to a remote destination.
          </p>
        </div>
      </div>
    </div>
  );
}
