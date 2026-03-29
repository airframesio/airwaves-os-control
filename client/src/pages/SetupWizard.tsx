import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wifi, WifiOff, Radio, MapPin, Globe, Check, ChevronRight, ChevronLeft,
  Loader2, Signal, Usb, CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiStatus } from "@/hooks/useApiStatus";
import {
  systemApi, wifiApi, hardwareApi, configApi,
  type WifiNetwork, type SdrDevice, type AirwavesConfig
} from "@/lib/api";

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Radio },
  { id: "network", title: "Network", icon: Wifi },
  { id: "hardware", title: "Hardware", icon: Usb },
  { id: "station", title: "Station", icon: MapPin },
  { id: "complete", title: "Complete", icon: Check },
];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const apiAvailable = useApiStatus();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Network state
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [networkConnected, setNetworkConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Hardware state
  const [sdrDevices, setSdrDevices] = useState<SdrDevice[]>([]);
  const [detectingHardware, setDetectingHardware] = useState(false);

  // Station state
  const [stationName, setStationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [operator, setOperator] = useState("");

  const progress = ((step + 1) / STEPS.length) * 100;

  const scanWifi = async () => {
    if (!apiAvailable) return;
    setScanning(true);
    try {
      const networks = await wifiApi.scan();
      setWifiNetworks(networks);
      // Check if already connected
      const status = await wifiApi.getStatus();
      setNetworkConnected(status.connected);
    } catch {
      // Offline or no WiFi
    } finally {
      setScanning(false);
    }
  };

  const connectWifi = async () => {
    if (!apiAvailable || !selectedSsid) return;
    setLoading(true);
    try {
      await wifiApi.connect(selectedSsid, wifiPassword || undefined);
      // Wait for connection
      await new Promise(r => setTimeout(r, 5000));
      const status = await wifiApi.getStatus();
      setNetworkConnected(status.connected);
    } catch {
      // Connection failed
    } finally {
      setLoading(false);
    }
  };

  const detectHardware = async () => {
    if (!apiAvailable) return;
    setDetectingHardware(true);
    try {
      const devices = await hardwareApi.listSdr();
      setSdrDevices(devices);
    } catch {
      // No devices
    } finally {
      setDetectingHardware(false);
    }
  };

  const useGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => {
        // Permission denied or unavailable
      }
    );
  };

  const finishSetup = async () => {
    if (!apiAvailable) {
      onComplete();
      return;
    }
    setLoading(true);
    try {
      const config = await configApi.get();
      const updated: AirwavesConfig = {
        ...config,
        device: {
          ...config.device,
          name: stationName || config.device.hostname,
        },
        station: {
          latitude: parseFloat(latitude) || 0,
          longitude: parseFloat(longitude) || 0,
          altitude_m: 0,
          operator: operator,
        },
      };
      await configApi.update(updated);
    } catch {
      // Best effort
    } finally {
      setLoading(false);
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <span className="text-muted-foreground">{STEPS[step].title}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          {step === 0 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome to Airwaves OS</CardTitle>
                <CardDescription className="text-base">
                  Let's get your radio station set up. This will only take a few minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 pt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("w-2 h-2 rounded-full", apiAvailable ? "bg-emerald-500" : "bg-amber-500")} />
                  {apiAvailable ? "System manager connected" : "Running in demo mode"}
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wifi className="w-5 h-5 text-primary" /> Network Setup</CardTitle>
                <CardDescription>Connect to your local network. Skip if already connected via Ethernet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {networkConnected ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="font-medium text-sm">Connected</div>
                      <div className="text-xs text-muted-foreground">Network is ready</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={scanWifi} disabled={scanning}>
                      {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Signal className="w-4 h-4 mr-2" />}
                      Scan for WiFi Networks
                    </Button>

                    {wifiNetworks.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {wifiNetworks.map(net => (
                          <div
                            key={net.ssid}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedSsid === net.ssid ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"
                            )}
                            onClick={() => setSelectedSsid(net.ssid)}
                          >
                            <div className="flex items-center gap-2">
                              <Signal className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{net.ssid}</span>
                              <Badge variant="secondary" className="text-[10px]">{net.security}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{net.signal} dBm</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedSsid && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label>Password for {selectedSsid}</Label>
                          <Input
                            type="password"
                            placeholder="WiFi password"
                            value={wifiPassword}
                            onChange={e => setWifiPassword(e.target.value)}
                          />
                        </div>
                        <Button className="w-full" onClick={connectWifi} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
                          Connect
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Usb className="w-5 h-5 text-primary" /> Hardware Detection</CardTitle>
                <CardDescription>Detecting connected SDR devices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" onClick={detectHardware} disabled={detectingHardware}>
                  {detectingHardware ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Radio className="w-4 h-4 mr-2" />}
                  Detect SDR Devices
                </Button>

                {sdrDevices.length > 0 ? (
                  <div className="space-y-2">
                    {sdrDevices.map(dev => (
                      <div key={dev.id} className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                          <div className="font-medium text-sm">{dev.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {dev.device_type} {dev.serial && `• ${dev.serial}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !detectingHardware ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    <Usb className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No SDR devices detected yet. Plug in a USB SDR and click detect.
                  </div>
                ) : null}
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Station Identity</CardTitle>
                <CardDescription>Your location helps aggregators map received signals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Station Name</Label>
                  <Input
                    placeholder="My Radio Station"
                    value={stationName}
                    onChange={e => setStationName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Latitude</Label>
                    <Input
                      placeholder="37.7749"
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Longitude</Label>
                    <Input
                      placeholder="-122.4194"
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                    />
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={useGeolocation}>
                  <MapPin className="w-4 h-4 mr-2" /> Use Browser Location
                </Button>

                <div className="space-y-1">
                  <Label>Operator / Callsign <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    placeholder="KE7ABC"
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl">You're All Set!</CardTitle>
                <CardDescription className="text-base">
                  Your Airwaves OS station is configured and ready.
                  {sdrDevices.length > 0 && ` ${sdrDevices.length} SDR device${sdrDevices.length > 1 ? 's' : ''} detected.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-sm">
                  {stationName && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Station</span>
                      <span className="font-medium">{stationName}</span>
                    </div>
                  )}
                  {latitude && longitude && (
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-mono text-xs">{latitude}, {longitude}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">SDR Devices</span>
                    <span className="font-medium">{sdrDevices.length} detected</span>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => {
              setStep(s => s + 1);
              // Trigger auto-detection on hardware step
              if (step + 1 === 2) detectHardware();
            }}>
              {step === 0 ? "Get Started" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finishSetup} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
