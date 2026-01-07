import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Globe, Plus, Trash2, Server, Radio, Network, Settings, Edit } from "lucide-react";
import { mockFeeds } from "@/lib/mockData";

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

export default function Feeds() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Feeds</h1>
          <p className="text-muted-foreground mt-1">Manage connections to external data aggregators and streams.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Feed
        </Button>
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
