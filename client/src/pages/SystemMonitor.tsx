import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, HardDrive, Cpu, Thermometer, Clock, Server, Monitor, AlertCircle, PlayCircle, StopCircle, Laptop } from "lucide-react";
import { mockApps, systemStats } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function SystemMonitor() {
  const runningApps = mockApps.filter(app => app.status === "running");
  
  // Calculate total resources used by apps
  const totalAppCpu = runningApps.reduce((acc, app) => acc + app.cpuUsage, 0);
  const totalAppMem = runningApps.reduce((acc, app) => acc + app.memoryUsage, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Monitor className="w-8 h-8 text-primary" />
          System Monitor
        </h1>
        <p className="text-muted-foreground mt-1">Real-time performance metrics and resource usage.</p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4" /> CPU Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpu}%</div>
            <Progress value={systemStats.cpu} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">4 cores active</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" /> Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.memory}%</div>
            <Progress value={systemStats.memory} className="h-2 mt-3 bg-secondary" indicatorClassName="bg-purple-500" />
            <p className="text-xs text-muted-foreground mt-2">2.4 GB / 4.0 GB used</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.temp}°C</div>
            <div className="h-2 mt-3 w-full bg-secondary rounded-full overflow-hidden">
               <div 
                 className={cn("h-full transition-all", systemStats.temp > 70 ? "bg-red-500" : "bg-emerald-500")} 
                 style={{ width: `${(systemStats.temp / 90) * 100}%` }}
               />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Thermal zone 0</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.disk}%</div>
            <Progress value={systemStats.disk} className="h-2 mt-3 bg-secondary" indicatorClassName="bg-blue-500" />
            <p className="text-xs text-muted-foreground mt-2">{systemStats.diskUsed} / {systemStats.diskTotal}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Info */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" /> System Information
            </CardTitle>
            <CardDescription>Hardware and OS details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Laptop className="w-4 h-4" /> Model
              </span>
              <span className="text-sm font-medium text-right">{systemStats.model}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Architecture
              </span>
              <span className="text-sm font-mono">{systemStats.arch}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4" /> OS Version
              </span>
              <span className="text-sm font-medium text-right max-w-[180px] truncate">{systemStats.os}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Uptime
              </span>
              <span className="text-sm font-mono">{systemStats.uptime}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> IP Address
              </span>
              <span className="text-sm font-mono">{systemStats.ip}</span>
            </div>
          </CardContent>
        </Card>

        {/* Running Processes */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 lg:col-span-2">
          <CardHeader>
             <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Active Processes
                  </CardTitle>
                  <CardDescription>Resource usage by running applications</CardDescription>
               </div>
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                 {runningApps.length} Running
               </Badge>
             </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Application</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">CPU</TableHead>
                  <TableHead className="text-right">Memory</TableHead>
                  <TableHead className="text-right">Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runningApps.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <app.icon className="w-4 h-4 text-foreground/70" />
                        </div>
                        <div>
                          <div className="font-semibold">{app.name}</div>
                          <div className="text-xs text-muted-foreground">PID: {Math.floor(Math.random() * 10000) + 1000}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal">
                         Running
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {app.cpuUsage}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {app.memoryUsage} MB
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      2d 4h
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* System Overhead Row */}
                <TableRow className="bg-muted/20">
                   <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Server className="w-4 h-4 text-foreground/70" />
                        </div>
                        <div>
                          <div className="font-semibold">System Overhead</div>
                          <div className="text-xs text-muted-foreground">Kernel & OS Services</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {(systemStats.cpu - totalAppCpu).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                       ~800 MB
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {systemStats.uptime}
                    </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
