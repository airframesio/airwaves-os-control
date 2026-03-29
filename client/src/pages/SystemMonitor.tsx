import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, HardDrive, Cpu, Thermometer, Clock, Server, Monitor, AlertCircle, PlayCircle, StopCircle, Laptop, Terminal } from "lucide-react";
import { useNodeStore } from "@/lib/nodeStore";
import { cn } from "@/lib/utils";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSystemInfo, useSystemStats } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useManagerEvents } from "@/hooks/useManagerEvents";

const AnimatedNumber = ({ value, format = (v: number) => v.toFixed(0) }: { value: number, format?: (v: number) => string }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => format(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

// Helper to generate consistent simulated stats for a node
const getNodeStats = (nodeId: string) => {
  // Simple deterministic generation based on ID
  const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const isMain = nodeId === 'sys-1';
  
  return {
    cpu: isMain ? 45 : random(10, 30),
    memory: isMain ? 62 : random(30, 50),
    disk: isMain ? 28 : random(15, 60),
    diskTotal: isMain ? "256 GB" : "128 GB",
    diskUsedVal: isMain ? 71.6 : random(20, 80),
    diskUsed: isMain ? "71.6 GB" : `${random(20, 80).toFixed(1)} GB`,
    temp: isMain ? 52 : random(40, 60),
    uptime: isMain ? "4d 12h 30m" : `${random(1, 20)}d ${random(1, 23)}h ${random(1, 59)}m`,
    os: "Airwaves OS v1.2.0 (Linux 6.1.0)",
    arch: "aarch64",
    model: isMain ? "Raspberry Pi 5 Model B" : "Raspberry Pi 4 Model B",
  };
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const WebTerminal = ({ hostname, apiAvailable }: { hostname: string; apiAvailable: boolean }) => {
  const [history, setHistory] = useState<string[]>([
    `Connecting to ${hostname}...`,
    apiAvailable ? "Connected to Airwaves OS Manager." : "Manager offline - using simulated mode.",
    "Type 'help' for a list of commands."
  ]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const runRealCommand = async (cmd: string): Promise<string[]> => {
    const { systemApi } = await import("@/lib/api");
    const result = await systemApi.exec(cmd);
    const lines: string[] = [];
    if (result.stdout) lines.push(result.stdout.trimEnd());
    if (result.stderr) lines.push(result.stderr.trimEnd());
    return lines;
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || running) return;

    const cmd = input.trim();

    if (cmd.toLowerCase() === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    setHistory(prev => [...prev, `user@${hostname}:~$ ${cmd}`]);
    setInput("");

    if (apiAvailable) {
      setRunning(true);
      try {
        const lines = await runRealCommand(cmd);
        setHistory(prev => [...prev, ...lines]);
      } catch (err) {
        setHistory(prev => [...prev, `Error: ${err}`]);
      } finally {
        setRunning(false);
      }
    } else {
      // Fallback: simulated
      const simulated: Record<string, string[]> = {
        help: ["Available commands: help, clear, uname, date, uptime, hostname, docker ps, lsusb, df, free"],
        uname: ["Linux airwaves-os 6.1.0-rpi7-rpi-v8 #1 SMP PREEMPT aarch64 GNU/Linux"],
        date: [new Date().toString()],
        uptime: [" 14:32:05 up 4 days, 12:30,  1 user,  load average: 0.45, 0.52, 0.48"],
        hostname: [hostname],
      };
      const output = simulated[cmd.toLowerCase()];
      setHistory(prev => [...prev, ...(output ?? [`bash: ${cmd}: command not found (offline mode)`])]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black font-mono text-xs md:text-sm p-4 rounded-lg border border-zinc-800 shadow-inner">
      <div className="flex-1 overflow-y-auto min-h-[300px]" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{line}</div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="mt-2 flex items-center gap-2">
        <span className="text-emerald-500 font-bold shrink-0">user@{hostname}:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-600 focus:ring-0 p-0"
          autoFocus
          spellCheck={false}
        />
      </form>
    </div>
  );
};

export default function SystemMonitor() {
  const { activeNode, data } = useNodeStore();
  const apiAvailable = useApiStatus();
  const { data: liveStats } = useSystemStats();
  const { data: liveInfo } = useSystemInfo();
  const { liveStats: wsStats } = useManagerEvents();
  const runningApps = data.apps.filter(app => app.status === "running");

  // Calculate total resources used by apps
  const totalAppCpu = runningApps.reduce((acc, app) => acc + app.cpuUsage, 0);

  // Get simulated stats for this node, override with live data when available
  // Prefer WebSocket stats (real-time every 5s) over REST poll
  const mockStats = getNodeStats(activeNode.id);
  const realStats = wsStats ?? liveStats;
  const stats = apiAvailable && realStats ? {
    cpu: Math.round(realStats.cpu_usage),
    memory: Math.round(realStats.memory_percent),
    disk: Math.round(realStats.disk_percent),
    diskTotal: liveStats ? `${(liveStats.disk_total / (1024 * 1024 * 1024)).toFixed(0)} GB` : mockStats.diskTotal,
    diskUsedVal: liveStats ? liveStats.disk_used / (1024 * 1024 * 1024) : mockStats.diskUsedVal,
    diskUsed: liveStats ? `${(liveStats.disk_used / (1024 * 1024 * 1024)).toFixed(1)} GB` : mockStats.diskUsed,
    temp: realStats.temperature ?? mockStats.temp,
    uptime: liveInfo ? formatUptime(liveInfo.uptime) : mockStats.uptime,
    os: liveInfo ? `Airwaves OS ${liveInfo.airwaves_version} (${liveInfo.kernel})` : mockStats.os,
    arch: liveInfo?.architecture ?? mockStats.arch,
    model: mockStats.model,
  } : mockStats;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Monitor className="w-8 h-8 text-primary" />
          System Monitor
        </h1>
        <p className="text-muted-foreground mt-1">
          Real-time performance metrics for <span className="font-medium text-foreground">{activeNode.name}</span> <span className="text-muted-foreground/50 mx-1">•</span> <span className="font-mono text-sm">{activeNode.hostname}</span>
        </p>
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
            <div className="text-2xl font-bold">
              <AnimatedNumber value={stats.cpu} />%
            </div>
            <Progress value={stats.cpu} className="h-2 mt-3" />
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
            <div className="text-2xl font-bold">
              <AnimatedNumber value={stats.memory} />%
            </div>
            <Progress value={stats.memory} className="h-2 mt-3 bg-secondary" indicatorClassName="bg-purple-500" />
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
            <div className="text-2xl font-bold">
              <AnimatedNumber value={stats.temp} />°C
            </div>
            <div className="h-2 mt-3 w-full bg-secondary rounded-full overflow-hidden">
               <div 
                 className={cn("h-full transition-all", stats.temp > 70 ? "bg-red-500" : "bg-emerald-500")} 
                 style={{ width: `${(stats.temp / 90) * 100}%` }}
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
            <div className="text-2xl font-bold">
              <AnimatedNumber value={stats.disk} />%
            </div>
            <Progress value={stats.disk} className="h-2 mt-3 bg-secondary" indicatorClassName="bg-blue-500" />
            <p className="text-xs text-muted-foreground mt-2">{stats.diskUsed} / {stats.diskTotal}</p>
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
                <Monitor className="w-4 h-4" /> Hostname
              </span>
              <span className="text-sm font-mono">{activeNode.hostname}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Laptop className="w-4 h-4" /> Model
              </span>
              <span className="text-sm font-medium text-right">{stats.model}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Architecture
              </span>
              <span className="text-sm font-mono">{stats.arch}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4" /> OS Version
              </span>
              <span className="text-sm font-medium text-right max-w-[180px] truncate">{stats.os}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Uptime
              </span>
              <span className="text-sm font-mono">{stats.uptime}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> IP Address
              </span>
              <span className="text-sm font-mono">{activeNode.ip}</span>
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
                      {(stats.cpu - totalAppCpu > 0 ? stats.cpu - totalAppCpu : 1).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                       ~800 MB
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {stats.uptime}
                    </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Web Terminal Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" /> Remote Access
              </CardTitle>
              <CardDescription>Direct web-based SSH terminal session</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected via SSH (Port 22)
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <WebTerminal hostname={activeNode.hostname} apiAvailable={apiAvailable} />
        </CardContent>
      </Card>
    </div>
  );
}
