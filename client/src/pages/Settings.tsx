import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Monitor, Shield, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { useConfig, useSystemInfo } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const apiAvailable = useApiStatus();
  const { data: config } = useConfig();
  const { data: sysInfo } = useSystemInfo();
  const hostname = config?.device?.hostname ?? "airwaves-station-1";
  const osVersion = sysInfo?.airwaves_version ?? "1.0.0";

  useEffect(() => {
    // Sync with HTML class
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global preferences and system parameters.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize how Airwaves OS looks on your display.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interface Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button 
                  variant={theme === 'light' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setTheme('light')}
                  className="w-8 h-8 p-0"
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setTheme('dark')}
                  className="w-8 h-8 p-0"
                >
                  <Moon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" /> Network & Host
            </CardTitle>
            <CardDescription>Hostname and network configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="hostname">Device Hostname</Label>
              <div className="flex gap-2">
                <Input id="hostname" defaultValue={hostname} />
                <Button>Save</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label className="text-base">SSH Access</Label>
                <p className="text-sm text-muted-foreground">Allow remote command line access.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Updates
            </CardTitle>
            <CardDescription>Manage software updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <div className="font-medium">Airwaves OS Core</div>
                 <div className="text-sm text-muted-foreground">Current: v{osVersion}</div>
               </div>
               <Button variant="outline" disabled>Up to date</Button>
             </div>
             <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                 <Label>Auto-update Apps</Label>
                 <p className="text-sm text-muted-foreground">Automatically install updates for containers.</p>
               </div>
               <Switch />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
