import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowUpRight, Cpu, Radio, Server, Wifi, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { mockApps, mockDevices, mockFeeds, mockSystems, systemStats } from "@/lib/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// Simulate consolidated data
const aggregateData = [
  { time: "00:00", msgs: 400 * mockSystems.length },
  { time: "04:00", msgs: 300 * mockSystems.length },
  { time: "08:00", msgs: 1200 * mockSystems.length },
  { time: "12:00", msgs: 2400 * mockSystems.length },
  { time: "16:00", msgs: 3100 * mockSystems.length },
  { time: "20:00", msgs: 2800 * mockSystems.length },
  { time: "24:00", msgs: 1500 * mockSystems.length },
];

export default function Dashboard() {
  const activeApps = mockApps.filter(app => app.status === "running");
  const activeDevices = mockDevices.filter(dev => dev.status === "active");
  const connectedFeeds = mockFeeds.filter(feed => feed.status === "connected");
  
  // Aggregate stats across "fleet" (simulated)
  const totalApps = activeApps.length * 2 + 1; // Simulated extra apps on other nodes
  const totalDevices = activeDevices.length + 3; // Simulated devices on other nodes
  const onlineNodes = mockSystems.filter(s => s.status === "online");

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src="/header-bg.png" alt="Header Background" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 md:p-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">Airwaves</span> OS
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Fleet running optimally. {onlineNodes.length} nodes online, processing signals across {totalDevices} devices.
            </p>
            <div className="flex flex-wrap gap-4">
               <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
                  <Link href="/apps">Manage Apps</Link>
               </Button>
               <Button size="lg" variant="secondary" className="bg-background/50 backdrop-blur-md border border-white/10 hover:bg-background/70" asChild>
                  <Link href="/apps">View Logs</Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Status Summary */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold tracking-tight">Fleet Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fleet Status</CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineNodes.length}/{mockSystems.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {mockSystems.length - onlineNodes.length > 0 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    {mockSystems.length - onlineNodes.length} node offline
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    All systems operational
                  </>
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
              <Radio className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                Active across all nodes
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Global Msg Rate</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">~580<span className="text-sm font-normal text-muted-foreground">/sec</span></div>
              <p className="text-xs text-muted-foreground">
                Aggregated throughput
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Load</CardTitle>
              <Cpu className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32%</div>
              <p className="text-xs text-muted-foreground">
                Fleet average
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Global Signal Activity</CardTitle>
            <CardDescription>
              Total messages decoded across all nodes over last 24h
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregateData}>
                  <defs>
                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="msgs" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMsgs)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Nodes Status List */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Node Health</CardTitle>
            <CardDescription>
              Real-time status of paired systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockSystems.map(sys => (
                <div key={sys.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      sys.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive"
                    )} />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {sys.name}
                        {sys.role === "primary" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Core</span>}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{sys.ip}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{sys.status === "online" ? "OK" : "DOWN"}</div>
                    <div className="text-xs text-muted-foreground">{sys.lastSeen}</div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border">
                <Button variant="outline" className="w-full text-xs" asChild>
                  <Link href="/systems">Manage Fleet <ArrowUpRight className="ml-2 w-3 h-3" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
