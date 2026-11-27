import { useSyncExternalStore } from "react";

/**
 * Altitude display unit. "auto" follows the browser's region: feet for US,
 * GB, CA, LR, MM, PR, GU, VI, AS or no region, meters elsewhere. The choice
 * lives in localStorage (per browser) and every altitude on screen goes
 * through formatAltitude.
 */
export type AltitudeUnit = "auto" | "ft" | "m" | "fl";

export const ALTITUDE_UNITS: AltitudeUnit[] = ["auto", "ft", "m", "fl"];

const STORAGE_KEY = "airwaves_altitude_unit";
const FEET_REGIONS = new Set(["US", "GB", "CA", "LR", "MM", "PR", "GU", "VI", "AS"]);
const FT_PER_M = 3.28084;

/** The unit "auto" stands for in this browser. */
export function regionAltitudeUnit(): "ft" | "m" {
  try {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of tags) {
      if (!tag) continue;
      const region = new Intl.Locale(tag).region;
      if (region) return FEET_REGIONS.has(region) ? "ft" : "m";
    }
  } catch {
    // No Intl.Locale: feet.
  }
  return "ft";
}

function load(): AltitudeUnit {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (ALTITUDE_UNITS.includes(v as AltitudeUnit)) return v as AltitudeUnit;
  } catch {
    // Storage blocked.
  }
  return "auto";
}

let current: AltitudeUnit = load();
const listeners = new Set<() => void>();

export function getAltitudeUnit(): AltitudeUnit {
  return current;
}

export function setAltitudeUnit(unit: AltitudeUnit) {
  current = unit;
  try {
    localStorage.setItem(STORAGE_KEY, unit);
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
  listeners.forEach((l) => l());
}

// Another tab changed the setting: pick it up without writing it back.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    current = load();
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The chosen unit, re-rendering when it changes. */
export function useAltitudeUnit(): AltitudeUnit {
  return useSyncExternalStore(subscribe, getAltitudeUnit, getAltitudeUnit);
}

export function altitudeUnitLabel(unit: AltitudeUnit): string {
  switch (unit) {
    case "auto":
      return `Automatic (${regionAltitudeUnit() === "m" ? "Meters" : "Feet"})`;
    case "ft":
      return "Feet";
    case "m":
      return "Meters";
    case "fl":
      return "Flight levels";
  }
}

export function metersToFeet(m: number): number {
  return m * FT_PER_M;
}

/**
 * An altitude in feet, in the chosen unit: "36,000 ft", "10,973 m" or "FL360"
 * (flight levels from 18,000 ft, feet below). `elevation` marks a station or
 * airport elevation, where flight levels mean feet.
 */
export function formatAltitude(
  ft: number | null | undefined,
  unit: AltitudeUnit = current,
  elevation = false,
): string {
  if (ft == null || !Number.isFinite(ft)) return "";
  const u = unit === "auto" ? regionAltitudeUnit() : unit;
  if (u === "m") return `${Math.round(ft / FT_PER_M).toLocaleString()} m`;
  if (u === "fl" && !elevation && ft >= 18000) return `FL${String(Math.round(ft / 100)).padStart(3, "0")}`;
  return `${Math.round(ft).toLocaleString()} ft`;
}
