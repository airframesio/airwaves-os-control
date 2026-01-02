import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Check, ExternalLink, Loader2, Radio, Server } from "lucide-react";
import { mockApps, mockDevices } from "@/lib/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AppStore() {
  const [search, setSearch] = useState("");
  const categories = ["All", "Aviation", "Maritime", "Satcom", "Utility"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [installingApp, setInstallingApp] = useState<any | null>(null);
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const { toast } = useToast();

  const filteredApps = mockApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || 
                          app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || app.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const availableDevices = mockDevices.filter(d => d.status === "idle");

  const handleInstallClick = (app: any) => {
    setInstallingApp(app);
    setStep(1);
    setSelectedDevice("");
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      // Simulate installation
      setTimeout(() => {
        toast({
          title: "Installation Complete",
          description: `${installingApp.name} has been successfully installed.`,
        });
        setInstallingApp(null);
      }, 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Catalog</h1>
          <p className="text-muted-foreground mt-1">Discover and install radio decoders and utilities.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search apps..." 
            className="pl-9 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="All" className="w-full" onValueChange={setActiveCategory}>
        <TabsList className="bg-muted/50 p-1">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="px-4">{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map(app => (
          <Card key={app.id} className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors group">
            <CardHeader className="flex-row gap-4 items-start space-y-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <app.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                   {app.installed && <Badge variant="secondary" className="text-[10px] h-5">Installed</Badge>}
                </div>
                <CardDescription className="text-xs mt-1 capitalize">{app.category} • v{app.version}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {app.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              {app.installed ? (
                <Button variant="outline" className="w-full" disabled>
                  <Check className="w-4 h-4 mr-2" /> Installed
                </Button>
              ) : (
                <Button className="w-full shadow-lg shadow-primary/10" onClick={() => handleInstallClick(app)}>
                  <Download className="w-4 h-4 mr-2" /> Install
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Installation Wizard Dialog */}
      <Dialog open={!!installingApp} onOpenChange={(open) => !open && setInstallingApp(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Install {installingApp?.name}</DialogTitle>
            <DialogDescription>
              Configure and deploy this application to your system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                   <Server className="w-5 h-5 text-primary mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium">System Requirements</p>
                     <p className="text-muted-foreground mt-1">This app requires approximately 120MB of RAM and 5% CPU.</p>
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

            {step === 2 && (
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

            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-medium">Installing {installingApp?.name}...</p>
                <p className="text-sm text-muted-foreground">Pulling container images and configuring services.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {step < 3 && (
              <Button variant="outline" onClick={() => setInstallingApp(null)}>Cancel</Button>
            )}
            {step === 1 && (
              <Button onClick={handleNext}>Next</Button>
            )}
            {step === 2 && (
              <Button onClick={handleNext} disabled={availableDevices.length === 0 && !selectedDevice}>
                Install & Deploy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
