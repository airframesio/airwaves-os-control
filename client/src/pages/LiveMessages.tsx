import { useState, useEffect } from "react";
import { mockMessages, Message } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Search, Filter, Signal, Pause, Play } from "lucide-react";

const SAMPLE_MESSAGES = [
  {
    appId: "readsb",
    appName: "readsb", 
    frequency: "1090 MHz",
    mode: "ADSB",
    content: (icao: string) => `DF: 17 CA: 5 TC: 11 (Airborne Position) Altitude: ${Math.floor(Math.random() * 40000)} ft`
  },
  {
    appId: "acarsdec",
    appName: "acarsdec",
    frequency: "131.550 MHz", 
    mode: "ACARS",
    content: () => `ACARS mode: 2 label: 5U block_id: ${Math.floor(Math.random() * 9)} msg_no: M0${Math.floor(Math.random() * 9)}A`
  },
  {
    appId: "ais-catcher",
    appName: "AIS-Catcher",
    frequency: "162.025 MHz",
    mode: "AIS",
    content: () => `Type: 1 (Position Report) Status: Under way using engine Speed: ${(Math.random() * 20).toFixed(1)} kn`
  }
];

export default function LiveMessages() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [filterApp, setFilterApp] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const template = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
      const id = Math.random().toString(36).substr(2, 9);
      
      const newMessage: Message = {
        id: `msg-${id}`,
        timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
        appId: template.appId,
        appName: template.appName,
        frequency: template.frequency,
        mode: template.mode,
        signalLevel: -Math.floor(Math.random() * 30),
        source: Math.random().toString(36).substr(2, 6).toUpperCase(),
        content: typeof template.content === 'function' ? template.content('TEST') : template.content
      };

      setMessages(prev => [newMessage, ...prev].slice(0, 100)); // Keep last 100 messages
    }, 1500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredMessages = messages.filter(msg => {
    const matchesApp = filterApp === "all" || msg.appId === filterApp;
    const matchesMode = filterMode === "all" || msg.mode === filterMode;
    const matchesSearch = 
      msg.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.frequency.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesApp && matchesMode && matchesSearch;
  });

  // Get unique apps and modes for filter dropdowns
  const apps = Array.from(new Set(mockMessages.map(m => m.appName)));
  const modes = Array.from(new Set(mockMessages.map(m => m.mode)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Live Messages
          </h1>
          <p className="text-muted-foreground mt-1">Real-time decoded data stream from all active applications.</p>
        </div>
        <Button 
          variant={isPaused ? "default" : "outline"}
          onClick={() => setIsPaused(!isPaused)}
          className="w-full md:w-auto"
        >
          {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
          {isPaused ? "Resume Feed" : "Pause Feed"}
        </Button>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" /> Filters
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content, source, freq..."
                  className="pl-9 bg-background/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterApp} onValueChange={setFilterApp}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  {apps.map(app => (
                    <SelectItem key={app} value={mockMessages.find(m => m.appName === app)?.appId || app}>{app}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-[120px] bg-background/50">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {modes.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[120px]">App</TableHead>
                  <TableHead className="w-[100px]">Mode</TableHead>
                  <TableHead className="w-[120px]">Frequency</TableHead>
                  <TableHead className="w-[80px]">Signal</TableHead>
                  <TableHead className="w-[150px]">Source</TableHead>
                  <TableHead>Message Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((msg) => (
                    <TableRow key={msg.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {msg.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-primary/5 border-primary/20 text-primary">
                          {msg.appName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{msg.mode}</TableCell>
                      <TableCell className="font-mono text-xs">{msg.frequency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Signal className="w-3 h-3 text-muted-foreground" />
                          {msg.signalLevel}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground/90">{msg.source}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-md truncate" title={msg.content}>
                        {msg.content}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No messages found matching filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Showing {filteredMessages.length} messages (Feed {isPaused ? 'Paused' : 'Live'})
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
