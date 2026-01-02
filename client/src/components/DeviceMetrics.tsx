import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const signalData = [
  { time: "00:00", signal: -12 },
  { time: "00:05", signal: -14 },
  { time: "00:10", signal: -11 },
  { time: "00:15", signal: -13 },
  { time: "00:20", signal: -12 },
  { time: "00:25", signal: -10 },
  { time: "00:30", signal: -12 },
  { time: "00:35", signal: -15 },
  { time: "00:40", signal: -11 },
  { time: "00:45", signal: -12 },
  { time: "00:50", signal: -13 },
  { time: "00:55", signal: -12 },
];

const tempData = [
  { time: "00:00", temp: 42 },
  { time: "00:05", temp: 43 },
  { time: "00:10", temp: 44 },
  { time: "00:15", temp: 45 },
  { time: "00:20", temp: 44 },
  { time: "00:25", temp: 43 },
  { time: "00:30", temp: 42 },
  { time: "00:35", temp: 42 },
  { time: "00:40", temp: 43 },
  { time: "00:45", temp: 44 },
  { time: "00:50", temp: 45 },
  { time: "00:55", temp: 46 },
];

const throughputData = [
  { time: "00:00", rate: 2.4 },
  { time: "00:05", rate: 2.39 },
  { time: "00:10", rate: 2.41 },
  { time: "00:15", rate: 2.4 },
  { time: "00:20", rate: 2.4 },
  { time: "00:25", rate: 2.38 },
  { time: "00:30", rate: 2.4 },
  { time: "00:35", rate: 2.4 },
  { time: "00:40", rate: 2.41 },
  { time: "00:45", rate: 2.4 },
  { time: "00:50", rate: 2.4 },
  { time: "00:55", rate: 2.39 },
];

export default function DeviceMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Signal Strength (dBFS)</CardTitle>
            <CardDescription>Signal level over the last hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signalData}>
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
                    domain={[-20, 0]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="signal" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Device Temperature (°C)</CardTitle>
            <CardDescription>Thermal performance monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tempData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
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
                    domain={[30, 60]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Throughput Stability (MSPS)</CardTitle>
          <CardDescription>Sample rate consistency check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
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
                  domain={[2.3, 2.5]} 
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#ccc' }}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
