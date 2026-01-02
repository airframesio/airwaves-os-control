import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const messageRateData = [
  { time: "00:00", rate: 42 },
  { time: "00:05", rate: 55 },
  { time: "00:10", rate: 62 },
  { time: "00:15", rate: 48 },
  { time: "00:20", rate: 52 },
  { time: "00:25", rate: 75 },
  { time: "00:30", rate: 89 },
  { time: "00:35", rate: 65 },
  { time: "00:40", rate: 58 },
  { time: "00:45", rate: 60 },
  { time: "00:50", rate: 72 },
  { time: "00:55", rate: 80 },
];

const resourceData = [
  { time: "00:00", cpu: 12, memory: 45 },
  { time: "00:05", cpu: 15, memory: 46 },
  { time: "00:10", cpu: 22, memory: 48 },
  { time: "00:15", cpu: 18, memory: 48 },
  { time: "00:20", cpu: 14, memory: 47 },
  { time: "00:25", cpu: 25, memory: 52 },
  { time: "00:30", cpu: 32, memory: 55 },
  { time: "00:35", cpu: 20, memory: 50 },
  { time: "00:40", cpu: 15, memory: 48 },
  { time: "00:45", cpu: 16, memory: 48 },
  { time: "00:50", cpu: 18, memory: 49 },
  { time: "00:55", cpu: 15, memory: 48 },
];

const networkData = [
  { time: "00:00", rx: 1.2, tx: 0.5 },
  { time: "00:05", rx: 1.5, tx: 0.6 },
  { time: "00:10", rx: 1.8, tx: 0.8 },
  { time: "00:15", rx: 1.4, tx: 0.5 },
  { time: "00:20", rx: 1.3, tx: 0.4 },
  { time: "00:25", rx: 2.1, tx: 0.9 },
  { time: "00:30", rx: 2.5, tx: 1.2 },
  { time: "00:35", rx: 1.9, tx: 0.8 },
  { time: "00:40", rx: 1.6, tx: 0.6 },
  { time: "00:45", rx: 1.5, tx: 0.5 },
  { time: "00:50", rx: 1.8, tx: 0.7 },
  { time: "00:55", rx: 1.4, tx: 0.5 },
];

export default function AppMetrics() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Message Processing Rate</CardTitle>
          <CardDescription>Messages decoded per second</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageRateData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="time" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#ccc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
            <CardDescription>CPU (%) and Memory (MB) utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    name="CPU %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={false}
                    name="RAM (MB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            <CardDescription>Throughput in MB/s</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Bar dataKey="rx" fill="#3b82f6" radius={[4, 4, 0, 0]} name="RX" stackId="stack" />
                  <Bar dataKey="tx" fill="#f59e0b" radius={[4, 4, 0, 0]} name="TX" stackId="stack" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
