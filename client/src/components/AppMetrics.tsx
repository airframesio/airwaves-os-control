import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Network,
  Radio,
  Server,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContainerStats, FeedConfig } from "@/lib/api";

type MetricsApp = {
  id: string;
  name: string;
  status: string;
  cpuUsage?: number;
  memoryUsage?: number;
  messageRate?: number;
  memoryLimit?: number;
  uptime?: string;
  assignedDevice?: string;
  ports?: Array<{
    container_port: number;
    host_port: number | null;
    protocol: string;
  }>;
  outputs?: Array<{
    kind: string;
    label: string;
    description?: string;
    protocol?: string;
    port?: number;
  }>;
};

type Sample = {
  timestamp: number;
  time: string;
  cpu: number;
  memoryMb: number;
  memoryPct: number;
  rxBytes: number;
  txBytes: number;
  readBytes: number;
  writeBytes: number;
  rxRate: number;
  txRate: number;
  readRate: number;
  writeRate: number;
  messageRate: number;
};

function bytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let next = value;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  return `${next >= 10 || index === 0 ? next.toFixed(0) : next.toFixed(1)} ${units[index]}`;
}

function rate(value: number) {
  return `${bytes(value)}/s`;
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function mb(value: number) {
  return Math.round(value / (1024 * 1024));
}

function nowLabel(date = new Date()) {
  return date.toLocaleTimeString([], {
    minute: "2-digit",
    second: "2-digit",
  });
}

function nextSample(
  app: MetricsApp,
  stats: ContainerStats | null | undefined,
  previous?: Sample,
): Sample {
  const timestamp = Date.now();
  const cpu = stats?.cpu_percent ?? app.cpuUsage ?? 0;
  const memoryBytes =
    stats?.memory_used ?? (app.memoryUsage ?? 0) * 1024 * 1024;
  const memoryLimitBytes =
    stats?.memory_limit ?? (app.memoryLimit ?? 0) * 1024 * 1024;
  const elapsed = previous
    ? Math.max(1, (timestamp - previous.timestamp) / 1000)
    : 0;
  const rxBytes = stats?.network_rx_bytes ?? 0;
  const txBytes = stats?.network_tx_bytes ?? 0;
  const readBytes = stats?.block_read_bytes ?? 0;
  const writeBytes = stats?.block_write_bytes ?? 0;

  return {
    timestamp,
    time: nowLabel(new Date(timestamp)),
    cpu,
    memoryMb: mb(memoryBytes),
    memoryPct: memoryLimitBytes ? (memoryBytes / memoryLimitBytes) * 100 : 0,
    rxBytes,
    txBytes,
    readBytes,
    writeBytes,
    rxRate:
      previous && rxBytes >= previous.rxBytes
        ? (rxBytes - previous.rxBytes) / elapsed
        : 0,
    txRate:
      previous && txBytes >= previous.txBytes
        ? (txBytes - previous.txBytes) / elapsed
        : 0,
    readRate:
      previous && readBytes >= previous.readBytes
        ? (readBytes - previous.readBytes) / elapsed
        : 0,
    writeRate:
      previous && writeBytes >= previous.writeBytes
        ? (writeBytes - previous.writeBytes) / elapsed
        : 0,
    messageRate: app.messageRate ?? 0,
  };
}

function tooltipStyle() {
  return {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  };
}

export default function AppMetrics({
  app,
  stats,
  feeds = [],
  apiAvailable,
}: {
  app: MetricsApp;
  stats?: ContainerStats | null;
  feeds?: FeedConfig[];
  apiAvailable: boolean;
}) {
  const liveStatsAvailable = apiAvailable && !!stats;
  const [samples, setSamples] = useState<Sample[]>(() => [
    nextSample(app, stats),
  ]);

  useEffect(() => {
    setSamples([nextSample(app, stats)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  useEffect(() => {
    setSamples((current) => {
      const sample = nextSample(app, stats, current[current.length - 1]);
      const last = current[current.length - 1];
      if (
        last &&
        sample.cpu === last.cpu &&
        sample.memoryMb === last.memoryMb &&
        sample.rxBytes === last.rxBytes &&
        sample.txBytes === last.txBytes &&
        sample.readBytes === last.readBytes &&
        sample.writeBytes === last.writeBytes &&
        sample.messageRate === last.messageRate
      ) {
        return current;
      }
      return [...current, sample].slice(-30);
    });
  }, [
    app.cpuUsage,
    app.memoryUsage,
    app.messageRate,
    stats?.cpu_percent,
    stats?.memory_used,
    stats?.memory_limit,
    stats?.network_rx_bytes,
    stats?.network_tx_bytes,
    stats?.block_read_bytes,
    stats?.block_write_bytes,
  ]);

  const latest = samples[samples.length - 1] ?? nextSample(app, stats);
  const publishedPorts = app.ports?.filter((port) => port.host_port) ?? [];
  const outputKinds = Array.from(
    new Set((app.outputs ?? []).map((output) => output.kind)),
  );
  const totalRx = stats?.network_rx_bytes ?? latest.rxBytes;
  const totalTx = stats?.network_tx_bytes ?? latest.txBytes;
  const totalRead = stats?.block_read_bytes ?? latest.readBytes;
  const totalWrite = stats?.block_write_bytes ?? latest.writeBytes;

  const resourceSummary = useMemo(
    () => [
      {
        label: "CPU",
        value: pct(latest.cpu),
        detail: liveStatsAvailable ? "Live Docker stats" : "Demo estimate",
        icon: Cpu,
      },
      {
        label: "Memory",
        value: `${latest.memoryMb} MB`,
        detail: latest.memoryPct
          ? `${pct(latest.memoryPct)} of limit`
          : "Limit unavailable",
        icon: Database,
      },
      {
        label: "Network",
        value: rate(latest.rxRate + latest.txRate),
        detail: `${bytes(totalRx)} in / ${bytes(totalTx)} out`,
        icon: Network,
      },
      {
        label: "Disk I/O",
        value: rate(latest.readRate + latest.writeRate),
        detail: `${bytes(totalRead)} read / ${bytes(totalWrite)} written`,
        icon: HardDrive,
      },
    ],
    [
      latest.cpu,
      latest.memoryMb,
      latest.memoryPct,
      latest.readRate,
      latest.rxRate,
      latest.txRate,
      latest.writeRate,
      liveStatsAvailable,
      totalRead,
      totalRx,
      totalTx,
      totalWrite,
    ],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Runtime Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Live container telemetry sampled from the Airwaves manager.
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            liveStatsAvailable
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
              : "border-amber-500/25 bg-amber-500/10 text-amber-500"
          }
        >
          {liveStatsAvailable ? "Live Docker stats" : "Demo / offline data"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {resourceSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold">
                    {item.value}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Resource History
            </CardTitle>
            <CardDescription>
              CPU percentage and memory use from recent manager polls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={samples}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="CPU %"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryMb"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name="Memory MB"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <CardDescription>
              Network and block I/O rates derived from Docker byte counters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {liveStatsAvailable ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={samples}>
                    <defs>
                      <linearGradient
                        id="networkRate"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => bytes(Number(value))}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle()}
                      formatter={(value: number) => rate(Number(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="rxRate"
                      stroke="#10b981"
                      fill="url(#networkRate)"
                      name="Network RX"
                    />
                    <Area
                      type="monotone"
                      dataKey="txRate"
                      stroke="#f59e0b"
                      fill="transparent"
                      name="Network TX"
                    />
                    <Line
                      type="monotone"
                      dataKey="readRate"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                      name="Disk read"
                    />
                    <Line
                      type="monotone"
                      dataKey="writeRate"
                      stroke="#f472b6"
                      strokeWidth={2}
                      dot={false}
                      name="Disk write"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Connect to an Airwaves OS device to stream live network and disk
                throughput for this container.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Message Activity
            </CardTitle>
            <CardDescription>
              Decoder rate when the app reports message output.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">
                  {app.messageRate ?? 0}
                </span>
                <span className="pb-1 text-sm text-muted-foreground">/s</span>
              </div>
              <Progress
                value={Math.min(100, (app.messageRate ?? 0) / 5)}
                className="mt-3 h-1.5"
              />
            </div>
            {app.outputs?.length ? (
              <div className="flex flex-wrap gap-2">
                {outputKinds.map((kind) => (
                  <Badge key={kind} variant="outline" className="capitalize">
                    {kind}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This app does not declare message-producing outputs.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Runtime Details
            </CardTitle>
            <CardDescription>
              Container state and resource metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <MetricRow label="Status" value={app.status} icon={Activity} />
            <MetricRow
              label="Processes"
              value={stats?.pids != null ? String(stats.pids) : "-"}
              icon={Server}
            />
            <MetricRow
              label="Assigned SDR"
              value={app.assignedDevice || "Auto-select"}
              icon={Radio}
            />
            <MetricRow
              label="Published ports"
              value={
                publishedPorts.length
                  ? publishedPorts
                      .map(
                        (port) =>
                          `${port.host_port}→${port.container_port}/${port.protocol}`,
                      )
                      .join(", ")
                  : "none"
              }
              icon={Network}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Linked Feeds</CardTitle>
            <CardDescription>
              Feed records attached to this application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feeds.length ? (
              <div className="grid gap-2">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="rounded-md border border-border/60 bg-background/35 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{feed.name}</span>
                      <Badge variant={feed.enabled ? "default" : "secondary"}>
                        {feed.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {feed.protocol.toUpperCase()} {feed.host}:{feed.port}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                No feeds are linked to this app yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="max-w-[55%] break-all text-right font-mono">{value}</div>
    </div>
  );
}
