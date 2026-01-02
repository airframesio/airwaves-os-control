import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, RefreshCw, Settings2, Usb } from "lucide-react";
import { mockDevices } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Devices() {
  const [_, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radio Devices</h1>
          <p className="text-muted-foreground mt-1">Manage connected SDR hardware and assignments.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Scan Devices
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDevices.map(device => (
          <Card key={device.id} className="relative overflow-hidden group border-border/50 bg-card/50 backdrop-blur-sm">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              device.status === "active" ? "bg-emerald-500" : "bg-muted"
            )} />
            <CardHeader className="pl-6 pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Usb className="w-4 h-4 text-muted-foreground" />
                    {device.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">Serial: {device.serial}</CardDescription>
                </div>
                <Badge variant={device.status === "active" ? "default" : "secondary"}>
                  {device.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pl-6 pt-4">
               <div className="space-y-4">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">Type</span>
                   <span className="font-medium">{device.type}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-muted-foreground">Assigned App</span>
                   {device.assignedApp ? (
                     <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                       {device.assignedApp}
                     </Badge>
                   ) : (
                     <span className="text-muted-foreground italic">Unassigned</span>
                   )}
                 </div>
                 
                 <div className="pt-4 flex gap-2">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="w-full"
                     onClick={() => setLocation(`/devices/${device.id}/config`)}
                   >
                     <Settings2 className="w-3 h-3 mr-2" /> Configure
                   </Button>
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Placeholder for "Plug in new device" */}
        <Card className="border-dashed border-2 border-muted flex items-center justify-center min-h-[200px] bg-transparent hover:bg-muted/10 transition-colors">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Radio className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-muted-foreground">No other devices detected</h3>
            <p className="text-xs text-muted-foreground/60 max-w-[200px]">Plug in a USB SDR to auto-detect</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
