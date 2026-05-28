import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Moon, Sun, Monitor, Shield, Network, Loader2, Wifi, WifiOff, Signal,
  Download, Upload, HardDrive, RotateCcw, CheckCircle2
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useConfig, useUpdateConfig, useSystemInfo } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useManagerEvents } from "@/hooks/useManagerEvents";
import { useToast } from "@/hooks/use-toast";
import { wifiApi, configApi, type WifiStatus, type WifiNetwork } from "@/lib/api";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const apiAvailable = useApiStatus();
  const { data: config } = useConfig();
  const { data: sysInfo } = useSystemInfo();
  const updateConfig = useUpdateConfig();
  const { connected: wsConnected } = useManagerEvents();
  const { toast } = useToast();
  const hostnameRef = useRef<HTMLInputElement>(null);

  const hostname = config?.device?.hostname ?? "airwaves-station-1";
  const osVersion = sysInfo?.airwaves_version ?? "1.0.0";
  const osCodename = sysInfo?.airwaves_codename;
  const osBuildInfo = sysInfo
    ? [
        sysInfo.airwaves_board && `board ${sysInfo.airwaves_board}`,
        sysInfo.os,
        sysInfo.airwaves_build_date && `built ${sysInfo.airwaves_build_date.split("T")[0]}`,
      ]
        .filter(Boolean)
        .join(" • ")
    : "";

  // WiFi state
  const [wifiStatus, setWifiStatus] = useState<WifiStatus | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [wifiScanning, setWifiScanning] = useState(false);
  const [wifiConnecting, setWifiConnecting] = useState(false);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  // Backup state
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Fetch WiFi status on load
  useEffect(() => {
    if (apiAvailable) {
      wifiApi.getStatus().then(setWifiStatus).catch(() => {});
    }
  }, [apiAvailable]);

  const handleSaveHostname = () => {
    const newHostname = hostnameRef.current?.value?.trim();
    if (!newHostname || !config) return;
    if (apiAvailable) {
      updateConfig.mutate(
        { ...config, device: { ...config.device, hostname: newHostname } },
        {
          onSuccess: () => toast({ title: "Hostname Updated", description: `Set to ${newHostname}. Reboot to apply.` }),
          onError: (err) => toast({ title: "Save Failed", description: String(err), variant: "destructive" }),
        }
      );
    }
  };

  const scanWifi = async () => {
    setWifiScanning(true);
    try {
      const networks = await wifiApi.scan();
      setWifiNetworks(networks);
    } catch { /* no wifi */ }
    finally { setWifiScanning(false); }
  };

  const connectWifi = async () => {
    if (!selectedSsid) return;
    setWifiConnecting(true);
    try {
      await wifiApi.connect(selectedSsid, wifiPassword || undefined);
      await new Promise(r => setTimeout(r, 5000));
      const status = await wifiApi.getStatus();
      setWifiStatus(status);
      toast({ title: "WiFi Connected", description: `Connected to ${selectedSsid}` });
      setSelectedSsid("");
      setWifiPassword("");
      setWifiNetworks([]);
    } catch {
      toast({ title: "Connection Failed", variant: "destructive" });
    } finally { setWifiConnecting(false); }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const backup = await configApi.backup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `airwaves-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup Downloaded" });
    } catch {
      toast({ title: "Backup Failed", variant: "destructive" });
    } finally { setBackingUp(false); }
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setRestoring(true);
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        await configApi.restore(backup);
        toast({ title: "Restore Complete", description: "Configuration restored. Reboot recommended." });
      } catch {
        toast({ title: "Restore Failed", description: "Invalid backup file.", variant: "destructive" });
      } finally { setRestoring(false); }
    };
    input.click();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global preferences and system parameters.</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize how Airwaves OS looks on your display.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interface Theme</Label>
                <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button variant={theme === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('light')} className="w-8 h-8 p-0">
                  <Sun className="w-4 h-4" />
                </Button>
                <Button variant={theme === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('dark')} className="w-8 h-8 p-0">
                  <Moon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network & Host */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" /> Network & Host
            </CardTitle>
            <CardDescription>Hostname, WiFi, and connection status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="hostname">Device Hostname</Label>
              <div className="flex gap-2">
                <Input id="hostname" ref={hostnameRef} defaultValue={hostname} key={hostname} />
                <Button onClick={handleSaveHostname} disabled={updateConfig.isPending}>
                  {updateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* WiFi Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    {wifiStatus?.connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    WiFi
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {wifiStatus?.connected ? `Connected to ${wifiStatus.ssid}` :
                     wifiStatus?.enabled ? "Not connected" : "No WiFi adapter detected"}
                  </p>
                </div>
                {apiAvailable && wifiStatus?.enabled && (
                  <Button variant="outline" size="sm" onClick={scanWifi} disabled={wifiScanning}>
                    {wifiScanning ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Signal className="w-3 h-3 mr-1" />}
                    Scan
                  </Button>
                )}
              </div>

              {wifiNetworks.length > 0 && (
                <div className="space-y-2">
                  {wifiNetworks.slice(0, 5).map(net => (
                    <div
                      key={net.ssid}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedSsid === net.ssid ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSsid(net.ssid)}
                    >
                      <div className="flex items-center gap-2">
                        <Signal className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{net.ssid}</span>
                        {net.connected && <Badge variant="secondary" className="text-[10px]">Current</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{net.signal} dBm</span>
                    </div>
                  ))}

                  {selectedSsid && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        type="password"
                        placeholder="Password"
                        value={wifiPassword}
                        onChange={e => setWifiPassword(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={connectWifi} disabled={wifiConnecting} size="sm">
                        {wifiConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SSH Access</Label>
                <p className="text-sm text-muted-foreground">Allow remote command line access.</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Manager Connection</Label>
                <p className="text-sm text-muted-foreground">Real-time link to system manager.</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : apiAvailable ? 'bg-amber-500' : 'bg-zinc-500'}`} />
                <span className="text-muted-foreground">
                  {wsConnected ? 'Live' : apiAvailable ? 'REST only' : 'Offline'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
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
                <div className="text-sm text-muted-foreground">
                  Current: v{osVersion}{osCodename ? ` “${osCodename}”` : ""}
                </div>
                {osBuildInfo && (
                  <div className="text-xs text-muted-foreground/70 mt-0.5">{osBuildInfo}</div>
                )}
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

        {/* Backup & Restore */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" /> Backup & Restore
            </CardTitle>
            <CardDescription>Export or import your full system configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Export Backup</Label>
                <p className="text-sm text-muted-foreground">Download system config and catalog as JSON.</p>
              </div>
              <Button variant="outline" onClick={handleBackup} disabled={backingUp || !apiAvailable}>
                {backingUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Restore from Backup</Label>
                <p className="text-sm text-muted-foreground">Import a previously exported backup file.</p>
              </div>
              <Button variant="outline" onClick={handleRestore} disabled={restoring || !apiAvailable}>
                {restoring ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Import
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Reset Setup Wizard</Label>
                <p className="text-sm text-muted-foreground">Show the first-boot setup wizard again.</p>
              </div>
              <Button variant="outline" onClick={() => {
                localStorage.removeItem('airwaves_setup_complete');
                toast({ title: "Setup Reset", description: "Reload the page to see the setup wizard." });
              }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
