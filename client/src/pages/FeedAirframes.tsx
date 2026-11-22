import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AirbandChannels, { parseChannels, serializeChannels, type AirbandChannel } from "@/components/feed/AirbandChannels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ExternalLink,
  Headphones,
  KeyRound,
  Loader2,
  LogOut,
  Radio,
  RotateCw,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useConfig,
  useContainers,
  useInstallApp,
  useSdrDevices,
  useUpdateAppConfig,
} from "@/hooks/useAirwavesApi";
import {
  airframesApi,
  type AirframesSigninStart,
  type SdrDevice,
} from "@/lib/api";

const XNG = "xng";

/** Modes the manager accepts in XNG_MODES (see airwaves-manager src/xng.rs). */
const MODES: { value: string; label: string; feeds: "airframes" | "atc" | "local" }[] = [
  { value: "acars", label: "ACARS (VHF)", feeds: "airframes" },
  { value: "vdl2", label: "VDL Mode 2", feeds: "airframes" },
  { value: "hfdl", label: "HFDL (HF)", feeds: "airframes" },
  { value: "adsb", label: "ADS-B 1090", feeds: "local" },
  { value: "uat", label: "UAT 978", feeds: "local" },
  { value: "ais", label: "AIS (ships)", feeds: "airframes" },
  { value: "iridium", label: "Iridium", feeds: "airframes" },
  { value: "std-c", label: "Inmarsat STD-C", feeds: "local" },
  { value: "sonde", label: "Radiosondes", feeds: "local" },
  { value: "airband", label: "Airband voice (ATC)", feeds: "atc" },
];

const AUTO = "auto";
const OFF = "off";

/** Mirror of the manager's default: HF → HFDL, RTL-SDRs rotate, others VDL2. */
function defaultMode(device: SdrDevice, rtlIndex: number): string {
  if (device.device_type === "airspy_hf") return "hfdl";
  if (device.device_type === "rtl_sdr")
    return ["acars", "vdl2", "adsb", "ais"][rtlIndex % 4];
  return "vdl2";
}

const SUPPORTED = new Set(["rtl_sdr", "airspy", "airspy_hf", "hack_rf", "sdr_play"]);

function deviceKey(d: SdrDevice): string {
  return (d.configured_serial || d.serial || d.id).trim();
}

interface RadioChoice {
  mode: string; // AUTO | OFF | a mode
  gain: string;
}

function parseModes(raw: string): Record<string, RadioChoice> {
  const out: Record<string, RadioChoice> = {};
  for (const item of raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) {
    const [key, value = ""] = item.split("=");
    const [mode, gain = ""] = value.split("@");
    if (key) out[key.trim()] = { mode: mode.trim().toLowerCase() || AUTO, gain: gain.trim() };
  }
  return out;
}

function recordedXngEnv(apps: unknown): Record<string, string> {
  const list = Array.isArray(apps) ? apps : [];
  const entry = list.find(
    (a): a is { id: string; env?: Record<string, string> } =>
      typeof a === "object" && a !== null && (a as { id?: unknown }).id === XNG,
  );
  return entry?.env ?? {};
}

const isTrue = (v: string | undefined, dflt: boolean) =>
  v === undefined || v.trim() === ""
    ? dflt
    : !["false", "0", "no", "off"].includes(v.trim().toLowerCase());

function AccountCard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const account = useQuery({
    queryKey: ["airframes", "account"],
    queryFn: airframesApi.account,
    staleTime: 30_000,
    retry: 1,
  });
  const [code, setCode] = useState<AirframesSigninStart | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await airframesApi.pollSignin();
        if (cancelled) return;
        if (r.status === "pending") {
          timer.current = window.setTimeout(tick, code.interval * 1000);
          return;
        }
        setCode(null);
        qc.invalidateQueries({ queryKey: ["airframes", "account"] });
        if (r.status === "signed_in") {
          toast({ title: "Signed in to Airframes", description: r.username ? `As ${r.username}.` : undefined });
        } else if (r.status === "denied") {
          toast({ title: "Sign-in declined", variant: "destructive" });
        } else if (r.status === "expired") {
          toast({ title: "The code expired", description: "Start the sign-in again.", variant: "destructive" });
        }
      } catch (e) {
        if (cancelled) return;
        setCode(null);
        toast({ title: "Sign-in failed", description: String((e as Error).message), variant: "destructive" });
      }
    };
    timer.current = window.setTimeout(tick, code.interval * 1000);
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [code, qc, toast]);

  const start = useMutation({
    mutationFn: airframesApi.startSignin,
    onSuccess: (c) => setCode(c),
    onError: (e: Error) =>
      toast({ title: "Couldn't start sign-in", description: e.message, variant: "destructive" }),
  });
  const signOut = useMutation({
    mutationFn: airframesApi.signOut,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["airframes", "account"] }),
  });

  const signedIn = account.data?.signed_in;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Airframes account
        </CardTitle>
        <CardDescription>
          Sign this device in once. It lets xng feed ATC audio under your account; message feeds only need the station ID.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {code ? (
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3" data-testid="signin-code">
            <p className="text-sm text-muted-foreground">
              Open the link on any phone or computer, sign in to Airframes, and enter this code:
            </p>
            <div className="font-mono text-3xl tracking-[0.3em] font-semibold">{code.user_code}</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="sm">
                <a href={code.verification_uri_complete ?? code.verification_uri} target="_blank" rel="noreferrer">
                  Open {new URL(code.verification_uri).host}
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Waiting for approval…
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : signedIn ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Signed in{account.data?.username ? <> as <span className="font-medium">{account.data.username}</span></> : null}
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        ) : (
          <Button onClick={() => start.mutate()} disabled={start.isPending || account.isError}>
            {start.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Sign in to Airframes
          </Button>
        )}
        {account.isError && (
          <p className="text-sm text-muted-foreground">Connect to the device's manager to sign in.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedAirframes() {
  const { toast } = useToast();
  const { data: devices = [], isLoading: devicesLoading } = useSdrDevices();
  const { data: config, isError: configFailed, isFetching: configFetching, refetch: refetchConfig } = useConfig();
  const { data: containers = [] } = useContainers();
  const install = useInstallApp();
  const update = useUpdateAppConfig();
  const account = useQuery({ queryKey: ["airframes", "account"], queryFn: airframesApi.account, retry: 1 });

  const recorded = useMemo(() => recordedXngEnv(config?.apps), [config?.apps]);
  const installed = useMemo(
    () => containers.some((c) => c.name === "airwaves-xng") || Object.keys(recorded).length > 0,
    [containers, recorded],
  );

  const [stationId, setStationId] = useState("");
  const [feed, setFeed] = useState(true);
  const [choices, setChoices] = useState<Record<string, RadioChoice>>({});
  const [channels, setChannels] = useState<AirbandChannel[]>([]);
  const [atcFeed, setAtcFeed] = useState(true);
  const [atcName, setAtcName] = useState("");
  const [transcribe, setTranscribe] = useState(false);
  const loaded = useRef(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load the saved settings once.
  useEffect(() => {
    if (loaded.current || !config) return;
    loaded.current = true;
    setSettingsLoaded(true);
    setStationId(recorded.XNG_STATION_ID ?? "");
    setFeed(isTrue(recorded.XNG_FEED_AIRFRAMES, true));
    setChoices(parseModes(recorded.XNG_MODES ?? ""));
    setChannels(parseChannels(recorded.XNG_AIRBAND_CHANNELS ?? ""));
    setAtcFeed(isTrue(recorded.XNG_ATC_FEED, true));
    setAtcName(recorded.XNG_ATC_STATION_NAME ?? "");
    setTranscribe(isTrue(recorded.XNG_TRANSCRIBE, false));
  }, [config, recorded]);

  // Radios xng may use, with the mode each would get.
  const rows = useMemo(() => {
    let rtl = 0;
    return devices.map((d) => {
      const supported = SUPPORTED.has(d.device_type);
      const owner = d.assigned_to && d.assigned_to !== XNG ? d.assigned_to : null;
      const suggested = supported ? defaultMode(d, rtl) : null;
      if (d.device_type === "rtl_sdr") rtl += 1;
      const key = deviceKey(d);
      const choice = choices[key] ?? { mode: AUTO, gain: "" };
      const effective = !supported || owner ? null : choice.mode === AUTO ? suggested : choice.mode === OFF ? null : choice.mode;
      return { d, key, supported, owner, suggested, choice, effective };
    });
  }, [devices, choices]);

  // Saved settings for radios that aren't plugged in right now. They are kept on
  // save so unplugging a radio doesn't lose its mode. Saved modes are never Auto.
  const absent = useMemo(() => {
    const present = new Set(devices.map(deviceKey));
    return Object.entries(choices)
      .filter(([key, c]) => !present.has(key) && c.mode !== AUTO)
      .map(([key, choice]) => ({ key, choice }));
  }, [devices, choices]);

  const stationLocation = useMemo(() => {
    const st = config?.station;
    return st && (st.latitude !== 0 || st.longitude !== 0) ? { lat: st.latitude, lon: st.longitude } : null;
  }, [config?.station]);

  const airbandCount =
    rows.filter((r) => r.effective === "airband").length + absent.filter((a) => a.choice.mode === "airband").length;
  const activeCount = rows.filter((r) => r.effective).length;
  const anyTurnedOff = rows.some((r) => r.supported && r.choice.mode === OFF);

  const forget = (key: string) =>
    setChoices((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setChoice = (key: string, patch: Partial<RadioChoice>) =>
    setChoices((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { mode: AUTO, gain: "" }), ...patch } }));

  const env = useMemo(() => {
    const modes = rows
      .filter((r) => r.supported && (r.choice.mode !== AUTO || r.choice.gain.trim()))
      .map((r) => {
        const mode = r.choice.mode === AUTO ? r.suggested : r.choice.mode;
        return `${r.key}=${mode}${r.choice.gain.trim() ? `@${r.choice.gain.trim()}` : ""}`;
      })
      .concat(absent.map((a) => `${a.key}=${a.choice.mode}${a.choice.gain.trim() ? `@${a.choice.gain.trim()}` : ""}`))
      .join(", ");
    return {
      XNG_STATION_ID: stationId.trim().toUpperCase(),
      XNG_FEED_AIRFRAMES: String(feed),
      XNG_MODES: modes,
      XNG_AIRBAND_CHANNELS: serializeChannels(channels),
      XNG_ATC_FEED: String(atcFeed),
      XNG_ATC_STATION_NAME: atcName.trim(),
      XNG_TRANSCRIBE: String(transcribe),
    };
  }, [rows, absent, stationId, feed, channels, atcFeed, atcName, transcribe]);

  const stationValid = /^[A-Z0-9_-]{1,40}$/.test(env.XNG_STATION_ID);
  const problem = !settingsLoaded
    ? configFailed
      ? "Couldn't load the saved settings."
      : "Loading the saved settings…"
    : devicesLoading
      ? "Looking for radios…"
    : !stationValid
    ? "Enter a station ID (letters, digits, - and _)."
    : activeCount === 0 && !(installed && anyTurnedOff)
      ? "Give at least one radio a mode."
      : airbandCount > 1
        ? "Only one radio can run airband for now."
        : airbandCount === 1 && !env.XNG_AIRBAND_CHANNELS
          ? "Pick the airband channels to listen to."
          : null;

  const busy = install.isPending || update.isPending;
  const save = () => {
    const opts = {
      onSuccess: () =>
        toast({ title: installed ? "xng restarted with the new settings" : "xng is starting", description: `Feeding as ${env.XNG_STATION_ID}.` }),
      onError: (e: Error) => toast({ title: "Couldn't apply the settings", description: e.message, variant: "destructive" }),
    };
    if (installed) update.mutate({ appId: XNG, env }, opts);
    else install.mutate({ appId: XNG, env }, opts);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" /> Feed Airframes
        </h1>
        <p className="text-muted-foreground mt-1">
          xng decodes every radio below in one app and sends the results to Airframes under your station ID.
          {installed ? <Badge variant="secondary" className="ml-2">xng installed</Badge> : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Station</CardTitle>
            <CardDescription>
              xng adds the mode to the ID it sends: XX-KSEA becomes XX-KSEA-ACARS, XX-KSEA-VDL2, and so on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="station-id">Station ID</Label>
              <Input
                id="station-id"
                placeholder="XX-KSEA"
                value={stationId}
                onChange={(e) => setStationId(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="feed">Send messages to Airframes</Label>
              <Switch id="feed" checked={feed} onCheckedChange={setFeed} />
            </div>
          </CardContent>
        </Card>
        <AccountCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4" /> Radios
          </CardTitle>
          <CardDescription>
            Auto picks a mode that suits the hardware. Radios another app uses stay with that app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {devicesLoading ? (
            <p className="text-sm text-muted-foreground">Looking for radios…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SDRs found. Plug one in and it will show up here.</p>
          ) : (
            rows.map((r) => {
              const mode = MODES.find((m) => m.value === r.effective);
              return (
                <div key={r.d.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_220px_110px] md:items-center">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.d.configured_name || r.d.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {r.d.device_type} · {r.key}
                    </div>
                    <div className="mt-1">
                      {!r.supported ? (
                        <Badge variant="outline">Not supported by xng</Badge>
                      ) : r.owner ? (
                        <Badge variant="outline">Used by {r.owner}</Badge>
                      ) : mode?.feeds === "airframes" ? (
                        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-0">Feeds Airframes</Badge>
                      ) : mode?.feeds === "atc" ? (
                        <Badge className="bg-sky-600/15 text-sky-700 dark:text-sky-300 border-0">ATC audio</Badge>
                      ) : mode ? (
                        <Badge variant="secondary">Decodes on this device only</Badge>
                      ) : (
                        <Badge variant="outline">Off</Badge>
                      )}
                    </div>
                  </div>
                  <Select
                    value={r.choice.mode}
                    onValueChange={(v) => setChoice(r.key, { mode: v })}
                    disabled={!r.supported || !!r.owner}
                  >
                    <SelectTrigger aria-label={`Mode for ${r.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO}>
                        Auto{r.suggested ? ` (${MODES.find((m) => m.value === r.suggested)?.label ?? r.suggested})` : ""}
                      </SelectItem>
                      {MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                      <SelectItem value={OFF}>Off</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label={`Gain for ${r.key}`}
                    placeholder="Gain (auto)"
                    inputMode="decimal"
                    value={r.choice.gain}
                    onChange={(e) => setChoice(r.key, { gain: e.target.value.replace(/[^0-9.]/g, "") })}
                    disabled={!r.supported || !!r.owner}
                  />
                </div>
              );
            })
          )}
          {absent.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-sm text-muted-foreground">
                Saved settings for radios that aren't plugged in. They're kept so the radio picks them up again when it's back.
              </p>
              {absent.map((a) => (
                <div key={a.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono">
                    {a.key} · {a.choice.mode}
                    {a.choice.gain.trim() ? ` @ ${a.choice.gain.trim()}` : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => forget(a.key)}>
                    Forget
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {airbandCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Headphones className="h-4 w-4" /> ATC airband
            </CardTitle>
            <CardDescription>
              Pick the tower, approach and other channels near you. One radio hears channels within 2 MHz of each other.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AirbandChannels value={channels} onChange={setChannels} location={stationLocation} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="atc-name">Station name shown to listeners</Label>
                <Input id="atc-name" placeholder={config?.device.name || "My station"} value={atcName} onChange={(e) => setAtcName(e.target.value)} />
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="atc-feed">Stream to atc.airframes.io</Label>
                  <Switch id="atc-feed" checked={atcFeed} onCheckedChange={setAtcFeed} />
                </div>
                {atcFeed && !account.data?.signed_in && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Sign in to Airframes above to start the ATC stream.</p>
                )}
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="transcribe">Transcribe on this device</Label>
                  <Switch id="transcribe" checked={transcribe} onCheckedChange={setTranscribe} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {problem && <span className="text-sm text-muted-foreground">{problem}</span>}
        {!settingsLoaded && configFailed && (
          <Button variant="outline" onClick={() => refetchConfig()} disabled={configFetching}>
            <RotateCw className={`mr-2 h-4 w-4 ${configFetching ? "animate-spin" : ""}`} /> Retry
          </Button>
        )}
        <Button onClick={save} disabled={!!problem || busy} size="lg">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {installed ? "Save and restart xng" : "Start feeding"}
        </Button>
      </div>
    </div>
  );
}
