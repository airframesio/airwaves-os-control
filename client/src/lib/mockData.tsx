import { Activity, Radio, Server, Globe, Box, Terminal, Wifi, Ship, Plane, Satellite, Radar } from "lucide-react";
import React from 'react';

export interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "running" | "stopped" | "error" | "installing";
  icon: any;
  category: "aviation" | "maritime" | "system" | "utility" | "satcom";
  installed: boolean;
  cpuUsage: number;
  memoryUsage: number;
  messageRate?: number;
  assignedDevice?: string;
}

export interface Device {
  id: string;
  name: string;
  type: "RTL-SDR" | "Airspy" | "HackRF" | "LimeSDR";
  serial: string;
  status: "active" | "idle" | "disconnected";
  assignedApp?: string;
}

export interface Feed {
  id: string;
  name: string;
  destination: string;
  protocol: "TCP" | "UDP";
  port: number;
  status: "connected" | "disconnected" | "error";
  messageRate: number; // msgs per minute
  appId: string;
}

export interface System {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  status: "online" | "offline" | "pairing";
  role: "primary" | "secondary";
  lastSeen: string;
}

export const mockSystems: System[] = [
  {
    id: "sys-1",
    name: "Airwaves Core (This Device)",
    hostname: "airwaves-core",
    ip: "192.168.1.100",
    status: "online",
    role: "primary",
    lastSeen: "Just now"
  },
  {
    id: "sys-2",
    name: "Attic Node",
    hostname: "airwaves-node-1",
    ip: "192.168.1.105",
    status: "online",
    role: "secondary",
    lastSeen: "2 mins ago"
  },
  {
    id: "sys-3",
    name: "Garage Node",
    hostname: "airwaves-node-2",
    ip: "192.168.1.106",
    status: "offline",
    role: "secondary",
    lastSeen: "2 days ago"
  }
];

export const mockApps: App[] = [
  {
    id: "acarsdec",
    name: "acarsdec",
    description: "A fast, lightweight ACARS decoder for RTL-SDR and other radios.",
    version: "3.5.0",
    status: "running",
    icon: Plane,
    category: "aviation",
    installed: true,
    cpuUsage: 12,
    memoryUsage: 45,
    messageRate: 15,
    assignedDevice: "dev-1"
  },
  {
    id: "acarshub",
    name: "acarshub",
    description: "A multi-source ACARS collector and forwarder.",
    version: "2.1.0",
    status: "running",
    icon: Server,
    category: "aviation",
    installed: true,
    cpuUsage: 5,
    memoryUsage: 120,
    messageRate: 85,
  },
  {
    id: "readsb",
    name: "readsb",
    description: "High-performance ADS-B decoder.",
    version: "3.14.0",
    status: "running",
    icon: Radar,
    category: "aviation",
    installed: true,
    cpuUsage: 25,
    memoryUsage: 80,
    messageRate: 420,
    assignedDevice: "dev-2"
  },
  {
    id: "ais-catcher",
    name: "AIS-Catcher",
    description: "AIS receiver for decoding ship positions.",
    version: "0.41.0",
    status: "stopped",
    icon: Ship,
    category: "maritime",
    installed: true,
    cpuUsage: 0,
    memoryUsage: 0,
    messageRate: 0,
  },
  {
    id: "satdump",
    name: "SatDump",
    description: "Powerful satellite signal processing and decoding.",
    version: "1.0.1",
    status: "stopped",
    icon: Satellite,
    category: "satcom",
    installed: false,
    cpuUsage: 0,
    memoryUsage: 0,
  },
  {
    id: "rtl_433",
    name: "rtl_433",
    description: "Generic data receiver for 433MHz devices.",
    version: "22.11",
    status: "stopped",
    icon: Wifi,
    category: "utility",
    installed: false,
    cpuUsage: 0,
    memoryUsage: 0,
  },
  {
    id: "dumpvdl2",
    name: "dumpvdl2",
    description: "VDL Mode 2 message decoder.",
    version: "2.3.0",
    status: "running",
    icon: Plane,
    category: "aviation",
    installed: true,
    cpuUsage: 15,
    memoryUsage: 60,
    messageRate: 22,
    assignedDevice: "dev-3"
  },
  {
    id: "rtl_airband",
    name: "rtl_airband",
    description: "Multichannel AM/FM receiver for RTL-SDR, specialized for airband monitoring.",
    version: "4.0.3",
    status: "stopped",
    icon: Radio,
    category: "aviation",
    installed: false,
    cpuUsage: 0,
    memoryUsage: 0,
  }
];

export const mockDevices: Device[] = [
  {
    id: "dev-1",
    name: "RTL-SDR Blog V3",
    type: "RTL-SDR",
    serial: "00000001",
    status: "active",
    assignedApp: "acarsdec"
  },
  {
    id: "dev-2",
    name: "FlightAware Pro Stick Plus",
    type: "RTL-SDR",
    serial: "00001090",
    status: "active",
    assignedApp: "readsb"
  },
  {
    id: "dev-3",
    name: "Nooelec NESDR",
    type: "RTL-SDR",
    serial: "00000002",
    status: "active",
    assignedApp: "dumpvdl2"
  },
  {
    id: "dev-4",
    name: "Airspy R2",
    type: "Airspy",
    serial: "644064DC234",
    status: "idle"
  }
];

export const mockFeeds: Feed[] = [
  {
    id: "feed-1",
    name: "Airframes.io ACARS",
    destination: "feed.airframes.io",
    protocol: "TCP",
    port: 5550,
    status: "connected",
    messageRate: 42,
    appId: "acarshub"
  },
  {
    id: "feed-2",
    name: "Airplanes.live ADS-B",
    destination: "feed.airplanes.live",
    protocol: "TCP",
    port: 30005,
    status: "connected",
    messageRate: 150,
    appId: "readsb"
  },
  {
    id: "feed-3",
    name: "MarineTraffic",
    destination: "5.9.207.224",
    protocol: "UDP",
    port: 5321,
    status: "disconnected",
    messageRate: 0,
    appId: "ais-catcher"
  }
];

export const systemStats = {
  cpu: 45,
  memory: 62,
  disk: 28,
  temp: 52,
  uptime: "4d 12h 30m"
};

export interface Message {
  id: string;
  timestamp: string;
  appId: string;
  appName: string;
  frequency: string;
  mode: string;
  signalLevel: number;
  source: string;
  content: string;
}

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    timestamp: "2026-01-03 14:30:05",
    appId: "acarsdec",
    appName: "acarsdec",
    frequency: "131.550 MHz",
    mode: "ACARS",
    signalLevel: -12,
    source: "N12345",
    content: "ACARS mode: 2 label: 5U block_id: 4 msg_no: M03A flight_id: UA1234 message_content: /POS 3742N12224W"
  },
  {
    id: "msg-2",
    timestamp: "2026-01-03 14:30:12",
    appId: "readsb",
    appName: "readsb",
    frequency: "1090 MHz",
    mode: "ADSB",
    signalLevel: -5,
    source: "A839B1",
    content: "DF: 17 CA: 5 TC: 11 (Airborne Position) Altitude: 32000 ft Lat: 37.65 Lon: -122.31"
  },
  {
    id: "msg-3",
    timestamp: "2026-01-03 14:30:15",
    appId: "acarshub",
    appName: "acarshub",
    frequency: "N/A",
    mode: "VDL2",
    signalLevel: -8,
    source: "G-ABCD",
    content: "AVLC: 1 dst: Ground src: G-ABCD type: Data content: REQUEST DEPARTURE CLEARANCE"
  },
  {
    id: "msg-4",
    timestamp: "2026-01-03 14:30:22",
    appId: "dumpvdl2",
    appName: "dumpvdl2",
    frequency: "136.975 MHz",
    mode: "VDL2",
    signalLevel: -15,
    source: "Ground Station",
    content: "XID: Handoff Request"
  },
  {
    id: "msg-5",
    timestamp: "2026-01-03 14:30:28",
    appId: "ais-catcher",
    appName: "AIS-Catcher",
    frequency: "162.025 MHz",
    mode: "AIS",
    signalLevel: -2,
    source: "MMSI 123456789",
    content: "Type: 1 (Position Report Class A) Status: Under way using engine Speed: 12.5 kn Course: 185"
  },
  {
    id: "msg-6",
    timestamp: "2026-01-03 14:30:35",
    appId: "readsb",
    appName: "readsb",
    frequency: "1090 MHz",
    mode: "ADSB",
    signalLevel: -6,
    source: "C0FFEE",
    content: "DF: 17 CA: 5 TC: 4 (Identification) Callsign: ACA789"
  },
  {
    id: "msg-7",
    timestamp: "2026-01-03 14:30:42",
    appId: "acarsdec",
    appName: "acarsdec",
    frequency: "131.550 MHz",
    mode: "ACARS",
    signalLevel: -10,
    source: "N67890",
    content: "ACARS mode: E label: Q0 block_id: 8 msg_no: M12B flight_id: DL456 message_content: LINK TEST"
  }
];
