import { useState, useEffect, useCallback } from "react";
import { mockMessages, Message } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Search, Filter, Signal, Pause, Play, Monitor, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2, Clock, Radio, User, FileText, Cpu } from "lucide-react";
import { useNodeStore } from "@/lib/nodeStore";
import { useContainers, useContainerLogs, useDecodedMessages } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import DemoBadge from "@/components/DemoBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

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

interface VisibleColumns {
  timestamp: boolean;
  app: boolean;
  mode: boolean;
  frequency: boolean;
  signal: boolean;
  source: boolean;
  details: boolean;
}

export default function LiveMessages() {
  const { activeNode, data } = useNodeStore();
  const apiAvailable = useApiStatus();
  const { data: liveContainers } = useContainers();
  const { data: decodedMessages } = useDecodedMessages();
  const runningAppIds = data.apps.filter(a => a.status === 'running').map(a => a.id);

  // Decoder container names for log fetching
  const decoderContainers = (liveContainers ?? [])
    .filter(c => c.state === 'running' && c.name.startsWith('airwaves-') &&
      !['airwaves-gateway', 'airwaves-manager'].includes(c.name))
    .map(c => c.name);

  // Initialize messages filtered by the current node's running apps
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterApp, setFilterApp] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    const saved = localStorage.getItem('liveMessagesColumns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }
    return {
      timestamp: true,
      app: true,
      mode: true,
      frequency: false, // Unchecked by default
      signal: true,
      source: true,
      details: true
    };
  });

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    localStorage.setItem('liveMessagesColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Parse a log line from a container into a Message object
  const parseLogLine = useCallback((containerName: string, line: string, index: number): Message | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) return null;
    const appId = containerName.replace(/^airwaves-/, '');
    return {
      id: `log-${appId}-${Date.now()}-${index}`,
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
      appId,
      appName: appId,
      frequency: "",
      mode: appId.toUpperCase(),
      signalLevel: 0,
      source: containerName,
      content: trimmed,
    };
  }, []);

  // Use decoded message buffer as primary source (includes forwarded messages)
  useEffect(() => {
    if (!apiAvailable || !decodedMessages?.length || isPaused) return;
    const newMsgs: Message[] = decodedMessages.map((dm, i) => ({
      id: dm.id || `dm-${i}`,
      timestamp: dm.timestamp?.replace('T', ' ').substring(0, 19) ?? '',
      appId: dm.decoder,
      appName: dm.decoder,
      frequency: dm.frequency ?? '',
      mode: dm.message_type.toUpperCase(),
      signalLevel: dm.signal_level ?? 0,
      source: dm.source_node,
      content: dm.raw,
    }));
    setMessages(prev => {
      // Merge new messages, dedup by ID
      const ids = new Set(prev.map(m => m.id));
      const fresh = newMsgs.filter(m => !ids.has(m.id));
      return [...fresh, ...prev].slice(0, 200);
    });
  }, [decodedMessages, apiAvailable, isPaused]);

  // Fetch real container logs when API is available (fallback to direct log polling)
  useEffect(() => {
    if (!apiAvailable || isPaused || decoderContainers.length === 0) return;

    let cancelled = false;
    const fetchLogs = async () => {
      const { containersApi } = await import("@/lib/api");
      for (const name of decoderContainers) {
        if (cancelled) break;
        try {
          const result = await containersApi.logs(name, 20);
          const lines = result.logs.split('\n').filter(Boolean);
          const newMsgs = lines
            .map((line, i) => parseLogLine(name, line, i))
            .filter((m): m is Message => m !== null);
          if (newMsgs.length > 0) {
            setMessages(prev => [...newMsgs, ...prev].slice(0, 200));
          }
        } catch {
          // Container may not have logs yet
        }
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [apiAvailable, isPaused, decoderContainers.join(','), parseLogLine]);

  // Reset messages when active node changes
  useEffect(() => {
    if (!apiAvailable) {
      setMessages(mockMessages.filter(m => runningAppIds.includes(m.appId)));
    } else {
      setMessages([]);
    }
    setCurrentPage(1);
  }, [activeNode.id, apiAvailable]);

  // Simulated messages for offline/dev mode
  useEffect(() => {
    if (apiAvailable || isPaused) return;

    const validTemplates = SAMPLE_MESSAGES.filter(t => runningAppIds.includes(t.appId));
    if (validTemplates.length === 0) return;

    const interval = setInterval(() => {
      const template = validTemplates[Math.floor(Math.random() * validTemplates.length)];
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

      setMessages(prev => [newMessage, ...prev].slice(0, 100));
    }, 1500);

    return () => clearInterval(interval);
  }, [apiAvailable, isPaused, activeNode.id]);

  const filteredMessages = messages.filter(msg => {
    const matchesApp = filterApp === "all" || msg.appId === filterApp;
    const matchesMode = filterMode === "all" || msg.mode === filterMode;
    const matchesSearch = 
      msg.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.frequency.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesApp && matchesMode && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const paginatedMessages = filteredMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page if filtered results are less than current page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredMessages.length, totalPages, currentPage]);

  // Get unique apps and modes for filter dropdowns based on available data
  const apps = Array.from(new Set(messages.map(m => m.appName)));
  const modes = Array.from(new Set(messages.map(m => m.mode)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Live Messages
            <DemoBadge show={!apiAvailable} />
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time decoded data stream for <span className="font-medium text-foreground">{activeNode.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Badge variant="outline" className="hidden md:flex h-10 px-4 gap-2 text-sm font-normal">
             <Monitor className="w-4 h-4 text-muted-foreground" />
             {activeNode.hostname}
          </Badge>
          <Button 
            variant={isPaused ? "default" : "outline"}
            onClick={() => setIsPaused(!isPaused)}
            className="w-full md:w-auto"
          >
            {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {isPaused ? "Resume Feed" : "Pause Feed"}
          </Button>
        </div>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select value={filterApp} onValueChange={(val) => {
                setFilterApp(val);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="Application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  {apps.map(app => (
                    <SelectItem key={app} value={messages.find(m => m.appName === app)?.appId || app}>{app}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={(val) => {
                setFilterMode(val);
                setCurrentPage(1);
              }}>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-background/50">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.timestamp}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, timestamp: checked }))}
                  >
                    Timestamp
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.app}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, app: checked }))}
                  >
                    Application
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.mode}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, mode: checked }))}
                  >
                    Mode
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.frequency}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, frequency: checked }))}
                  >
                    Frequency
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.signal}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, signal: checked }))}
                  >
                    Signal
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.source}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, source: checked }))}
                  >
                    Source
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.details}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, details: checked }))}
                  >
                    Details
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {visibleColumns.timestamp && <TableHead className="w-[180px]">Timestamp</TableHead>}
                  {visibleColumns.app && <TableHead className="w-[120px]">App</TableHead>}
                  {visibleColumns.mode && <TableHead className="w-[100px]">Mode</TableHead>}
                  {visibleColumns.frequency && <TableHead className="w-[120px]">Frequency</TableHead>}
                  {visibleColumns.signal && <TableHead className="w-[80px]">Signal</TableHead>}
                  {visibleColumns.source && <TableHead className="w-[150px]">Source</TableHead>}
                  {visibleColumns.details && <TableHead>Message Details</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMessages.length > 0 ? (
                  paginatedMessages.map((msg) => (
                    <TableRow 
                      key={msg.id} 
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      {visibleColumns.timestamp && (
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {msg.timestamp}
                        </TableCell>
                      )}
                      {visibleColumns.app && (
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-primary/5 border-primary/20 text-primary">
                            {msg.appName}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.mode && (
                        <TableCell className="font-medium text-sm">{msg.mode}</TableCell>
                      )}
                      {visibleColumns.frequency && (
                        <TableCell className="font-mono text-xs">{msg.frequency}</TableCell>
                      )}
                      {visibleColumns.signal && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Signal className="w-3 h-3 text-muted-foreground" />
                            {msg.signalLevel}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.source && (
                        <TableCell className="font-medium text-sm text-foreground/90">{msg.source}</TableCell>
                      )}
                      {visibleColumns.details && (
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-md truncate" title={msg.content}>
                          {msg.content}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-24 text-center">
                      No messages found matching filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div>
                Showing {filteredMessages.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredMessages.length)} of {filteredMessages.length} messages (Feed {isPaused ? 'Paused' : 'Live'})
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(val) => {
                  setItemsPerPage(parseInt(val));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2 font-medium">
                Page {currentPage} of {totalPages || 1}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-5 h-5 text-primary" />
              Message Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of captured packet data
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Timestamp
                  </div>
                  <div className="font-mono text-sm">{selectedMessage.timestamp}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Application
                  </div>
                  <div>
                    <Badge variant="outline" className="font-normal bg-primary/5 border-primary/20 text-primary">
                      {selectedMessage.appName}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> Frequency
                  </div>
                  <div className="font-mono text-sm">{selectedMessage.frequency}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Signal className="w-3.5 h-3.5" /> Signal Level
                  </div>
                  <div className="font-mono text-sm">{selectedMessage.signalLevel} dBFS</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Mode
                  </div>
                  <div className="font-medium text-sm">{selectedMessage.mode}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Source / ID
                  </div>
                  <div className="font-mono text-sm">{selectedMessage.source}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Decoded Content</h4>
                <div className="bg-muted/50 p-4 rounded-md border border-border/50 font-mono text-sm whitespace-pre-wrap break-all">
                  {selectedMessage.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
