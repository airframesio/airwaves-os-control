import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockSystems, System } from "@/lib/mockData";
import { Activity, Circle, MoreVertical, Plus, Server, Trash2, Wifi, WifiOff, Settings, Check, ArrowRight, Cog } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Systems() {
  const [systems, setSystems] = useState<System[]>(mockSystems);
  const [isPairing, setIsPairing] = useState(false);
  const [newSystemIp, setNewSystemIp] = useState("");
  const { toast } = useToast();

  // Configuration Dialog State
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [nodeMode, setNodeMode] = useState<"standalone" | "processing">("standalone");
  const [forwardingTarget, setForwardingTarget] = useState("");

  const handlePair = () => {
    setIsPairing(true);
    // Simulate pairing process
    setTimeout(() => {
      setSystems([
        ...systems,
        {
          id: `sys-${Date.now()}`,
          name: "New System",
          hostname: "airwaves-node-new",
          ip: newSystemIp,
          status: "online",
          role: "secondary",
          mode: "standalone",
          lastSeen: "Just now"
        }
      ]);
      setIsPairing(false);
      setNewSystemIp("");
      toast({
        title: "System Paired",
        description: `Successfully paired with device at ${newSystemIp}`,
      });
    }, 2000);
  };

  const handleRemove = (id: string) => {
    setSystems(systems.filter(s => s.id !== id));
    toast({
      title: "System Removed",
      description: "The node has been removed from your fleet.",
    });
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
                {isPairing ? "Pairing..." : "Pair Device"}
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
                    To: <span className="font-mono text-foreground">{system.forwardingTarget}</span>
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
                <Label htmlFor="target">Forwarding Target IP / Hostname</Label>
                <div className="flex gap-2">
                  <Input 
                    id="target" 
                    placeholder="e.g. 192.168.1.100" 
                    value={forwardingTarget}
                    onChange={(e) => setForwardingTarget(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ensure the destination node is reachable and configured to accept external data feeds.
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
