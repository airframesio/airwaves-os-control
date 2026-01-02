import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Cpu, Database, HardDrive, Play, Square, Terminal } from "lucide-react";
import { mockApps } from "@/lib/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function MyApps() {
  const installedApps = mockApps.filter(app => app.installed);
  const [selectedAppId, setSelectedAppId] = useState<string>(installedApps[0]?.id);

  const selectedApp = installedApps.find(app => app.id === selectedAppId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* App List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
        <h1 className="text-2xl font-bold tracking-tight mb-2">My Apps</h1>
        {installedApps.map(app => (
          <div 
            key={app.id} 
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
              selectedAppId === app.id 
                ? "bg-card border-primary/50 shadow-sm" 
                : "bg-card/50 border-border/50 hover:bg-card hover:border-border"
            )}
            onClick={() => setSelectedAppId(app.id)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                selectedAppId === app.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <app.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                   <h3 className="font-semibold text-sm">{app.name}</h3>
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     app.status === "running" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground"
                   )} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{app.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> {app.cpuUsage}%
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" /> {app.memoryUsage}MB
              </div>
              <div className="ml-auto font-mono">
                v{app.version}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* App Detail View */}
      <div className="flex-1 bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-sm">
        {selectedApp ? (
          <>
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <selectedApp.icon className="w-8 h-8 text-primary" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold">{selectedApp.name}</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <Badge variant={selectedApp.status === "running" ? "default" : "secondary"}>
                       {selectedApp.status}
                     </Badge>
                     <span className="text-sm text-muted-foreground">
                       {selectedApp.assignedDevice ? `Connected to ${selectedApp.assignedDevice}` : 'No device assigned'}
                     </span>
                   </div>
                 </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Logs</Button>
                <Button variant="outline" size="sm">Config</Button>
                {selectedApp.status === "running" ? (
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Square className="w-4 h-4 fill-current" /> Stop
                  </Button>
                ) : (
                  <Button size="sm" className="gap-2">
                    <Play className="w-4 h-4 fill-current" /> Start
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 p-0 overflow-hidden flex flex-col bg-black">
               <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs font-mono">
                 <Terminal className="w-3 h-3 mr-2" /> 
                 Live Logs - tail -f /var/log/{selectedApp.id}.log
               </div>
               <ScrollArea className="flex-1 p-4 font-mono text-xs md:text-sm text-zinc-300">
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
                    <div className="animate-pulse">_</div>
                  </div>
               </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select an app to view details
          </div>
        )}
      </div>
    </div>
  );
}
