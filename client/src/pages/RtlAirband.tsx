import { useMemo, type ComponentType } from "react";
import { Link } from "wouter";
import {
  Activity,
  Cast,
  ExternalLink,
  FileText,
  Headphones,
  Network,
  Radio as RadioIcon,
  Settings,
  Signal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAppCatalog,
  useConfig,
  useContainerLogs,
  useContainers,
  useFeeds,
} from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import { cn } from "@/lib/utils";

const AIRBAND_IDS = new Set(["rtl-airband", "rtl_airband"]);

function normalizeAppId(id: string) {
  return id.replace(/^airwaves-/, "").replace(/^\//, "");
}

function configAppsById(config: any): Map<string, any> {
  const raw = config?.apps;
  if (Array.isArray(raw)) return new Map(raw.map((app) => [app.id, app]));
  if (raw && typeof raw === "object") return new Map(Object.entries(raw));
  return new Map();
}

function splitList(value?: string) {
  return (value ?? "")
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function RtlAirband() {
  const apiAvailable = useApiStatus();
  const { data: containers } = useContainers();
  const { data: catalog } = useAppCatalog();
  const { data: config } = useConfig();
  const { data: feeds } = useFeeds();

  const airbandCatalog = catalog?.find((app) => AIRBAND_IDS.has(app.id));
  const airbandContainer = containers?.find((container) =>
    AIRBAND_IDS.has(normalizeAppId(container.name)),
  );
  const installedRecords = configAppsById(config);
  const installedRecord =
    installedRecords.get("rtl-airband") ?? installedRecords.get("rtl_airband");
  const env: Record<string, string> =
    installedRecord?.env ?? airbandCatalog?.env ?? {};

  const isInstalled = !!airbandContainer || !apiAvailable;
  const isRunning = airbandContainer?.state === "running" || !apiAvailable;
  const hostPort =
    airbandContainer?.ports?.find((port) => port.host_port)?.host_port ??
    airbandCatalog?.ports?.find((port) => port.host_port)?.host_port ??
    8000;
  const streamBaseUrl =
    apiAvailable && airbandContainer
      ? `${window.location.protocol}//${window.location.hostname}:${hostPort}`
      : "http://stream.airwaves.local:8000";
  const containerName =
    airbandContainer?.name.replace(/^\//, "") ?? "airwaves-rtl-airband";
  const { data: logData } = useContainerLogs(
    apiAvailable && airbandContainer ? containerName : "",
    300,
  );
  const logLines = (logData?.logs ?? "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const assignedSdr =
    env.RTLSDRAIRBAND_SERIAL || env.SDR_SERIAL || env.DEVICE || "";
  const gain = env.RTLSDRAIRBAND_GAIN || env.GAIN || "catalog default";
  const timezone = env.TZ || "UTC";
  const configuredFrequencies = splitList(
    env.RTLSDRAIRBAND_CHANNELS || env.RTLSDRAIRBAND_FREQUENCIES,
  );
  const linkedFeeds = (feeds ?? []).filter((feed) =>
    AIRBAND_IDS.has(feed.app_id ?? ""),
  );

  const streams = useMemo(() => {
    const mountValues = splitList(
      env.RTLSDRAIRBAND_MOUNTS || env.ICECAST_MOUNT,
    );
    const mounts = mountValues.length ? mountValues : [""];
    return mounts.map((mount, index) => ({
      id: `${mount || "root"}-${index}`,
      name: mount ? mount.replace(/^\//, "") : "Primary rtl_airband stream",
      mount: mount || "/",
      url: mount
        ? `${streamBaseUrl}${mount.startsWith("/") ? mount : `/${mount}`}`
        : streamBaseUrl,
      status: isRunning ? "live" : "offline",
    }));
  }, [env.ICECAST_MOUNT, env.RTLSDRAIRBAND_MOUNTS, isRunning, streamBaseUrl]);

  if (apiAvailable && !isInstalled) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadioIcon className="h-5 w-5 text-primary" />
              Airband is not installed
            </CardTitle>
            <CardDescription>
              The Airband page is bundled with apps that provide the Airband
              control feature. Install rtl_airband to unlock this page in the
              navigation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/store/rtl-airband">
              <Button>Install rtl_airband</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <RadioIcon className="h-8 w-8 text-primary" />
            Airband
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Bundled control page provided by rtl_airband. Monitor service
            status, stream endpoints, install-time settings, linked feeds, and
            live container logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "h-9 gap-2 px-4 text-sm font-normal",
              isRunning
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/20 bg-amber-500/10 text-amber-500",
            )}
          >
            <Activity className="h-4 w-4" />
            {isRunning ? "rtl_airband running" : "rtl_airband stopped"}
          </Badge>
          <a href={streamBaseUrl} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Stream
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Signal}
          label="Container"
          value={airbandContainer?.state ?? "demo"}
          detail={containerName}
        />
        <SummaryCard
          icon={Network}
          label="Stream endpoint"
          value={`:${hostPort}`}
          detail={streamBaseUrl}
        />
        <SummaryCard
          icon={RadioIcon}
          label="Assigned SDR"
          value={assignedSdr || "Auto-select"}
          detail="Install-time radio binding"
        />
        <SummaryCard
          icon={Settings}
          label="Gain"
          value={gain}
          detail={`Timezone ${timezone}`}
        />
      </div>

      <Tabs defaultValue="streams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams" className="gap-2">
            <Cast className="h-4 w-4" /> Streams
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" /> Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Audio Streams</CardTitle>
              <CardDescription>
                Stream endpoints exposed by the rtl_airband container. Mount
                names come from installed environment values when available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stream</TableHead>
                    <TableHead>Mount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streams.map((stream) => (
                    <TableRow key={stream.id}>
                      <TableCell className="font-medium">
                        {stream.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {stream.mount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            stream.status === "live"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : ""
                          }
                        >
                          {stream.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[24rem] truncate font-mono text-xs text-muted-foreground">
                        {stream.url}
                      </TableCell>
                      <TableCell className="text-right">
                        <a href={stream.url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">
                            <Headphones className="mr-2 h-4 w-4" />
                            Listen
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked Feed Records</CardTitle>
              <CardDescription>
                Feed records connected to rtl_airband. These are managed from
                the install wizard or Feeds page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedFeeds.length ? (
                <div className="grid gap-2">
                  {linkedFeeds.map((feed) => (
                    <div
                      key={feed.id}
                      className="rounded-md border border-border/60 bg-muted/20 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{feed.name}</span>
                        <Badge variant={feed.enabled ? "default" : "secondary"}>
                          {feed.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {feed.protocol.toUpperCase()} {feed.host}:{feed.port}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  No Airband feed records exist yet. Add one from the Feeds page
                  if you forward or publish this stream externally.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Installed rtl_airband Configuration</CardTitle>
              <CardDescription>
                Values recorded by the app install flow and passed to the
                container. Editing these requires reinstalling or adding a
                manager-side config endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 text-sm">
                <ConfigRow
                  label="SDR serial"
                  value={assignedSdr || "Auto-select"}
                />
                <ConfigRow label="Gain" value={gain} />
                <ConfigRow label="Timezone" value={timezone} />
                <ConfigRow
                  label="Image"
                  value={
                    airbandContainer?.image ?? airbandCatalog?.image ?? "-"
                  }
                />
                <ConfigRow label="Container" value={containerName} />
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold">Configured Frequencies</h3>
                {configuredFrequencies.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {configuredFrequencies.map((frequency) => (
                      <Badge
                        key={frequency}
                        variant="outline"
                        className="font-mono"
                      >
                        {frequency} MHz
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No channel/frequency list is exposed in the current catalog
                    defaults. The container will use its bundled rtl_airband
                    configuration unless the install metadata provides channel
                    environment values.
                  </p>
                )}
              </div>

              {airbandCatalog?.config_fields?.length ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold">Catalog Install Fields</h3>
                    <div className="mt-3 grid gap-2 text-sm">
                      {airbandCatalog.config_fields.map((field) => (
                        <ConfigRow
                          key={field.key}
                          label={field.label}
                          value={env[field.key] || field.default || "-"}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>rtl_airband Logs</CardTitle>
              <CardDescription>
                Live container logs from {containerName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[32rem] overflow-auto rounded-md border border-border/60 bg-black p-4 font-mono text-xs text-zinc-300">
                {logLines.length ? (
                  logLines.map((line, index) => (
                    <div
                      key={`${index}-${line}`}
                      className="whitespace-pre-wrap break-all"
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500">
                    {apiAvailable
                      ? "No rtl_airband log output is available yet."
                      : "Connect to a device to stream rtl_airband logs."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-bold">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        </div>
        <div className="rounded-md bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right font-mono">{value || "-"}</dd>
    </div>
  );
}
