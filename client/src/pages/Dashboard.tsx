import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ArrowUpRight, Cpu, Radio, Server, Wifi } from "lucide-react";
import { mockApps, mockDevices, mockFeeds, systemStats } from "@/lib/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import generatedImage from '@assets/generated_images/abstract_waveform_gradient_blue.png';
import { cn } from "@/lib/utils";

const data = [
  { time: "00:00", msgs: 400 },
  { time: "04:00", msgs: 300 },
  { time: "08:00", msgs: 1200 },
  { time: "12:00", msgs: 2400 },
  { time: "16:00", msgs: 3100 },
  { time: "20:00", msgs: 2800 },
  { time: "24:00", msgs: 1500 },
];

export default function Dashboard() {
  const activeApps = mockApps.filter(app => app.status === "running");
  const activeDevices = mockDevices.filter(dev => dev.status === "active");
  const connectedFeeds = mockFeeds.filter(feed => feed.status === "connected");

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src={generatedImage} alt="Header Background" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 md:p-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">Airwaves</span> OS
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              System running optimally. {activeApps.length} apps active, monitoring {activeDevices.length} radio spectrums.
            </p>
            <div className="flex flex-wrap gap-4">
               <Button size="lg" className="shadow-lg shadow-primary/20">
                  Manage Apps
               </Button>
               <Button size="lg" variant="secondary" className="bg-background/50 backdrop-blur-md border border-white/10 hover:bg-background/70">
                  View Logs
               </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Apps</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApps.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockApps.filter(a => !a.installed).length} available in store
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Radio Devices</CardTitle>
            <Radio className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices.length}<span className="text-muted-foreground text-base font-normal">/{mockDevices.length}</span></div>
            <p className="text-xs text-muted-foreground">
              {mockDevices.length - activeDevices.length} idle devices
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Message Rate</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">192<span className="text-sm font-normal text-muted-foreground">/sec</span></div>
            <p className="text-xs text-muted-foreground">
              +12% from last hour
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Load</CardTitle>
            <Cpu className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.cpu}%</div>
            <p className="text-xs text-muted-foreground">
              Temp: {systemStats.temp}°C
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Signal Activity</CardTitle>
            <CardDescription>
              Total messages decoded across all bands over last 24h
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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

        {/* Feeds Status */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Feed Status</CardTitle>
            <CardDescription>
              Aggregator connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockFeeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      feed.status === "connected" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive"
                    )} />
                    <div>
                      <div className="font-medium text-sm">{feed.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{feed.destination}:{feed.port}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{feed.status === "connected" ? "OK" : "ERR"}</div>
                    {feed.status === "connected" && (
                      <div className="text-xs text-muted-foreground">{feed.messageRate} msg/m</div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border">
                <Button variant="outline" className="w-full text-xs" asChild>
                  <a href="/feeds">Manage Feeds <ArrowUpRight className="ml-2 w-3 h-3" /></a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
