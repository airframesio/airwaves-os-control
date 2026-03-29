/**
 * Airwaves OS API Client
 *
 * Provides typed access to the airwaves-manager REST API.
 * Falls back gracefully when the API is unavailable (e.g., development mode).
 */

const API_BASE = '/api/v1';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ---------- System ----------

export interface SystemInfo {
  hostname: string;
  os: string;
  architecture: string;
  kernel: string;
  uptime: number;
  airwaves_version: string;
}

export interface SystemStats {
  cpu_usage: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
  disk_total: number;
  disk_used: number;
  disk_percent: number;
  temperature: number | null;
  load_average: [number, number, number];
}

export interface ExecResponse {
  exit_code: number;
  stdout: string;
  stderr: string;
}

export const systemApi = {
  getInfo: () => apiFetch<SystemInfo>('/system/info'),
  getStats: () => apiFetch<SystemStats>('/system/stats'),
  exec: (command: string) => apiFetch<ExecResponse>('/system/exec', {
    method: 'POST',
    body: JSON.stringify({ command }),
  }),
};

// ---------- Containers ----------

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  created: number;
  ports: Array<{
    container_port: number;
    host_port: number | null;
    protocol: string;
  }>;
}

export const containersApi = {
  list: () => apiFetch<ContainerInfo[]>('/containers'),
  start: (id: string) => apiFetch<{ status: string }>(`/containers/${encodeURIComponent(id)}/start`, { method: 'POST' }),
  stop: (id: string) => apiFetch<{ status: string }>(`/containers/${encodeURIComponent(id)}/stop`, { method: 'POST' }),
  restart: (id: string) => apiFetch<{ status: string }>(`/containers/${encodeURIComponent(id)}/restart`, { method: 'POST' }),
  logs: (id: string, tail = 100) => apiFetch<{ id: string; logs: string }>(`/containers/${encodeURIComponent(id)}/logs?tail=${tail}`),
};

// ---------- Hardware ----------

export interface UsbDevice {
  vendor_id: number;
  product_id: number;
  vendor_name: string | null;
  product_name: string | null;
  serial: string | null;
  bus: number;
  address: number;
}

export interface SdrDevice {
  id: string;
  name: string;
  device_type: string;
  vendor_id: number;
  product_id: number;
  serial: string | null;
  status: string;
  assigned_to: string | null;
}

export const hardwareApi = {
  listDevices: () => apiFetch<UsbDevice[]>('/hardware/devices'),
  listSdr: () => apiFetch<SdrDevice[]>('/hardware/sdr'),
};

// ---------- Network ----------

export interface NetworkInterface {
  name: string;
  mac_address: string;
  ip_addresses: string[];
  is_up: boolean;
  interface_type: string;
}

export const networkApi = {
  listInterfaces: () => apiFetch<NetworkInterface[]>('/network/interfaces'),
};

// ---------- Config ----------

export interface AirwavesConfig {
  version: number;
  device: {
    id: string;
    name: string;
    hostname: string;
  };
  station: {
    latitude: number;
    longitude: number;
    altitude_m: number;
    operator: string;
  };
  network: {
    mode: string;
  };
  services: Record<string, { enabled: boolean }>;
  aggregators: Record<string, unknown>;
  apps: Record<string, unknown>;
}

export const configApi = {
  get: () => apiFetch<AirwavesConfig>('/config'),
  update: (config: AirwavesConfig) => apiFetch<{ status: string }>('/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  }),
};

// ---------- App Catalog ----------

export interface CatalogApp {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  image: string;
  icon: string | null;
  ports: Array<{
    container_port: number;
    host_port: number | null;
    protocol: string;
  }>;
  requires_sdr: boolean;
  sdr_types: string[];
}

export const appsApi = {
  catalog: () => apiFetch<CatalogApp[]>('/apps/catalog'),
  install: (appId: string) => apiFetch<ContainerInfo>('/apps/install', {
    method: 'POST',
    body: JSON.stringify({ app_id: appId }),
  }),
  uninstall: (appId: string) => apiFetch<{ status: string }>(`/apps/${encodeURIComponent(appId)}`, {
    method: 'DELETE',
  }),
};

// ---------- WebSocket ----------

export type WsEvent =
  | { type: 'ContainerStatusChanged'; data: { id: string; name: string; status: string } }
  | { type: 'SystemStats'; data: SystemStats }
  | { type: 'SdrDeviceChanged'; data: { action: string; device_id: string } }
  | { type: 'AppInstalled'; data: { app_id: string; container_id: string } }
  | { type: 'AppUninstalled'; data: { app_id: string } };

export function connectWs(onEvent: (event: WsEvent) => void): WebSocket | null {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/ws/events`;

  try {
    const ws = new WebSocket(url);

    ws.onmessage = (msg) => {
      try {
        const event: WsEvent = JSON.parse(msg.data);
        onEvent(event);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Reconnect after 5 seconds
      setTimeout(() => connectWs(onEvent), 5000);
    };

    return ws;
  } catch {
    return null;
  }
}

// ---------- Health check ----------

export async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE.replace('/v1', '')}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
