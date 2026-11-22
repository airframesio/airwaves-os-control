import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown, Loader2, MapPin, Search, Send, Sparkles, X } from "lucide-react";
import { airframesApi, type AtcFrequency } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** One airband channel as xng gets it: MHz with three decimals, and a label. */
export interface AirbandChannel {
  mhz: string;
  label: string;
}

/** One radio hears channels within this many MHz of each other (manager rule). */
export const MAX_SPAN_MHZ = 2.0;
const MAX_CHANNELS = 12;

const SERVICE_NAMES: Record<string, string> = {
  TWR: "Tower",
  APP: "Approach",
  DEP: "Departure",
  CTR: "Center",
  GND: "Ground",
  CLD: "Clearance",
  RAMP: "Ramp",
  ATIS: "ATIS",
  AWOS: "AWOS",
  CTAF: "CTAF",
  UNICOM: "Unicom",
  AFIS: "AFIS",
  FSS: "Radio",
};

/** Services worth listening to first when picking automatically. */
const SERVICE_WEIGHT: Record<string, number> = {
  TWR: 10,
  APP: 9,
  DEP: 8,
  CTR: 6,
  GND: 4,
  CLD: 4,
  CTAF: 3,
  UNICOM: 2,
  AFIS: 2,
  ATIS: 1,
  AWOS: 1,
};

const SHOWN_SERVICES = "TWR,APP,DEP,CTR,GND,CLD,CTAF,UNICOM,AFIS,ATIS";

export function parseChannels(raw: string): AirbandChannel[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      const [f, ...rest] = item.split("=");
      const n = Number(f);
      return { mhz: Number.isFinite(n) ? n.toFixed(3) : f.trim(), label: rest.join("=").trim() };
    });
}

export function serializeChannels(channels: AirbandChannel[]): string {
  return channels
    .map((c) => (c.label.trim() ? `${c.mhz}=${cleanLabel(c.label)}` : c.mhz))
    .join(", ");
}

/** Labels travel in a comma-separated list, so they cannot hold commas. */
function cleanLabel(label: string): string {
  return label.replace(/[,\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

function labelFor(f: AtcFrequency): string {
  const service = SERVICE_NAMES[f.service] ?? f.service;
  if (f.facility.type === "airport") return `${f.facility.ident} ${service}`;
  return cleanLabel(f.callsign || f.name || `${f.facility.ident} ${service}`);
}

function span(mhz: number[]): number {
  return mhz.length ? Math.max(...mhz) - Math.min(...mhz) : 0;
}

/** Why `mhz` cannot join `channels`, or null when it can. */
function rejectReason(mhz: number, channels: AirbandChannel[]): string | null {
  if (!Number.isFinite(mhz)) return "Enter the frequency in MHz, like 120.500.";
  if (mhz < 108 || mhz > 400) return "Airband is 108 to 400 MHz.";
  if (channels.some((c) => Number(c.mhz) === Number(mhz.toFixed(3)))) return "Already in the list.";
  if (channels.length >= MAX_CHANNELS) return `One radio handles up to ${MAX_CHANNELS} channels.`;
  const s = span([...channels.map((c) => Number(c.mhz)), mhz]);
  if (s > MAX_SPAN_MHZ + 1e-9) {
    const lo = Math.min(...channels.map((c) => Number(c.mhz)));
    const hi = Math.max(...channels.map((c) => Number(c.mhz)));
    return `Out of range for this radio: the list covers ${lo.toFixed(3)} to ${hi.toFixed(3)} MHz and one radio hears ${MAX_SPAN_MHZ} MHz.`;
  }
  return null;
}

/**
 * The best set of channels one radio can hear: the 2 MHz window with the
 * most useful nearby services (tower and approach first, closer is better).
 */
export function pickBest(freqs: AtcFrequency[]): AtcFrequency[] {
  const score = (f: AtcFrequency) =>
    (SERVICE_WEIGHT[f.service] ?? 0.5) * Math.exp(-(f.distanceKm ?? 0) / 120);
  const pool = freqs
    .filter((f) => f.streamable && f.band === "VHF")
    .sort((a, b) => a.frequencyMhz - b.frequencyMhz);
  let best: AtcFrequency[] = [];
  let bestScore = 0;
  for (let i = 0; i < pool.length; i++) {
    const window = pool.filter(
      (f) => f.frequencyMhz >= pool[i].frequencyMhz && f.frequencyMhz - pool[i].frequencyMhz <= MAX_SPAN_MHZ,
    );
    const seen = new Set<string>();
    const chosen = window
      .sort((a, b) => score(b) - score(a))
      .filter((f) => {
        const k = f.frequencyMhz.toFixed(3);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 8);
    const total = chosen.reduce((sum, f) => sum + score(f), 0);
    if (total > bestScore) {
      best = chosen;
      bestScore = total;
    }
  }
  return best.sort((a, b) => a.frequencyMhz - b.frequencyMhz);
}

interface Props {
  value: AirbandChannel[];
  onChange: (channels: AirbandChannel[]) => void;
  /** The station position from Settings, when set. */
  location: { lat: number; lon: number } | null;
}

/** Services a hand-added channel can be, in the order offered. */
const MANUAL_SERVICES = ["TWR", "APP", "DEP", "CTR", "GND", "CLD", "CTAF", "UNICOM", "ATIS", "AWOS"];

export default function AirbandChannels({ value, onChange, location }: Props) {
  const { toast } = useToast();
  const [manualOpen, setManualOpen] = useState(false);
  const [freqInput, setFreqInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [facilityInput, setFacilityInput] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [radius, setRadius] = useState("40");
  const [airport, setAirport] = useState("");
  const [airportQuery, setAirportQuery] = useState("");

  const params = useMemo<Record<string, string> | null>(() => {
    const base = { service: SHOWN_SERVICES, band: "VHF", limit: "300" };
    if (airportQuery) return { ...base, facility_id: `airport:${airportQuery}` };
    if (location) return { ...base, near: `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`, radius_nm: radius };
    return null;
  }, [airportQuery, location, radius]);

  const nearby = useQuery({
    queryKey: ["atc-frequencies", params],
    queryFn: () => airframesApi.atcFrequencies(params!),
    enabled: !!params,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const groups = useMemo(() => {
    const byFacility = new Map<string, AtcFrequency[]>();
    for (const f of nearby.data?.data ?? []) {
      const list = byFacility.get(f.facilityId) ?? [];
      list.push(f);
      byFacility.set(f.facilityId, list);
    }
    return Array.from(byFacility.values())
      .map((list) => list.sort((a, b) => (SERVICE_WEIGHT[b.service] ?? 0) - (SERVICE_WEIGHT[a.service] ?? 0) || a.frequencyMhz - b.frequencyMhz))
      .sort((a, b) => (a[0].distanceKm ?? 0) - (b[0].distanceKm ?? 0))
      .slice(0, 12);
  }, [nearby.data]);

  const selected = new Set(value.map((c) => Number(c.mhz).toFixed(3)));
  const mhzList = value.map((c) => Number(c.mhz));
  const used = span(mhzList);

  const add = (mhz: number, label: string) => {
    if (rejectReason(mhz, value)) return;
    onChange(
      [...value, { mhz: mhz.toFixed(3), label: cleanLabel(label) }].sort((a, b) => Number(a.mhz) - Number(b.mhz)),
    );
  };
  const remove = (mhz: string) => onChange(value.filter((c) => c.mhz !== mhz));
  const toggle = (f: AtcFrequency) => {
    const k = f.frequencyMhz.toFixed(3);
    if (selected.has(k)) remove(k);
    else add(f.frequencyMhz, labelFor(f));
  };

  // Hand-added channels must be reported to Airframes so the directory can
  // be updated. A channel the directory already has nearby is added from the
  // directory instead.
  const manualMhz = Number(freqInput.trim());
  const manualProblem = freqInput.trim() ? rejectReason(manualMhz, value) : null;
  const facility = facilityInput.trim().toUpperCase();
  const manualReady = !!freqInput.trim() && !manualProblem && !!serviceInput && /^[A-Z0-9]{3,4}$/.test(facility);
  const addManual = async () => {
    if (!manualReady || reporting) return;
    const label = `${facility} ${SERVICE_NAMES[serviceInput] ?? serviceInput}`;
    setReporting(true);
    setReportError(null);
    try {
      const result = await airframesApi.reportFrequency({
        frequency_mhz: Number(manualMhz.toFixed(3)),
        label,
        service: serviceInput,
        facility,
        ...(location ? { lat: location.lat, lon: location.lon } : {}),
      });
      const known = result.status === "known" ? result.known[0] : undefined;
      add(manualMhz, known?.name ? cleanLabel(known.name) : label);
      toast(
        known
          ? { title: "Already in the directory", description: `Added ${manualMhz.toFixed(3)} as ${known.name ?? known.facilityId}.` }
          : { title: "Thanks, we'll take a look", description: `${manualMhz.toFixed(3)} MHz was sent to Airframes to add to the directory.` },
      );
      setFreqInput("");
      setServiceInput("");
      setFacilityInput("");
      setManualOpen(false);
    } catch (e) {
      setReportError(
        `Couldn't send it to Airframes, so it wasn't added. ${e instanceof Error ? e.message : ""}`.trim(),
      );
    } finally {
      setReporting(false);
    }
  };

  const autoPick = () => {
    const best = pickBest(nearby.data?.data ?? []);
    if (best.length) onChange(best.map((f) => ({ mhz: f.frequencyMhz.toFixed(3), label: labelFor(f) })));
  };

  return (
    <div className="space-y-6">
      {/* Chosen channels */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label>Channels this radio listens to</Label>
          <span className="text-xs text-muted-foreground" data-testid="span-label">
            {value.length
              ? `${Math.min(...mhzList).toFixed(3)} to ${Math.max(...mhzList).toFixed(3)} MHz · ${used.toFixed(2)} of ${MAX_SPAN_MHZ.toFixed(1)} MHz used`
              : `Pick channels within ${MAX_SPAN_MHZ.toFixed(1)} MHz of each other`}
          </span>
        </div>
        <Progress value={(used / MAX_SPAN_MHZ) * 100} className="h-1.5" />
        {value.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No channels yet. Pick them from the directory below.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {value.map((c) => (
              <li key={c.mhz} className="flex items-center gap-3 px-3 py-2">
                <span className="w-20 shrink-0 font-mono text-sm">{c.mhz}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{c.label || <span className="text-muted-foreground">Unnamed</span>}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Remove ${c.mhz} MHz`} onClick={() => remove(c.mhz)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Directory */}
      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            {airportQuery ? `Frequencies at ${airportQuery}` : location ? "Nearby ATC frequencies" : "Find ATC frequencies"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {location && !airportQuery && (
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="h-8 w-[110px]" aria-label="Search radius">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["20", "40", "80", "150"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r} nm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                setAirportQuery(airport.trim().toUpperCase());
              }}
            >
              <Input
                aria-label="Airport code"
                className="h-8 w-24 uppercase placeholder:normal-case"
                placeholder="KSFO"
                value={airport}
                onChange={(e) => setAirport(e.target.value)}
              />
              <Button type="submit" variant="outline" size="icon" className="h-8 w-8" aria-label="Look up airport">
                <Search className="h-4 w-4" />
              </Button>
              {airportQuery && location && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setAirport("");
                    setAirportQuery("");
                  }}
                >
                  Nearby
                </Button>
              )}
            </form>
            <Button size="sm" className="h-8" onClick={autoPick} disabled={!nearby.data?.data.length}>
              <Sparkles className="mr-1 h-4 w-4" /> Pick for me
            </Button>
          </div>
        </div>

        {!params && (
          <p className="text-sm text-muted-foreground">
            Set the station location in Settings to see the frequencies around you, or look up an airport by its code.
          </p>
        )}
        {nearby.isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up frequencies...
          </p>
        )}
        {nearby.isError && (
          <p className="text-sm text-destructive">
            Couldn't reach the Airframes frequency directory. Check the internet connection and try again.
          </p>
        )}
        {nearby.data && groups.length === 0 && (
          <p className="text-sm text-muted-foreground">No ATC frequencies found{airportQuery ? ` for ${airportQuery}` : " in this radius"}.</p>
        )}

        <div className="space-y-3">
          {groups.map((list) => {
            const fac = list[0].facility;
            return (
              <div key={fac.id} className="space-y-1.5">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono font-semibold">{fac.ident}</span>
                  <span className="truncate text-muted-foreground">{fac.name}</span>
                  {list[0].distanceNm !== undefined && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{Math.round(list[0].distanceNm)} nm</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((f) => {
                    const k = f.frequencyMhz.toFixed(3);
                    const on = selected.has(k);
                    const reason = !f.streamable
                      ? f.streamPolicyReason || "Not streamed in this area"
                      : on
                        ? null
                        : rejectReason(f.frequencyMhz, value);
                    const disabled = !on && !!reason;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        title={reason ?? (on ? "Remove" : `Add ${labelFor(f)}`)}
                        disabled={disabled}
                        onClick={() => toggle(f)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-accent",
                          disabled && "cursor-not-allowed opacity-40 hover:bg-background",
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                        <span className="font-medium">{SERVICE_NAMES[f.service] ?? f.service}</span>
                        <span className="font-mono">{k}</span>
                        {f.liveFeedCount > 0 && !on && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {f.liveFeedCount} live
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand-added channel, reported to Airframes */}
      <div className="space-y-3">
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          aria-expanded={manualOpen}
          onClick={() => setManualOpen((o) => !o)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", manualOpen && "rotate-180")} />
          A channel is missing from the directory?
        </button>
        {manualOpen && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Add it here and it's sent to Airframes, so we can check it and add it to the directory for everyone.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <Input
                aria-label="Frequency in MHz"
                className="w-28 font-mono"
                inputMode="decimal"
                placeholder="118.700"
                value={freqInput}
                onChange={(e) => setFreqInput(e.target.value)}
              />
              <Select value={serviceInput} onValueChange={setServiceInput}>
                <SelectTrigger className="w-[140px]" aria-label="Service">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_SERVICES.map((sv) => (
                    <SelectItem key={sv} value={sv}>
                      {SERVICE_NAMES[sv] ?? sv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Airport or facility code"
                className="w-28 uppercase placeholder:normal-case"
                placeholder="KLVK"
                maxLength={4}
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
              />
              <Button variant="outline" onClick={addManual} disabled={!manualReady || reporting}>
                {reporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                Report and add
              </Button>
            </div>
            {manualProblem && <p className="text-xs text-destructive">{manualProblem}</p>}
            {reportError && <p className="text-xs text-destructive">{reportError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
