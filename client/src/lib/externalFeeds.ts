/**
 * External aircraft.json feeds (tar1090, readsb, dump1090) that the Tracking
 * map shows next to the device's own data. They are configured under My Apps
 * and kept in this browser's localStorage, so everything read back is
 * validated before use.
 */

export interface ExternalFeed {
  id: string;
  url: string;
  /** Seconds between fetches. */
  interval: number;
  enabled: boolean;
}

export const EXTERNAL_FEEDS_KEY = "external_feeds";
export const MIN_FEED_INTERVAL_S = 2;
export const MAX_FEED_INTERVAL_S = 60;
const MAX_FEEDS = 20;
const MAX_AIRCRAFT_PER_FEED = 2_000;

export function clampInterval(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(MAX_FEED_INTERVAL_S, Math.max(MIN_FEED_INTERVAL_S, Math.round(n)));
}

/** Only absolute http(s) URLs are fetched. */
export function isFeedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function toFeed(raw: unknown): ExternalFeed | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.url !== "string") return null;
  return {
    id: r.id,
    url: r.url.trim(),
    interval: clampInterval(r.interval),
    enabled: r.enabled === true,
  };
}

/** Every saved feed that parses, including ones still being edited. */
export function loadSavedFeeds(): ExternalFeed[] | null {
  let saved: string | null;
  try {
    saved = localStorage.getItem(EXTERNAL_FEEDS_KEY);
  } catch {
    return null;
  }
  if (!saved) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toFeed).filter((f): f is ExternalFeed => f !== null).slice(0, MAX_FEEDS);
  } catch {
    return [];
  }
}

/** Feeds the map can fetch: valid http(s) URLs only. */
export function loadExternalFeeds(): ExternalFeed[] {
  return (loadSavedFeeds() ?? []).filter(f => isFeedUrl(f.url));
}

export function saveExternalFeeds(feeds: ExternalFeed[]) {
  const clean = feeds.map(f => ({ ...f, url: f.url.trim(), interval: clampInterval(f.interval) }));
  localStorage.setItem(EXTERNAL_FEEDS_KEY, JSON.stringify(clean));
}

function num(...values: unknown[]): number | undefined {
  for (const v of values) {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Map an aircraft.json body (object with `aircraft`, or a bare array) to map vehicles. */
export function parseAircraftJson(feedId: string, body: unknown) {
  const list: unknown[] = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { aircraft?: unknown }).aircraft)
      ? (body as { aircraft: unknown[] }).aircraft
      : [];

  const vehicles = [];
  for (const item of list.slice(0, MAX_AIRCRAFT_PER_FEED)) {
    if (!item || typeof item !== "object") continue;
    const ac = item as Record<string, unknown>;
    const lat = num(ac.lat);
    const lng = num(ac.lon, ac.lng);
    if (lat === undefined || lng === undefined || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    const hex = String(ac.hex ?? ac.icao ?? "").trim();
    if (!hex) continue;
    const callsign = String(ac.flight ?? ac.callsign ?? hex).trim() || hex;
    vehicles.push({
      id: `EXT-${feedId}-${hex}`,
      type: "aircraft",
      callsign,
      icao: hex.toUpperCase(),
      lat,
      lng,
      heading: num(ac.track, ac.heading) ?? 0,
      speed: num(ac.gs, ac.speed) ?? 0,
      alt: num(ac.alt_baro, ac.altitude) ?? 0,
      source: "External Feed Source",
      rssi: num(ac.rssi, ac.sig),
    });
  }
  return vehicles;
}
