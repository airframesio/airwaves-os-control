import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockSystems } from "@/lib/mockData";
import { Activity, Circle, MoreVertical, Plus, Server, Trash2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Systems() {
  const [systems, setSystems] = useState(mockSystems);
  const [isPairing, setIsPairing] = useState(false);
  const [newSystemIp, setNewSystemIp] = useState("");
  const { toast } = useToast();

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
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Configure</DropdownMenuItem>
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
            
            <CardContent className="pl-6">
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Status
                  </span>
                  <span className={cn(
                    "flex items-center gap-1.5 font-medium",
                    system.status === "online" ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {system.status === "online" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        Offline
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Server className="w-4 h-4" /> Hostname
                  </span>
                  <span className="font-mono text-xs">{system.hostname}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Wifi className="w-4 h-4" /> Last Seen
                  </span>
                  <span className="text-xs">{system.lastSeen}</span>
                </div>

                <div className="pt-4">
                  <Button className="w-full" variant="secondary" disabled={system.status === "offline"}>
                     Manage Node
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
