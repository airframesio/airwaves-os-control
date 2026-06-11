import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Cpu,
  RefreshCw,
  Save,
  Settings2,
  Usb,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useSdrDevices, useUpdateSdrDevice } from "@/hooks/useAirwavesApi";
import { useToast } from "@/hooks/use-toast";
import { demoModeEnabled } from "@/lib/demoMode";
import { mockDevices } from "@/lib/mockData";
import type { SdrDevice } from "@/lib/api";
import { cn } from "@/lib/utils";

type DeviceModel = {
  id: string;
  name: string;
  configuredName?: string | null;
  type: string;
  serial: string;
  configuredSerial?: string | null;
  physicalSerial: string;
  status: string;
  assignedApp?: string | null;
  vendorId?: number;
  productId?: number;
  isDemo?: boolean;
};

function titleCaseDeviceType(value: string): string {
  return value
    .replace(/_/g, "-")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function mapLiveDevice(device: SdrDevice): DeviceModel {
  return {
    id: device.id,
    name: device.configured_name ?? device.name,
    configuredName: device.configured_name,
    type: titleCaseDeviceType(device.device_type),
    serial: device.configured_serial ?? device.serial ?? "",
    configuredSerial: device.configured_serial,
    physicalSerial: device.serial ?? "",
    status: device.status,
    assignedApp: device.assigned_to,
    vendorId: device.vendor_id,
    productId: device.product_id,
  };
}

function statusClass(status: string): string {
  switch (status) {
    case "available":
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
    case "assigned":
      return "border-blue-500/30 bg-blue-500/10 text-blue-600";
    case "ambiguous":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600";
    case "conflict":
    case "error":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-muted bg-muted/50 text-muted-foreground";
  }
}

function formatHex(value?: number): string {
  if (value === undefined) return "N/A";
  return `0x${value.toString(16).padStart(4, "0")}`;
}

function safeDecode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function DeviceConfig() {
  const [, params] = useRoute("/devices/:id/config");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const apiAvailable = useApiStatus();
  const { data: liveSdrDevices, isLoading } = useSdrDevices();
  const updateSdr = useUpdateSdrDevice();
  const deviceId = safeDecode(params?.id);

  const device = useMemo<DeviceModel | undefined>(() => {
    const liveDevice = liveSdrDevices?.find((candidate) => candidate.id === deviceId);
    if (liveDevice) return mapLiveDevice(liveDevice);
    if (demoModeEnabled) {
      const mockDevice = mockDevices.find((candidate) => candidate.id === deviceId);
      if (mockDevice) {
        return {
          id: mockDevice.id,
          name: mockDevice.name,
          type: mockDevice.type,
          serial: mockDevice.serial,
          physicalSerial: mockDevice.serial,
          status: mockDevice.status,
          assignedApp: mockDevice.assignedApp,
          isDemo: true,
        };
      }
    }
    return undefined;
  }, [deviceId, liveSdrDevices]);

  const [form, setForm] = useState({ name: "", serial: "" });

  useEffect(() => {
    if (!device) return;
    setForm({
      name: device.name,
      serial: device.serial,
    });
  }, [device?.id, device?.name, device?.serial]);

  if (!device && isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Loading SDR device...
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Usb className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Device Not Found</h2>
          <p className="mt-1 text-muted-foreground">
            {apiAvailable
              ? "The selected SDR is no longer connected."
              : "The manager is disconnected and no cached device record is available."}
          </p>
        </div>
        <Button onClick={() => setLocation("/devices")}>Return to Devices</Button>
      </div>
    );
  }

  const canSave = apiAvailable && !device.isDemo && !!deviceId;
  const hasSerialAlias = !!device.configuredSerial && device.configuredSerial !== device.physicalSerial;

  const saveDevice = async () => {
    if (!canSave || !deviceId) return;
    try {
      await updateSdr.mutateAsync({
        id: deviceId,
        name: form.name.trim() || null,
        serial: form.serial.trim() || null,
      });
      toast({
        title: "Device updated",
        description: `${form.name.trim() || device.name} was saved.`,
      });
    } catch (err) {
      toast({
        title: "Could not save device",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const resetDevice = async () => {
    if (!canSave || !deviceId) return;
    try {
      await updateSdr.mutateAsync({ id: deviceId, name: null, serial: null });
      setForm({
        name: device.configuredName ? device.name : device.name,
        serial: device.physicalSerial,
      });
      toast({
        title: "Device reset",
        description: "Saved aliases were cleared.",
      });
    } catch (err) {
      toast({
        title: "Could not reset device",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/devices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{device.serial || "No serial label"}</span>
              {hasSerialAlias && (
                <>
                  <span>|</span>
                  <span className="font-mono">Physical {device.physicalSerial}</span>
                </>
              )}
              <Badge variant="outline" className={cn("capitalize", statusClass(device.status))}>
                {device.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={resetDevice}
            disabled={!canSave || updateSdr.isPending}
          >
            <RefreshCw className="h-4 w-4" />
            Reset Defaults
          </Button>
          <Button className="gap-2" onClick={saveDevice} disabled={!canSave || updateSdr.isPending}>
            {updateSdr.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {!apiAvailable && !demoModeEnabled && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">Manager is currently unreachable.</div>
              <div className="text-muted-foreground">Edits are disabled until the API reconnects.</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto border bg-card p-1">
              <TabsTrigger value="general" className="px-4">
                General
              </TabsTrigger>
              <TabsTrigger value="assignment" className="px-4">
                Assignment
              </TabsTrigger>
              <TabsTrigger value="driver" className="px-4">
                Driver
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    Device Identity
                  </CardTitle>
                  <CardDescription>Names and serial labels shown throughout Airwaves OS.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="device-name">Display Name</Label>
                      <Input
                        id="device-name"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        disabled={!canSave}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="device-serial">Serial Label</Label>
                      <Input
                        id="device-serial"
                        value={form.serial}
                        onChange={(event) => setForm((current) => ({ ...current, serial: event.target.value }))}
                        disabled={!canSave}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground">Physical Serial</div>
                      <div className="mt-1 font-mono">{device.physicalSerial || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Device ID</div>
                      <div className="mt-1 break-all font-mono text-xs">{device.id}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Current Assignment
                  </CardTitle>
                  <CardDescription>App bindings using this SDR.</CardDescription>
                </CardHeader>
                <CardContent>
                  {device.assignedApp ? (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{device.assignedApp}</div>
                        <div className="text-sm text-muted-foreground">Status: {device.status}</div>
                      </div>
                      <Badge variant="outline" className={cn("capitalize", statusClass(device.status))}>
                        {device.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No app is assigned to this SDR.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="driver" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    USB Driver Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <div className="mt-1 font-medium">{device.type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="mt-1 font-medium capitalize">{device.status.replace(/_/g, " ")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">USB Vendor ID</div>
                      <div className="mt-1 font-mono">{formatHex(device.vendorId)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">USB Product ID</div>
                      <div className="mt-1 font-mono">{formatHex(device.productId)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Usb className="h-5 w-5 text-primary" />
                Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connection</span>
                <Badge variant="outline" className={cn("capitalize", statusClass(device.status))}>
                  {device.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned App</span>
                <span className="font-medium">{device.assignedApp ?? "Unassigned"}</span>
              </div>
              <Separator className="bg-primary/10" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API</span>
                <span className={cn("font-medium", apiAvailable ? "text-emerald-600" : "text-amber-600")}>
                  {apiAvailable ? "Connected" : "Disconnected"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Configuration Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Saved labels identify the tuner in the UI while app SDR access continues to use the physical USB identity.</p>
              <p>App-specific gain, frequency, and decoder settings are configured from each app detail page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

