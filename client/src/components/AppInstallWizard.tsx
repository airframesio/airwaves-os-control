import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Radio, AlertTriangle } from "lucide-react";
import { useSdrDevices } from "@/hooks/useAirwavesApi";
import type { CatalogApp, ConfigField, SdrDevice } from "@/lib/api";

/**
 * Pre-install configuration wizard. For apps that declare `config_fields`
 * (e.g. acarsdec: SDR, frequencies, feed ID), this collects values and composes
 * the environment overrides passed to install. The special `kind: "sdr"` field
 * is backed by the live SDR device list and composes a SoapySDR device string.
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
  onConfirm: (env: Record<string, string>, imageTag: string) => void;
}) {
  const fields: ConfigField[] = app?.config_fields ?? [];
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

  // Reset when the app changes.
  useMemo(() => setValues(initial), [initial]);
  useMemo(() => setImageTag(app?.version ?? "latest"), [app?.id]);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const missingRequired = fields
    .filter((f) => f.required && !(values[f.key] ?? "").trim())
    .map((f) => f.label);

  const submit = () => {
    // Only send non-empty values as overrides; the backend merges over defaults.
    const env: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.key] ?? "").trim();
      if (v) env[f.key] = v;
    }
    onConfirm(env, (imageTag ?? "").trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {app?.name}</DialogTitle>
          <DialogDescription>
            Set up {app?.name} before installing. These settings can be changed later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This app has no configurable options. Click Install to continue.
            </p>
          )}

          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                {f.kind === "sdr" && <Radio className="w-3.5 h-3.5 text-primary" />}
                {f.label}
                {f.required && <span className="text-red-500">*</span>}
              </label>

              {f.kind === "sdr" ? (
                <SdrSelect
                  value={values[f.key] ?? ""}
                  devices={sdrDevices}
                  format={f.format ?? "soapy"}
                  onChange={(v) => set(f.key, v)}
                />
              ) : f.kind === "select" ? (
                <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {f.options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={f.kind === "number" ? "number" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.default}
                />
              )}

              {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            </div>
          ))}

          {/* Image version — applies to every app so installs can be pinned. */}
          <div className="space-y-1.5 border-t border-border/50 pt-4">
            <label className="text-sm font-medium">Version</label>
            <Input
              value={imageTag}
              onChange={(e) => setImageTag(e.target.value)}
              placeholder="latest"
            />
            <p className="text-xs text-muted-foreground">
              Image tag to install (e.g. <code>latest</code> or a specific version). Leave as <code>latest</code> for the newest build.
            </p>
          </div>

          {missingRequired.length > 0 && (
            <div className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Required: {missingRequired.join(", ")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={installing}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={installing || missingRequired.length > 0}>
            {installing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Installing…</> : "Install"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  onChange,
}: {
  value: string;
  devices: SdrDevice[] | undefined;
  /** "soapy" → "driver=rtlsdr,serial=…"; "serial" → bare serial. */
  format: string;
  onChange: (v: string) => void;
}) {
  const list = devices ?? [];
  if (list.length === 0) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border/60 px-3 py-2">
        No SDR devices detected. Plug one in and reopen this dialog, or install and assign later.
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
    return d.serial ? `driver=${driver},serial=${d.serial}` : `driver=${driver}`;
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select an SDR…" /></SelectTrigger>
      <SelectContent>
        {list.map((d) => (
          <SelectItem key={d.id} value={encode(d)}>
            {d.name}{d.serial ? ` · ${d.serial}` : ""}
            {d.assigned_to ? ` (in use by ${d.assigned_to})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
