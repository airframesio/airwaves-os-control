import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Radio as RadioIcon, Play, Pause, Download, Settings, Music, Mic2, Save, Trash2, Volume2, Cast, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RtlAirband() {
  const [channels, setChannels] = useState([
    { id: 1, name: "Tower (Primary)", freq: "118.700", squelch: 28, gain: 42, status: "active", scanning: false },
    { id: 2, name: "Ground", freq: "121.900", squelch: 25, gain: 40, status: "active", scanning: false },
    { id: 3, name: "Approach", freq: "124.500", squelch: 30, gain: 45, status: "idle", scanning: true },
    { id: 4, name: "Departure", freq: "125.300", squelch: 30, gain: 45, status: "idle", scanning: true },
  ]);

  const [recordings, setRecordings] = useState([
    { id: 1, name: "TWR_118.700_2026-01-07_14-30.mp3", duration: "12:45", size: "14.6 MB", date: "2026-01-07 14:30" },
    { id: 2, name: "GND_121.900_2026-01-07_14-15.mp3", duration: "08:20", size: "9.5 MB", date: "2026-01-07 14:15" },
    { id: 3, name: "APP_124.500_2026-01-07_13-55.mp3", duration: "24:10", size: "27.8 MB", date: "2026-01-07 13:55" },
  ]);

  const [streams, setStreams] = useState([
    { id: 1, name: "Tower Feed", mount: "/tower", listeners: 45, status: "live", url: "http://stream.airwaves.local:8000/tower" },
    { id: 2, name: "Ground Feed", mount: "/ground", listeners: 12, status: "live", url: "http://stream.airwaves.local:8000/ground" },
  ]);

  const [activeTab, setActiveTab] = useState("monitor");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RadioIcon className="w-8 h-8 text-primary" />
            RTL Airband
          </h1>
          <p className="text-muted-foreground mt-1">
            Multichannel AM/FM receiver for air traffic monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 px-4 gap-2 text-sm font-normal bg-green-500/10 text-green-500 border-green-500/20">
             <Activity className="w-4 h-4" />
             Service Running
          </Badge>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Global Config
          </Button>
        </div>
      </div>

      <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitor" className="gap-2"><Mic2 className="w-4 h-4" /> Monitor & Control</TabsTrigger>
          <TabsTrigger value="streams" className="gap-2"><Cast className="w-4 h-4" /> Icecast Streams</TabsTrigger>
          <TabsTrigger value="recordings" className="gap-2"><Music className="w-4 h-4" /> Recordings</TabsTrigger>
          <TabsTrigger value="config" className="gap-2"><Settings className="w-4 h-4" /> Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {channels.map(channel => (
              <Card key={channel.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <CardDescription className="font-mono text-primary mt-1">{channel.freq} MHz</CardDescription>
                    </div>
                    <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}>
                      {channel.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Squelch ({channel.squelch}dB)</span>
                      </div>
                      <Slider defaultValue={[channel.squelch]} max={100} step={1} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Gain ({channel.gain}dB)</span>
                      </div>
                      <Slider defaultValue={[channel.gain]} max={50} step={1} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center space-x-2">
                          <Switch id={`scan-${channel.id}`} checked={channel.scanning} />
                          <Label htmlFor={`scan-${channel.id}`}>Scanning Mode</Label>
                       </div>
                       <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Volume2 className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"><Settings className="w-4 h-4" /></Button>
                       </div>
                    </div>
                  </div>
                  
                  {/* Visualizer Placeholder */}
                  <div className="h-16 bg-muted/30 rounded-md border border-border/50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                       {Array.from({ length: 40 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1 rounded-full bg-primary/40 transition-all duration-75`}
                            style={{ 
                              height: channel.status === 'active' ? `${Math.random() * 80 + 20}%` : '4px',
                              opacity: channel.status === 'active' ? 1 : 0.3
                            }}
                          ></div>
                       ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Icecast Streams</CardTitle>
              <CardDescription>Live audio feeds broadcasting to external clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stream Name</TableHead>
                    <TableHead>Mount Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listeners</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streams.map(stream => (
                    <TableRow key={stream.id}>
                      <TableCell className="font-medium">{stream.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{stream.mount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          {stream.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{stream.listeners}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Play className="w-4 h-4" /> Listen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Date Recorded</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordings.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-mono text-sm">{rec.name}</TableCell>
                      <TableCell>{rec.date}</TableCell>
                      <TableCell>{rec.duration}</TableCell>
                      <TableCell>{rec.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Icecast Configuration</CardTitle>
              <CardDescription>Server settings for live audio streaming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Server Address</Label>
                  <Input defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input defaultValue="8000" />
                </div>
                <div className="space-y-2">
                  <Label>Source Password</Label>
                  <Input type="password" defaultValue="hackme" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Password</Label>
                  <Input type="password" defaultValue="hackme" />
                </div>
              </div>
              <Button>
                <Save className="w-4 h-4 mr-2" /> Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>Configure where and how recordings are saved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Recording</Label>
                    <p className="text-sm text-muted-foreground">Save audio to disk when squelch opens</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                   <Label>Recording Path</Label>
                   <Input defaultValue="/var/lib/airwaves/recordings" />
                </div>
                <div className="space-y-2">
                   <Label>Retention Policy</Label>
                   <RadioGroup defaultValue="r1" className="flex gap-4">
                      <div className="flex items-center space-x-2">
                         <RadioGroupItem value="r1" id="r1" />
                         <Label htmlFor="r1">Keep for 7 days</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                         <RadioGroupItem value="r2" id="r2" />
                         <Label htmlFor="r2">Keep forever</Label>
                      </div>
                   </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
