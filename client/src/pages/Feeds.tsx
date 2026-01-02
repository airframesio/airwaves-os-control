import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Globe, Plus, Trash2 } from "lucide-react";
import { mockFeeds } from "@/lib/mockData";

export default function Feeds() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Feeds</h1>
          <p className="text-muted-foreground mt-1">Manage connections to external data aggregators.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Feed
        </Button>
      </div>

      <div className="space-y-4">
        {mockFeeds.map(feed => (
          <Card key={feed.id} className="flex flex-col md:flex-row items-center p-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex-1 p-4 flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-primary" />
               </div>
               <div>
                 <div className="flex items-center gap-3">
                   <h3 className="font-semibold text-lg">{feed.name}</h3>
                   <Badge variant={feed.status === "connected" ? "default" : "destructive"}>
                     {feed.status}
                   </Badge>
                 </div>
                 <div className="text-sm text-muted-foreground mt-1 font-mono">
                   {feed.destination}:{feed.port} ({feed.protocol})
                 </div>
               </div>
            </div>
            
            <div className="p-4 flex items-center gap-8 border-t md:border-t-0 md:border-l border-border/50 w-full md:w-auto justify-between md:justify-end">
               <div className="text-center">
                 <div className="text-sm text-muted-foreground">Source App</div>
                 <div className="font-medium">{feed.appId}</div>
               </div>
               <div className="text-center">
                 <div className="text-sm text-muted-foreground">Msg Rate</div>
                 <div className="font-medium font-mono">{feed.messageRate}/min</div>
               </div>
               <div className="flex gap-2">
                 <Button variant="ghost" size="icon">
                   <ArrowUpRight className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 mt-8">
        <h3 className="font-semibold text-primary mb-2">Why feed data?</h3>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Sharing your received data with aggregators like Airframes.io helps build a global picture of aviation and maritime traffic.
          Most aggregators provide premium features or enterprise accounts to feeders as a thank you.
        </p>
        <Button variant="link" className="px-0 mt-2 text-primary">Learn more about Airframes.io &rarr;</Button>
      </div>
    </div>
  );
}
