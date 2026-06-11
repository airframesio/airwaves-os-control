import {
  BarChart3,
  Box,
  Antenna,
  Globe2,
  Map,
  Plane,
  Radio,
  Radar,
  Satellite,
  Ship,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconSpec = {
  icon: LucideIcon;
  from: string;
  via: string;
  to: string;
  accent: string;
  label: string;
};

const appIconSpecs: Record<string, IconSpec> = {
  acarsdec: {
    icon: Plane,
    from: "#0f766e",
    via: "#2563eb",
    to: "#111827",
    accent: "#f59e0b",
    label: "AC",
  },
  acarshub: {
    icon: BarChart3,
    from: "#047857",
    via: "#0ea5e9",
    to: "#0f172a",
    accent: "#a3e635",
    label: "AH",
  },
  readsb: {
    icon: Radar,
    from: "#1d4ed8",
    via: "#0891b2",
    to: "#111827",
    accent: "#fb923c",
    label: "AD",
  },
  dumpvdl2: {
    icon: Waves,
    from: "#4338ca",
    via: "#0284c7",
    to: "#0f172a",
    accent: "#38bdf8",
    label: "VD",
  },
  dumphfdl: {
    icon: Satellite,
    from: "#7c2d12",
    via: "#be123c",
    to: "#111827",
    accent: "#fde047",
    label: "HF",
  },
  "acars-router": {
    icon: Antenna,
    from: "#155e75",
    via: "#7c3aed",
    to: "#0f172a",
    accent: "#22d3ee",
    label: "RT",
  },
  "ais-catcher": {
    icon: Ship,
    from: "#0f766e",
    via: "#0369a1",
    to: "#082f49",
    accent: "#2dd4bf",
    label: "AIS",
  },
  "rtl-airband": {
    icon: Radio,
    from: "#991b1b",
    via: "#2563eb",
    to: "#111827",
    accent: "#f97316",
    label: "ATC",
  },
  rtl_airband: {
    icon: Radio,
    from: "#991b1b",
    via: "#2563eb",
    to: "#111827",
    accent: "#f97316",
    label: "ATC",
  },
  "rtl-433": {
    icon: Wifi,
    from: "#166534",
    via: "#65a30d",
    to: "#1f2937",
    accent: "#bef264",
    label: "433",
  },
  rtl_433: {
    icon: Wifi,
    from: "#166534",
    via: "#65a30d",
    to: "#1f2937",
    accent: "#bef264",
    label: "433",
  },
  satdump: {
    icon: Satellite,
    from: "#4c1d95",
    via: "#0369a1",
    to: "#111827",
    accent: "#facc15",
    label: "SAT",
  },
  dump978: {
    icon: Plane,
    from: "#9a3412",
    via: "#2563eb",
    to: "#111827",
    accent: "#fdba74",
    label: "978",
  },
  tar1090: {
    icon: Map,
    from: "#14532d",
    via: "#0891b2",
    to: "#0f172a",
    accent: "#86efac",
    label: "MAP",
  },
  shipfeeder: {
    icon: Ship,
    from: "#075985",
    via: "#0f766e",
    to: "#111827",
    accent: "#67e8f9",
    label: "SEA",
  },
  "plane-watch": {
    icon: Plane,
    from: "#1e3a8a",
    via: "#0d9488",
    to: "#111827",
    accent: "#5eead4",
    label: "PW",
  },
  graphs1090: {
    icon: BarChart3,
    from: "#312e81",
    via: "#2563eb",
    to: "#111827",
    accent: "#c4b5fd",
    label: "1090",
  },
  "external-feed-source": {
    icon: Globe2,
    from: "#374151",
    via: "#0d9488",
    to: "#111827",
    accent: "#5eead4",
    label: "EXT",
  },
  ultrafeeder: {
    icon: Plane,
    from: "#0e7490",
    via: "#1d4ed8",
    to: "#111827",
    accent: "#fbbf24",
    label: "UF",
  },
};

const fallbackSpec: IconSpec = {
  icon: Box,
  from: "#334155",
  via: "#2563eb",
  to: "#111827",
  accent: "#93c5fd",
  label: "APP",
};

export function getAppIconSpec(appId?: string | null) {
  return appId ? (appIconSpecs[appId] ?? fallbackSpec) : fallbackSpec;
}

export function AppCatalogIcon({
  appId,
  className,
  iconClassName,
}: {
  appId?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const spec = getAppIconSpec(appId);
  const Icon = spec.icon;

  return (
    <div
      className={cn(
        "relative isolate flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/20 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.65)] ring-1 ring-black/10",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(140deg, ${spec.from}, ${spec.via} 52%, ${spec.to})`,
      }}
    >
      <div
        className="absolute inset-0 opacity-65"
        style={{
          backgroundImage: `linear-gradient(135deg, transparent 0 34%, ${spec.accent}66 34% 43%, transparent 43% 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 12px)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-white/12" />
      <div
        className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[0.55rem] font-black leading-none text-white/80"
        style={{ backgroundColor: `${spec.to}88` }}
      >
        {spec.label}
      </div>
      <div className="relative flex h-3/5 w-3/5 items-center justify-center rounded-xl bg-black/24 shadow-inner ring-1 ring-white/20">
        <Icon
          className={cn("h-3/5 w-3/5 text-white drop-shadow", iconClassName)}
          strokeWidth={2.35}
        />
      </div>
    </div>
  );
}
