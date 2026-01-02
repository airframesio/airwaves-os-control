import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockDevices } from "@/lib/mockData";
import { ArrowLeft, Save, Sliders, Waves, Activity, RefreshCw, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import DeviceMetrics from "@/components/DeviceMetrics";

export default function DeviceConfig() {
  const [, params] = useRoute("/devices/:id/config");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const deviceId = params?.id;
  const device = mockDevices.find(d => d.id === deviceId);

  // Mock configuration state
  const [config, setConfig] = useState({
    gain: "auto",
    sampleRate: "2.4",
    biasTee: false,
    frequencyCorrection: 0,
    directSampling: "disabled",
    bandwidth: "0",
  });

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] space-y-4">
        <h2 className="text-2xl font-bold">Device Not Found</h2>
        <Button onClick={() => setLocation("/devices")}>Return to Devices</Button>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Configuration Saved",
      description: `Settings for ${device.name} have been updated successfully.`,
    });
    // In a real app, this would make an API call
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/devices")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="font-mono">{device.serial}</span>
              <span>•</span>
              <span className={cn(
                "flex items-center gap-1.5",
                device.status === "active" ? "text-emerald-500" : "text-muted-foreground"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", device.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                {device.status === "active" ? "Active" : device.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="gap-2">
             <RefreshCw className="w-4 h-4" /> Reset Defaults
           </Button>
           <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
             <Save className="w-4 h-4" /> Save Changes
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-card border border-border/50 p-1 w-full justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="general" className="px-4">General</TabsTrigger>
              <TabsTrigger value="advanced" className="px-4">Advanced</TabsTrigger>
              <TabsTrigger value="metrics" className="px-4">Metrics</TabsTrigger>
              <TabsTrigger value="driver" className="px-4">Driver Info</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    Gain Control
                  </CardTitle>
                  <CardDescription>Adjust the signal amplification settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Gain Mode</Label>
                      <Select 
                        value={config.gain} 
                        onValueChange={(v) => setConfig({...config, gain: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gain mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatic (AGC)</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="linearity">Linearity</SelectItem>
                          <SelectItem value="sensitivity">Sensitivity</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Automatic Gain Control handles varying signal strengths automatically.</p>
                    </div>

                    {config.gain === "manual" && (
                      <div className="space-y-2">
                        <Label>RF Gain (dB)</Label>
                        <Input type="number" placeholder="45.0" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-primary" />
                    Sampling Settings
                  </CardTitle>
                  <CardDescription>Configure sample rates and correction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Sample Rate</Label>
                      <Select 
                        value={config.sampleRate} 
                        onValueChange={(v) => setConfig({...config, sampleRate: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.25">0.25 MSPS</SelectItem>
                          <SelectItem value="0.9">0.9 MSPS</SelectItem>
                          <SelectItem value="1.024">1.024 MSPS</SelectItem>
                          <SelectItem value="1.4">1.4 MSPS</SelectItem>
                          <SelectItem value="1.8">1.8 MSPS</SelectItem>
                          <SelectItem value="2.048">2.048 MSPS</SelectItem>
                          <SelectItem value="2.4">2.4 MSPS</SelectItem>
                          <SelectItem value="3.2">3.2 MSPS (Unstable)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       <Label>Frequency Correction (PPM)</Label>
                       <div className="flex gap-2">
                         <Input 
                           type="number" 
                           value={config.frequencyCorrection}
                           onChange={(e) => setConfig({...config, frequencyCorrection: parseInt(e.target.value) || 0})}
                         />
                       </div>
                       <p className="text-xs text-muted-foreground">Compensate for oscillator drift.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6 space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                 <CardHeader>
                   <CardTitle>Hardware Features</CardTitle>
                   <CardDescription>Control specific hardware capabilities of the RTL-SDR.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                      <div className="space-y-0.5">
                        <Label className="text-base">Bias Tee</Label>
                        <p className="text-sm text-muted-foreground">Enable 4.5V DC output on the antenna port (for LNA).</p>
                      </div>
                      <Switch 
                        checked={config.biasTee}
                        onCheckedChange={(c) => setConfig({...config, biasTee: c})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Direct Sampling Mode</Label>
                      <Select 
                        value={config.directSampling} 
                        onValueChange={(v) => setConfig({...config, directSampling: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Disabled</SelectItem>
                          <SelectItem value="i-branch">I-Branch (Q-ADC disabled)</SelectItem>
                          <SelectItem value="q-branch">Q-Branch (I-ADC disabled)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Allows receiving HF frequencies (0-28MHz) without an upconverter.</p>
                    </div>
                 </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-6">
              <DeviceMetrics />
            </TabsContent>
            
            <TabsContent value="driver" className="mt-6">
               <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                 <CardHeader>
                   <CardTitle>Driver Information</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="font-medium text-muted-foreground">Driver Version</div>
                       <div className="font-mono">librtlsdr 0.6.0-replit</div>
                       
                       <div className="font-medium text-muted-foreground">Kernel Module</div>
                       <div className="font-mono">dvb_usb_rtl28xxu (blacklisted)</div>
                       
                       <div className="font-medium text-muted-foreground">USB Vendor ID</div>
                       <div className="font-mono">0x0bda</div>
                       
                       <div className="font-medium text-muted-foreground">USB Product ID</div>
                       <div className="font-mono">0x2838</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-mono font-medium">42°C</span>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Signal Level</span>
                 <div className="flex items-center gap-2">
                   <div className="flex gap-0.5 h-3 items-end">
                     <div className="w-1 bg-primary h-[30%] animate-pulse"></div>
                     <div className="w-1 bg-primary h-[50%] animate-pulse delay-75"></div>
                     <div className="w-1 bg-primary h-[70%] animate-pulse delay-100"></div>
                     <div className="w-1 bg-primary/30 h-[100%]"></div>
                   </div>
                   <span className="font-mono font-medium">-12 dBFS</span>
                 </div>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Dropped Samples</span>
                <span className="font-mono font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assigned Application</CardTitle>
            </CardHeader>
            <CardContent>
              {device.assignedApp ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-medium">{device.assignedApp}</div>
                    <div className="text-xs text-muted-foreground">Running</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No application assigned
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
