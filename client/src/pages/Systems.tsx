import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockSystems, System } from "@/lib/mockData";
import { Activity, Circle, MoreVertical, Plus, Server, Trash2, Wifi, WifiOff, Settings, Check, ArrowRight, Cog, Loader2, Search, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useFleetStatus, usePairNode, useUnpairNode, useDiscoverNodes } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";

export default function Systems() {
  const apiAvailable = useApiStatus();
  const { data: fleetData } = useFleetStatus();
  const pairMutation = usePairNode();
  const unpairMutation = useUnpairNode();
  const { data: discoveredNodes, refetch: runDiscovery, isFetching: isDiscovering } = useDiscoverNodes();

  // Map live fleet data to System[] format when available
  const liveSystems: System[] | null = apiAvailable && fleetData
    ? [
        {
          id: fleetData.local_node.id || 'local',
          name: fleetData.local_node.name || fleetData.local_node.hostname,
          hostname: fleetData.local_node.hostname,
          ip: fleetData.local_node.ip,
          status: fleetData.local_node.status as any,
          role: fleetData.local_node.role as any,
          mode: fleetData.local_node.mode as any,
          lastSeen: fleetData.local_node.last_seen,
        },
        ...fleetData.peers.map(p => ({
          id: p.id,
          name: p.name,
          hostname: p.hostname,
          ip: p.ip,
          status: p.status as any,
          role: p.role as any,
          mode: p.mode as any,
          forwardingTarget: p.forwarding_target,
          lastSeen: p.last_seen,
        })),
      ]
    : null;

  const [systems, setSystems] = useState<System[]>(mockSystems);
  const [isPairing, setIsPairing] = useState(false);
  const [newSystemIp, setNewSystemIp] = useState("");
  const { toast } = useToast();

  // Sync with live data
  useEffect(() => {
    if (liveSystems) setSystems(liveSystems);
  }, [fleetData]);

  // Configuration Dialog State
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [nodeMode, setNodeMode] = useState<"standalone" | "processing">("standalone");
  const [forwardingTarget, setForwardingTarget] = useState("");

  const handlePair = () => {
    if (apiAvailable) {
      setIsPairing(true);
      pairMutation.mutate({ ip: newSystemIp }, {
        onSuccess: (node) => {
          setIsPairing(false);
          setNewSystemIp("");
          toast({ title: "System Paired", description: `Paired with ${node.hostname} at ${newSystemIp}` });
        },
        onError: (err) => {
          setIsPairing(false);
          toast({ title: "Pairing Failed", description: String(err), variant: "destructive" });
        },
      });
    } else {
      // Mock fallback
      setIsPairing(true);
      setTimeout(() => {
        setSystems([...systems, {
          id: `sys-${Date.now()}`, name: "New System", hostname: "airwaves-node-new",
          ip: newSystemIp, status: "online", role: "secondary", mode: "standalone", lastSeen: "Just now"
        }]);
        setIsPairing(false);
        setNewSystemIp("");
        toast({ title: "System Paired", description: `Paired with ${newSystemIp}` });
      }, 2000);
    }
  };

  const handleRemove = (id: string) => {
    if (apiAvailable) {
      unpairMutation.mutate(id, {
        onSuccess: () => toast({ title: "System Removed", description: "Node removed from fleet." }),
        onError: (err) => toast({ title: "Remove Failed", description: String(err), variant: "destructive" }),
      });
    }
    // Optimistic update
    setSystems(systems.filter(s => s.id !== id));
    toast({ title: "System Removed", description: "Node removed from fleet." });
  };

  const openConfigureDialog = (system: System) => {
    setSelectedSystem(system);
    setNodeMode(system.mode || "standalone");
    setForwardingTarget(system.forwardingTarget || "");
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfiguration = () => {
    if (!selectedSystem) return;

    const updatedSystems = systems.map(s => 
      s.id === selectedSystem.id 
        ? { ...s, mode: nodeMode, forwardingTarget: nodeMode === "processing" ? forwardingTarget : undefined }
        : s
    );

    setSystems(updatedSystems);
    setIsConfigDialogOpen(false);
    toast({
      title: "Configuration Saved",
      description: `Node ${selectedSystem.name} updated successfully.`,
    });
  };

  const getSystemName = (id: string) => {
    return systems.find(s => s.id === id)?.name || id;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Fleet</h1>
          <p className="text-muted-foreground mt-1">Manage multiple Airwaves OS instances from a single interface.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Pair New Node
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pair New System</DialogTitle>
              <DialogDescription>
                Enter the IP address or hostname of the Airwaves OS instance you want to pair.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Auto-discovery */}
              {apiAvailable && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Discovered on Network</Label>
                    <Button variant="ghost" size="sm" onClick={() => runDiscovery()} disabled={isDiscovering}>
                      {isDiscovering ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
                      Scan
                    </Button>
                  </div>
                  {discoveredNodes && discoveredNodes.length > 0 ? (
                    <div className="space-y-2">
                      {discoveredNodes.map(node => (
                        <div key={node.ip} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{node.hostname}</div>
                              <div className="text-xs text-muted-foreground font-mono">{node.ip}</div>
                            </div>
                          </div>
                          {node.already_paired ? (
                            <Badge variant="secondary" className="text-xs">Paired</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => { setNewSystemIp(node.ip); }}>
                              Select
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : discoveredNodes ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No nodes found on the local network</p>
                  ) : null}
                  <Separator className="my-2" />
                </div>
              )}

              {/* Manual IP entry */}
              <div className="space-y-2">
                <Label>IP Address / Hostname</Label>
                <Input
                  placeholder="192.168.1.x"
                  value={newSystemIp}
                  onChange={(e) => setNewSystemIp(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePair} disabled={!newSystemIp || isPairing}>
                {isPairing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Pairing...</> : "Pair Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {systems.map(system => (
          <Card key={system.id} className={cn(
            "relative overflow-hidden transition-all hover:border-primary/50",
            system.role === "primary" ? "bg-primary/5 border-primary/20" : "bg-card/50"
          )}>
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              system.status === "online" ? "bg-emerald-500" : "bg-muted"
            )} />
            
            <CardHeader className="pl-6 pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{system.name}</CardTitle>
                    {system.role === "primary" && (
                      <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary bg-primary/5">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-mono text-xs">{system.ip}</CardDescription>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openConfigureDialog(system)}>
                      <Settings className="w-4 h-4 mr-2" /> Configure
                    </DropdownMenuItem>
                    {system.role !== "primary" && (
                      <>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemove(system.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Unpair
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="pl-6 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Status</div>
                <div className={cn(
                  "font-medium text-right flex justify-end items-center gap-1.5",
                  system.status === "online" ? "text-emerald-500" : "text-muted-foreground"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", system.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                  {system.status === "online" ? "Online" : "Offline"}
                </div>
                
                <div className="text-muted-foreground">Hostname</div>
                <div className="font-mono text-right text-xs truncate">{system.hostname}</div>
                
                <div className="text-muted-foreground">Last Seen</div>
                <div className="text-right text-xs">{system.lastSeen}</div>

                <div className="text-muted-foreground">Mode</div>
                <div className="text-right capitalize flex items-center justify-end gap-1.5 font-medium">
                  {system.mode === "processing" ? (
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  ) : (
                    <Server className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  {system.mode || "Standalone"}
                </div>
              </div>

              {system.mode === "processing" && system.forwardingTarget && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 text-xs">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium mb-1">
                    <ArrowRight className="w-3.5 h-3.5" /> Forwarding Data
                  </div>
                  <div className="text-muted-foreground truncate" title={system.forwardingTarget}>
                    To: <span className="font-mono text-foreground">{getSystemName(system.forwardingTarget)}</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  className="w-full border-primary/20 hover:bg-primary/5" 
                  variant="outline" 
                  disabled={system.status === "offline"}
                  onClick={() => openConfigureDialog(system)}
                >
                   <Cog className="w-4 h-4 mr-2" /> Configure Node
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Node: {selectedSystem?.name}</DialogTitle>
            <DialogDescription>
              Set the operational mode and data flow for this system node.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <RadioGroup 
              value={nodeMode} 
              onValueChange={(val: "standalone" | "processing") => setNodeMode(val)}
              className="grid gap-4"
            >
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5 transition-colors">
                <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="standalone" className="font-medium cursor-pointer">
                    Standalone Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Node processes data locally and stores it on its own database. Operates independently.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5 transition-colors">
                <RadioGroupItem value="processing" id="processing" className="mt-1" />
                <div className="grid gap-1.5">
                  <Label htmlFor="processing" className="font-medium cursor-pointer">
                    Processing Node
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Node processes signals but forwards all decoded data to another node. No local storage.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {nodeMode === "processing" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/30 p-4 rounded-md border border-border/50">
                <Label htmlFor="target">Forwarding Target Node</Label>
                <Select value={forwardingTarget} onValueChange={setForwardingTarget}>
                  <SelectTrigger id="target" className="w-full bg-background/50">
                    <SelectValue placeholder="Select a destination node" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems
                      .filter(s => s.id !== selectedSystem?.id && s.status === 'online')
                      .map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.ip}</span>
                          </div>
                        </SelectItem>
                      ))
                    }
                    {systems.filter(s => s.id !== selectedSystem?.id && s.status === 'online').length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        No available online nodes found.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an active node to receive the decoded data stream.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfiguration} disabled={nodeMode === "processing" && !forwardingTarget}>
              <Check className="w-4 h-4 mr-2" /> Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
