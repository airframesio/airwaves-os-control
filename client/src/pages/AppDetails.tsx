import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { mockApps, mockDevices } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Check, ExternalLink, Globe, HardDrive, Calendar, Server, Radio, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AppDetails() {
  const [match, params] = useRoute("/store/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [installing, setInstalling] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const app = mockApps.find(a => a.id === params?.id);
  const availableDevices = mockDevices.filter(d => d.status === "idle");

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">App not found</h2>
        <Button variant="outline" onClick={() => setLocation("/store")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
        </Button>
      </div>
    );
  }

  const handleInstallClick = () => {
    setInstallStep(1);
  };

  const handleNextStep = () => {
    if (installStep === 1) {
      setInstallStep(2);
    } else if (installStep === 2) {
      setInstallStep(3);
      // Simulate installation
      setTimeout(() => {
        toast({
          title: "Installation Complete",
          description: `${app.name} has been successfully installed.`,
        });
        setInstallStep(0);
        // In a real app, this would update the app status
      }, 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button 
        variant="ghost" 
        className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
        onClick={() => setLocation("/store")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
      </Button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-primary/10 flex items-center justify-center shadow-xl shadow-primary/5">
          <app.icon className="w-16 h-16 md:w-20 md:h-20 text-primary" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{app.name}</h1>
              <p className="text-xl text-muted-foreground mt-2">{app.description}</p>
            </div>
            
            <div className="flex gap-3">
              {app.installed ? (
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/20 bg-primary/5 text-primary" disabled>
                  <Check className="w-5 h-5 mr-2" /> Installed
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={handleInstallClick}>
                  <Download className="w-5 h-5 mr-2" /> Install App
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <Globe className="w-4 h-4" /> {app.developer || "Unknown Developer"}
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full capitalize">
              <Check className="w-4 h-4" /> {app.category}
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <HardDrive className="w-4 h-4" /> {app.size || "Unknown Size"}
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" /> Updated {app.lastUpdate || "Recently"}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Screenshots Section */}
      {app.screenshots && app.screenshots.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Screenshots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {app.screenshots.map((src, i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted/30 border border-border/50 overflow-hidden flex items-center justify-center relative group">
                {/* Fallback for mock images since actual files don't exist */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/10" />
                <app.icon className="w-12 h-12 text-muted-foreground/20 absolute group-hover:scale-110 transition-transform duration-500" />
                <span className="relative text-xs text-muted-foreground font-mono">Screenshot {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted/30 border border-border/50 overflow-hidden flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/10" />
                <app.icon className="w-12 h-12 text-muted-foreground/20 absolute group-hover:scale-110 transition-transform duration-500" />
                <span className="relative text-xs text-muted-foreground font-mono">Preview Image {i}</span>
              </div>
            ))}
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">About</h3>
            <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
              {app.longDescription || app.description}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Information</h3>
              
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono">{app.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{app.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Size</span>
                <span>{app.size || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Developer</span>
                <span className="text-right truncate max-w-[150px]">{app.developer || "Unknown"}</span>
              </div>
              
              {app.website && (
                <Button variant="outline" className="w-full mt-4" onClick={() => window.open(app.website, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Developer Website
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Installation Dialog */}
      <Dialog open={installStep > 0} onOpenChange={(open) => !open && setInstallStep(0)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Install {app.name}</DialogTitle>
            <DialogDescription>
              Configure and deploy this application to your system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {installStep === 1 && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                   <Server className="w-5 h-5 text-primary mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium">System Requirements</p>
                     <p className="text-muted-foreground mt-1">This app requires approximately {app.memoryUsage || 100}MB of RAM and {app.cpuUsage || 5}% CPU.</p>
                   </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                   <Radio className="w-5 h-5 text-primary mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium">Hardware Required</p>
                     <p className="text-muted-foreground mt-1">An RTL-SDR or compatible device is required to receive signals.</p>
                   </div>
                </div>
              </div>
            )}

            {installStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium">Assign Radio Device</label>
                   <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a device..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDevices.length > 0 ? (
                          availableDevices.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name} ({d.serial})</SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">No idle devices found</div>
                        )}
                      </SelectContent>
                   </Select>
                   {availableDevices.length === 0 && (
                     <p className="text-xs text-destructive mt-2">
                       No available devices found. Please plug in a new SDR or free up an existing one.
                     </p>
                   )}
                   {availableDevices.length > 0 && (
                     <p className="text-xs text-muted-foreground mt-1">
                       The selected device will be dedicated to this application.
                     </p>
                   )}
                </div>
              </div>
            )}

            {installStep === 3 && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-medium">Installing {app.name}...</p>
                <p className="text-sm text-muted-foreground">Pulling container images and configuring services.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {installStep < 3 && (
              <Button variant="outline" onClick={() => setInstallStep(0)}>Cancel</Button>
            )}
            {installStep === 1 && (
              <Button onClick={handleNextStep}>Next</Button>
            )}
            {installStep === 2 && (
              <Button onClick={handleNextStep} disabled={availableDevices.length === 0 && !selectedDevice}>
                Install & Deploy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
