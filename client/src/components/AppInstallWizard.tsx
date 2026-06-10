import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Radio,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Network,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useSdrDevices } from "@/hooks/useAirwavesApi";
import type { CatalogApp, ConfigField, FeedConfig, SdrDevice } from "@/lib/api";

const SDR_ID_ENV_PREFIX = "AIRWAVES_SDR_ID__";
const sdrIdEnvKey = (fieldKey: string) => `${SDR_ID_ENV_PREFIX}${fieldKey}`;

const serialFromSdrValue = (value: string): string => {
  const serialPart = value
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("serial="));
  return serialPart?.split("=").slice(1).join("=").trim() ?? "";
};

const serialCountsFor = (devices: SdrDevice[]) =>
  devices.reduce<Record<string, number>>((counts, device) => {
    const serial = device.serial?.toLowerCase();
    if (serial) counts[serial] = (counts[serial] ?? 0) + 1;
    return counts;
  }, {});

const assignedAppsFor = (device: SdrDevice) =>
  (device.assigned_to ?? "")
    .split(",")
    .map((app) => app.trim())
    .filter(Boolean);

const usbPathLabel = (deviceId: string) => {
  const match = deviceId.match(/-bus(\d+)-dev(\d+)$/);
  return match ? `USB ${match[1]}/${match[2]}` : "";
};

/**
 * Pre-install configuration wizard. For apps that declare `config_fields`
 * (e.g. acarsdec: SDR, frequencies, feed ID), this collects values and composes
 * the environment overrides passed to install. The wizard is data-driven from
 * catalog metadata: apps that need an SDR get an SDR step, apps that output
 * messages/audio/tracking can offer an optional feed setup step.
 */
export default function AppInstallWizard({
  app,
  open,
  onOpenChange,
  installing,
  onConfirm,
}: {
  app: CatalogApp | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  installing: boolean;
  onConfirm: (
    env: Record<string, string>,
    imageTag: string,
    feed?: FeedConfig,
  ) => void;
}) {
  const fields: ConfigField[] = app?.config_fields ?? [];
  const sdrFields = fields.filter((f) => f.kind === "sdr");
  const configFields = fields.filter((f) => f.kind !== "sdr");
  const suggestedFeeds = app?.suggested_feeds ?? [];
  const { data: sdrDevices } = useSdrDevices();

  // Form state keyed by field key; initialized from field defaults.
  const initial = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of fields) m[f.key] = f.default ?? "";
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  // Image tag/version to install (defaults to the catalog version, e.g. latest).
  const [imageTag, setImageTag] = useState<string>(app?.version ?? "latest");
  const [stepIndex, setStepIndex] = useState(0);
  const defaultFeed = suggestedFeeds[0];
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState(defaultFeed?.id ?? "");
  const selectedFeed =
    suggestedFeeds.find((f) => f.id === selectedFeedId) ?? defaultFeed;
  const [feedName, setFeedName] = useState(defaultFeed?.name ?? "");
  const [feedHost, setFeedHost] = useState(defaultFeed?.host ?? "");
  const [feedPort, setFeedPort] = useState(
    defaultFeed?.port ? String(defaultFeed.port) : "",
  );
  const [feedProtocol, setFeedProtocol] = useState(
    defaultFeed?.protocol ?? "tcp",
  );

  // Reset when the app changes.
  useEffect(() => {
    setValues(initial);
    setImageTag(app?.version ?? "latest");
    setStepIndex(0);
    setFeedEnabled(false);
    const nextFeed = app?.suggested_feeds?.[0];
    setSelectedFeedId(nextFeed?.id ?? "");
    setFeedName(nextFeed?.name ?? "");
    setFeedHost(nextFeed?.host ?? "");
    setFeedPort(nextFeed?.port ? String(nextFeed.port) : "");
    setFeedProtocol(nextFeed?.protocol ?? "tcp");
  }, [initial, app?.id, app?.version, app?.suggested_feeds]);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const missingRequired = fields
    .filter((f) => f.required && !(values[f.key] ?? "").trim())
    .map((f) => f.label);

  const feedMissing =
    feedEnabled && (!feedName.trim() || !feedHost.trim() || !feedPort.trim());

  const steps = useMemo(() => {
    const base = [{ id: "basics", label: "Basics", icon: Settings }];
    if (app?.requires_sdr || sdrFields.length > 0)
      base.push({ id: "sdr", label: "SDR", icon: Radio });
    if (configFields.length > 0)
      base.push({ id: "settings", label: "Settings", icon: SlidersHorizontal });
    if (suggestedFeeds.length > 0)
      base.push({ id: "feed", label: "Feed", icon: Network });
    base.push({ id: "confirm", label: "Confirm", icon: Check });
    return base;
  }, [
    app?.requires_sdr,
    sdrFields.length,
    configFields.length,
    suggestedFeeds.length,
  ]);

  const activeStep =
    steps[Math.min(stepIndex, steps.length - 1)]?.id ?? "basics";
  const isLastStep = stepIndex >= steps.length - 1;
  const canContinue = activeStep === "feed" ? !feedMissing : true;

  const buildFeed = (): FeedConfig | undefined => {
    if (!app || !feedEnabled || !selectedFeed || feedMissing) return undefined;
    return {
      id: `${app.id}-${selectedFeed.id}`,
      name: feedName.trim(),
      feed_type: selectedFeed.feed_type,
      protocol: feedProtocol.toLowerCase(),
      host: feedHost.trim(),
      port: Number(feedPort),
      enabled: true,
      app_id: app.id,
    };
  };

  const submit = () => {
    // Only send non-empty values as overrides; the backend merges over defaults.
    const env: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.key] ?? "").trim();
      if (v) env[f.key] = v;
      const sdrId = (values[sdrIdEnvKey(f.key)] ?? "").trim();
      if (v && sdrId) env[sdrIdEnvKey(f.key)] = sdrId;
    }
    onConfirm(env, (imageTag ?? "").trim(), buildFeed());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Install {app?.name}</DialogTitle>
          <DialogDescription>
            Confirm the app, link radios when needed, choose key defaults, and
            optionally create a feed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {step.label}
              </div>
            );
          })}
        </div>

        <div className="max-h-[62vh] overflow-y-auto pr-1">
          {activeStep === "basics" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border/60 bg-card/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{app?.name}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {app?.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {app?.category}
                  </Badge>
                </div>
                {app?.outputs && app.outputs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.outputs.map((output) => (
                      <Badge
                        key={`${output.kind}-${output.label}`}
                        variant="outline"
                        className="capitalize"
                      >
                        {output.kind}: {output.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {app?.bundled_features && app.bundled_features.length > 0 && (
                  <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 p-3">
                    <div className="text-sm font-semibold text-primary">
                      Bundled Airwaves OS feature
                    </div>
                    <div className="mt-2 space-y-1">
                      {app.bundled_features.map((feature) => (
                        <p key={feature.id} className="text-sm">
                          <span className="font-medium">{feature.label}</span>
                          {feature.description && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {feature.description}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {app?.install_notes && app.install_notes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Before installing</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {app.install_notes.map((note) => (
                      <li key={note} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Version</label>
                <Input
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                  placeholder="latest"
                />
                <p className="text-xs text-muted-foreground">
                  Image tag to install. Use <code>latest</code> unless you need
                  a pinned version.
                </p>
              </div>
            </div>
          )}

          {activeStep === "sdr" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Link an SDR</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the radio this app should use. Leaving a non-required
                  field blank lets the container auto-select a device.
                </p>
              </div>
              {sdrFields.length === 0 && app?.requires_sdr && (
                <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  This app requires USB SDR access, but the catalog does not
                  declare a specific device variable.
                </div>
              )}
              {sdrFields.map((f) => (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  sdrDevices={sdrDevices}
                  currentAppId={app?.id}
                  selectedSdrId={values[sdrIdEnvKey(f.key)] ?? ""}
                  onSdrDeviceChange={(deviceId) =>
                    set(sdrIdEnvKey(f.key), deviceId)
                  }
                  onChange={(v) => set(f.key, v)}
                />
              ))}
              {sdrDevices && sdrDevices.length > 0 && (
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  {sdrDevices.length} SDR device
                  {sdrDevices.length === 1 ? "" : "s"} detected.
                </div>
              )}
            </div>
          )}

          {activeStep === "settings" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Key settings</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure the settings most likely to matter at install time.
                  Advanced details remain visible on the app detail page.
                </p>
              </div>
              {configFields.map((f) => (
                <FieldEditor
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={(v) => set(f.key, v)}
                />
              ))}
            </div>
          )}

          {activeStep === "feed" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Optional feed setup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  If this app produces data, Airwaves can create a Feed record
                  now so forwarding is documented and ready to manage.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-4">
                <Checkbox
                  checked={feedEnabled}
                  onCheckedChange={(v) => setFeedEnabled(Boolean(v))}
                  id="create-feed"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="create-feed"
                    className="text-sm font-semibold"
                  >
                    Create a feed after install
                  </label>
                  <p className="text-xs text-muted-foreground">
                    You can skip this and add feeds later from the Feeds page.
                  </p>
                </div>
              </div>

              {feedEnabled && (
                <div className="space-y-4 rounded-lg border border-border/60 bg-card/70 p-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Feed template</label>
                    <Select
                      value={selectedFeedId}
                      onValueChange={(id) => {
                        const feed = suggestedFeeds.find((f) => f.id === id);
                        setSelectedFeedId(id);
                        setFeedName(feed?.name ?? "");
                        setFeedHost(feed?.host ?? "");
                        setFeedPort(feed?.port ? String(feed.port) : "");
                        setFeedProtocol(feed?.protocol ?? "tcp");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a feed template" />
                      </SelectTrigger>
                      <SelectContent>
                        {suggestedFeeds.map((feed) => (
                          <SelectItem key={feed.id} value={feed.id}>
                            {feed.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFeed?.description && (
                      <p className="text-xs text-muted-foreground">
                        {selectedFeed.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Feed name</label>
                      <Input
                        value={feedName}
                        onChange={(e) => setFeedName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Protocol</label>
                      <Select
                        value={feedProtocol}
                        onValueChange={setFeedProtocol}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tcp">TCP</SelectItem>
                          <SelectItem value="udp">UDP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Destination host
                      </label>
                      <Input
                        value={feedHost}
                        onChange={(e) => setFeedHost(e.target.value)}
                        placeholder="feed.example.net or 192.168.1.50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Port</label>
                      <Input
                        value={feedPort}
                        onChange={(e) => setFeedPort(e.target.value)}
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStep === "confirm" && (
            <div className="space-y-4">
              <h3 className="font-semibold">Confirm install</h3>
              <div className="rounded-lg border border-border/60 bg-card/70 p-4">
                <dl className="grid gap-3 text-sm">
                  <SummaryRow label="App" value={app?.name ?? ""} />
                  <SummaryRow
                    label="Image tag"
                    value={imageTag || "catalog default"}
                  />
                  <SummaryRow
                    label="Container"
                    value={app ? `airwaves-${app.id}` : ""}
                  />
                  {fields
                    .filter((f) => values[f.key])
                    .map((f) => (
                      <SummaryRow
                        key={f.key}
                        label={f.label}
                        value={values[f.key]}
                      />
                    ))}
                  <SummaryRow
                    label="Feed"
                    value={buildFeed()?.name ?? "None"}
                  />
                </dl>
              </div>
            </div>
          )}

          {missingRequired.length > 0 && (
            <div className="mt-4 text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Required: {missingRequired.join(", ")}
            </div>
          )}
          {feedMissing && (
            <div className="mt-4 text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Complete feed name, host, and port or skip feed creation.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={installing}
          >
            Cancel
          </Button>
          <div className="flex flex-1 justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={installing || stepIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {!isLastStep ? (
              <Button
                onClick={() =>
                  setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                }
                disabled={!canContinue}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={
                  installing || missingRequired.length > 0 || feedMissing
                }
              >
                {installing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Installing...
                  </>
                ) : (
                  "Install"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldEditor({
  field,
  value,
  sdrDevices,
  currentAppId,
  selectedSdrId,
  onSdrDeviceChange,
  onChange,
}: {
  field: ConfigField;
  value: string;
  sdrDevices?: SdrDevice[];
  currentAppId?: string;
  selectedSdrId?: string;
  onSdrDeviceChange?: (deviceId: string) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1.5">
        {field.kind === "sdr" && <Radio className="w-3.5 h-3.5 text-primary" />}
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.kind === "sdr" ? (
        <SdrSelect
          value={value}
          devices={sdrDevices}
          format={field.format ?? "soapy"}
          currentAppId={currentAppId}
          selectedDeviceId={selectedSdrId}
          onDeviceChange={onSdrDeviceChange}
          onChange={onChange}
        />
      ) : field.kind === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o: string) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={field.kind === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.default}
        />
      )}

      {field.help && (
        <p className="text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-mono text-right break-all">{value || "-"}</dd>
      </div>
      <Separator />
    </>
  );
}

/**
 * SDR picker that composes a SoapySDR device string. When a device with a
 * serial is chosen we pin to it (driver=rtlsdr,serial=…) so the assignment is
 * stable across reboots and unambiguous when multiple SDRs are present.
 */
function SdrSelect({
  value,
  devices,
  format,
  currentAppId,
  selectedDeviceId,
  onDeviceChange,
  onChange,
}: {
  value: string;
  devices: SdrDevice[] | undefined;
  /** "soapy" → "driver=rtlsdr,serial=…"; "serial" → bare serial. */
  format: string;
  currentAppId?: string;
  selectedDeviceId?: string;
  onDeviceChange?: (deviceId: string) => void;
  onChange: (v: string) => void;
}) {
  const list = devices ?? [];
  if (list.length === 0) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border/60 px-3 py-2">
        No SDR devices detected. Plug one in and reopen this dialog, or install
        and assign later.
      </div>
    );
  }

  const driverFor = (t: string) =>
    t?.toLowerCase().includes("airspy") ? "airspy" : "rtlsdr";

  // Encode the picked device into the env value the app expects: a SoapySDR
  // device string, or (for readsb/dump978-style apps) the bare serial.
  const encode = (d: SdrDevice): string => {
    if (format === "serial") return d.serial ?? "";
    const driver = driverFor(d.device_type as unknown as string);
    return d.serial
      ? `driver=${driver},serial=${d.serial}`
      : `driver=${driver}`;
  };

  const serialCounts = serialCountsFor(list);
  const selectedById = list.find((device) => device.id === selectedDeviceId);
  const valueSerial =
    format === "serial" ? value.trim() : serialFromSdrValue(value);
  const selectedByValue =
    selectedById ??
    list.find(
      (device) =>
        device.serial &&
        valueSerial &&
        device.serial.toLowerCase() === valueSerial.toLowerCase() &&
        serialCounts[device.serial.toLowerCase()] === 1,
    );
  const selectValue = selectedByValue?.id ?? (value ? "__manual" : "__auto");

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        if (next === "__auto") {
          onDeviceChange?.("");
          onChange("");
          return;
        }
        if (next === "__manual") return;
        const device = list.find((d) => d.id === next);
        if (!device) return;
        onDeviceChange?.(device.id);
        onChange(encode(device));
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select an SDR…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__auto">Auto-select</SelectItem>
        {value && !selectedByValue && (
          <SelectItem value="__manual" disabled>
            Current: {value}
          </SelectItem>
        )}
        {list.map((d) => {
          const assignedApps = assignedAppsFor(d);
          const assignedElsewhere =
            assignedApps.length > 0 &&
            (!currentAppId || !assignedApps.includes(currentAppId));
          const duplicateSerial =
            !!d.serial && serialCounts[d.serial.toLowerCase()] > 1;
          const path = usbPathLabel(d.id);
          return (
            <SelectItem
              key={d.id}
              value={d.id}
              disabled={assignedElsewhere || d.status === "conflict"}
            >
              {d.name}
              {d.serial ? ` · ${d.serial}` : ""}
              {path ? ` · ${path}` : ""}
              {assignedElsewhere ? ` (in use by ${assignedApps.join(", ")})` : ""}
              {duplicateSerial ? " (exact USB path pinned)" : ""}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
