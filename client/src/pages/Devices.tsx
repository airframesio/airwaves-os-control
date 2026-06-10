import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  Grid2X2,
  List,
  Loader2,
  Radio,
  RefreshCw,
  Settings2,
  Usb,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useSdrDevices } from "@/hooks/useAirwavesApi";
import { demoModeEnabled } from "@/lib/demoMode";
import { mockDevices } from "@/lib/mockData";
import type { SdrDevice } from "@/lib/api";
import { cn } from "@/lib/utils";

type DeviceRow = {
  id: string;
  name: string;
  type: string;
  serial: string;
  physicalSerial: string;
  status: string;
  assignedApp?: string;
  vendorProduct?: string;
  isDemo?: boolean;
};

function titleCaseDeviceType(value: string): string {
  return value
    .replace(/_/g, "-")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function mapLiveDevice(device: SdrDevice): DeviceRow {
  return {
    id: device.id,
    name: device.configured_name ?? device.name,
    type: titleCaseDeviceType(device.device_type),
    serial: device.configured_serial ?? device.serial ?? "N/A",
    physicalSerial: device.serial ?? "N/A",
    status: device.status,
    assignedApp: device.assigned_to ?? undefined,
    vendorProduct: `${device.vendor_id.toString(16).padStart(4, "0")}:${device.product_id
      .toString(16)
      .padStart(4, "0")}`,
  };
}

function mapDemoDevice(device: (typeof mockDevices)[number]): DeviceRow {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    serial: device.serial,
    physicalSerial: device.serial,
    status: device.status,
    assignedApp: device.assignedApp,
    isDemo: true,
  };
}

function statusClasses(status: string): string {
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

function railClass(status: string): string {
  switch (status) {
    case "available":
    case "active":
      return "bg-emerald-500";
    case "assigned":
      return "bg-blue-500";
    case "ambiguous":
      return "bg-amber-500";
    case "conflict":
    case "error":
      return "bg-destructive";
    default:
      return "bg-muted";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export default function Devices() {
  const [, setLocation] = useLocation();
  const apiAvailable = useApiStatus();
  const [view, setView] = useState<"cards" | "list">("cards");
  const {
    data: liveDevices,
    isLoading: devicesLoading,
    isFetching: devicesFetching,
    refetch: refetchDevices,
  } = useSdrDevices();

  const devices = useMemo<DeviceRow[]>(() => {
    if (liveDevices?.length) return liveDevices.map(mapLiveDevice);
    if (demoModeEnabled) return mockDevices.map(mapDemoDevice);
    return [];
  }, [liveDevices]);

  const assignedCount = devices.filter((device) => !!device.assignedApp).length;
  const conflictCount = devices.filter((device) =>
    ["ambiguous", "conflict"].includes(device.status),
  ).length;

  const configureDevice = (device: DeviceRow) => {
    if (device.isDemo) return;
    setLocation(`/devices/${encodeURIComponent(device.id)}/config`);
  };

  const emptyTitle = apiAvailable ? "No SDR devices detected" : "Manager connection unavailable";
  const emptyDescription = apiAvailable
    ? "Plug in a supported SDR and scan again."
    : "The UI is keeping real data only. It will repopulate when the manager reconnects.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radio Devices</h1>
          <p className="text-muted-foreground mt-1">Manage connected SDR hardware, aliases, and assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border bg-card p-1">
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setView("cards")}
            >
              <Grid2X2 className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetchDevices()}>
            {devicesFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Scan Devices
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Detected SDRs</div>
            <div className="mt-1 text-2xl font-semibold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Assigned</div>
            <div className="mt-1 text-2xl font-semibold">{assignedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Needs Attention</div>
            <div className={cn("mt-1 text-2xl font-semibold", conflictCount ? "text-amber-600" : "")}>
              {conflictCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {!apiAvailable && !demoModeEnabled && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">Manager is currently unreachable.</div>
              <div className="text-muted-foreground">
                Demo fixtures are disabled for this install, so this page will only show real device data.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {devicesLoading && devices.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[220px] items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Scanning SDR hardware...
          </CardContent>
        </Card>
      ) : devices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Radio className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">{emptyTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
            </div>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id} className="relative overflow-hidden border-border/70 bg-card">
              <div className={cn("absolute left-0 top-0 h-full w-1", railClass(device.status))} />
              <CardHeader className="pb-3 pl-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Usb className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{device.name}</span>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      Serial: {device.serial}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={cn("capitalize", statusClasses(device.status))}>
                    {formatStatus(device.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pl-6">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{device.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">USB ID</span>
                    <span className="font-mono text-xs">{device.vendorProduct ?? "demo"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Assigned App</span>
                    {device.assignedApp ? (
                      <Badge variant="outline" className="max-w-[180px] truncate bg-primary/5 text-primary">
                        {device.assignedApp}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => configureDevice(device)}
                  disabled={device.isDemo}
                >
                  <Settings2 className="h-4 w-4" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned App</TableHead>
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="font-medium">{device.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{device.id}</div>
                  </TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{device.serial}</div>
                    {device.serial !== device.physicalSerial && (
                      <div className="text-xs text-muted-foreground">Physical: {device.physicalSerial}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusClasses(device.status))}>
                      {formatStatus(device.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{device.assignedApp ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => configureDevice(device)}
                      disabled={device.isDemo}
                    >
                      <Settings2 className="h-4 w-4" />
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

