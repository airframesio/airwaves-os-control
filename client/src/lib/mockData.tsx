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
  hasOutput?: boolean; // Indicates if the app produces message data for feeding
  // Extended fields for App Store
  longDescription?: string;
  developer?: string;
  website?: string;
  sourceUrl?: string; // New field for GitHub/Source Code
  lastUpdate?: string;
  size?: string;
  screenshots?: string[];
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
  type: "dedicated_app" | "integrated_option" | "raw_stream" | "audio_stream";
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
  mode: "standalone" | "processing";
  forwardingTarget?: string;
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
    mode: "standalone",
    lastSeen: "Just now"
  },
  {
    id: "sys-2",
    name: "Attic Node",
    hostname: "airwaves-node-1",
    ip: "192.168.1.105",
    status: "online",
    role: "secondary",
    mode: "processing",
    forwardingTarget: "192.168.1.100",
    lastSeen: "2 mins ago"
  },
  {
    id: "sys-3",
    name: "Garage Node",
    hostname: "airwaves-node-2",
    ip: "192.168.1.106",
    status: "offline",
    role: "secondary",
    mode: "standalone",
    lastSeen: "2 days ago"
  }
];

export const mockApps: App[] = [
  {
    id: "acarsdec",
    name: "acarsdec",
    description: "A fast, lightweight ACARS decoder for RTL-SDR and other radios.",
    longDescription: "acarsdec is a multi-channel ACARS decoder with built-in error detection. It is designed to be lightweight and efficient, making it perfect for running on low-power devices like Raspberry Pis. It supports up to 8 channels simultaneously and can decode ACARS messages in real-time, outputting them to a local log file or streaming them over the network via UDP/TCP.",
    developer: "TLeconte",
    website: "https://www.rtl-sdr.com/tag/acarsdec/",
    sourceUrl: "https://github.com/TLeconte/acarsdec",
    lastUpdate: "2025-11-15",
    size: "4.5 MB",
    version: "3.5.0",
    status: "running",
    icon: Plane,
    category: "aviation",
    installed: true,
    hasOutput: true,
    cpuUsage: 12,
    memoryUsage: 45,
    messageRate: 15,
    assignedDevice: "dev-1",
    screenshots: ["/screenshots/acarsdec-1.jpg", "/screenshots/acarsdec-2.jpg"]
  },
  {
    id: "acarshub",
    name: "acarshub",
    description: "A multi-source ACARS collector and forwarder.",
    longDescription: "ACARS Hub acts as a central aggregator for all your ACARS sources. It can ingest data from acarsdec, dumpvdl2, and other decoders, deduplicate messages, and forward them to various community aggregators like Airframes.io. It provides a web interface for viewing live messages and managing feeds.",
    developer: "Airframes.io",
    website: "https://airframes.io",
    sourceUrl: "https://github.com/sdr-enthusiasts/acarshub",
    lastUpdate: "2025-10-20",
    size: "45 MB",
    version: "2.1.0",
    status: "running",
    icon: Server,
    category: "aviation",
    installed: true,
    hasOutput: true,
    cpuUsage: 5,
    memoryUsage: 120,
    messageRate: 85,
    screenshots: ["/screenshots/acarshub-1.jpg"]
  },
  {
    id: "readsb",
    name: "readsb",
    description: "High-performance ADS-B decoder.",
    longDescription: "readsb is a Mode-S/ADS-B/TIS-B decoder for RTL-SDR, Airspy, and other SDRs. It is a fork of dump1090-fa optimized for performance and lower resource usage. It includes a built-in web map for tracking aircraft in real-time and supports feeding data to multiple output formats.",
    developer: "Wiedehopf",
    website: "https://github.com/wiedehopf/readsb", // readsb doesn't really have a separate marketing site
    sourceUrl: "https://github.com/wiedehopf/readsb",
    lastUpdate: "2025-12-01",
    size: "12 MB",
    version: "3.14.0",
    status: "running",
    icon: Radar,
    category: "aviation",
    installed: true,
    hasOutput: true,
    cpuUsage: 25,
    memoryUsage: 80,
    messageRate: 420,
    assignedDevice: "dev-2",
    screenshots: ["/screenshots/readsb-1.jpg", "/screenshots/readsb-2.jpg", "/screenshots/readsb-3.jpg"]
  },
  {
    id: "ais-catcher",
    name: "AIS-Catcher",
    description: "AIS receiver for decoding ship positions.",
    longDescription: "AIS-catcher is a dual-channel AIS receiver for RTL-SDR devices. It decodes AIS messages from ships and transmits them via UDP or TCP. It features advanced DSP algorithms for improved sensitivity and can decode messages even in high-noise environments.",
    developer: "jvde-github",
    website: "https://aiscatcher.org",
    sourceUrl: "https://github.com/jvde-github/AIS-catcher",
    lastUpdate: "2025-09-30",
    size: "8.2 MB",
    version: "0.41.0",
    status: "stopped",
    icon: Ship,
    category: "maritime",
    installed: true,
    hasOutput: true,
    cpuUsage: 0,
    memoryUsage: 0,
    messageRate: 0,
    screenshots: ["/screenshots/aiscatcher-1.jpg"]
  },
  {
    id: "satdump",
    name: "SatDump",
    description: "Powerful satellite signal processing and decoding.",
    longDescription: "SatDump is a comprehensive software for processing and decoding satellite signals. It supports a wide range of weather satellites (NOAA, Meteor, GOES) and other data satellites. It handles everything from demodulation to image processing and projection.",
    developer: "SatDump Team",
    website: "https://www.satdump.org",
    sourceUrl: "https://github.com/SatDump/SatDump",
    lastUpdate: "2025-12-10",
    size: "150 MB",
    version: "1.0.1",
    status: "stopped",
    icon: Satellite,
    category: "satcom",
    installed: false,
    hasOutput: true,
    cpuUsage: 0,
    memoryUsage: 0,
    screenshots: ["/screenshots/satdump-1.jpg", "/screenshots/satdump-2.jpg"]
  },
  {
    id: "rtl_433",
    name: "rtl_433",
    description: "Generic data receiver for 433MHz devices.",
    longDescription: "rtl_433 turns your Realtek RTL2832 based DVB dongle into a 433.92MHz generic data receiver. It can decode signals from hundreds of remote sensors, weather stations, TPMS sensors, and energy meters.",
    developer: "merbanan",
    website: "https://triq.org/rtl_433/",
    sourceUrl: "https://github.com/merbanan/rtl_433",
    lastUpdate: "2025-11-05",
    size: "6.8 MB",
    version: "22.11",
    status: "stopped",
    icon: Wifi,
    category: "utility",
    installed: false,
    hasOutput: true,
    cpuUsage: 0,
    memoryUsage: 0,
    screenshots: []
  },
  {
    id: "dumpvdl2",
    name: "dumpvdl2",
    description: "VDL Mode 2 message decoder.",
    longDescription: "dumpvdl2 is a VDL Mode 2 message decoder and protocol analyzer. It supports RTL-SDR, Airspy, and SDRPlay devices. VDL Mode 2 is used for Controller-Pilot Data Link Communications (CPDLC) and provides higher data rates than traditional ACARS.",
    developer: "szpajder",
    website: "https://github.com/szpajder/dumpvdl2",
    sourceUrl: "https://github.com/szpajder/dumpvdl2",
    lastUpdate: "2025-10-15",
    size: "5.5 MB",
    version: "2.3.0",
    status: "running",
    icon: Plane,
    category: "aviation",
    installed: true,
    hasOutput: true,
    cpuUsage: 15,
    memoryUsage: 60,
    messageRate: 22,
    assignedDevice: "dev-3",
    screenshots: ["/screenshots/dumpvdl2-1.jpg"]
  },
  {
    id: "rtl_airband",
    name: "rtl_airband",
    description: "Multichannel AM/FM receiver for RTL-SDR.",
    longDescription: "rtl_airband is a multichannel AM/FM receiver designed for RTL-SDR dongles. It is primarily used for monitoring air traffic control (ATC) communications. It can scan multiple frequencies or monitor a set of frequencies simultaneously and stream the audio to Icecast or save it to MP3 files.",
    developer: "charlie-foxtrot",
    website: "https://github.com/charlie-foxtrot/rtl_airband",
    sourceUrl: "https://github.com/charlie-foxtrot/rtl_airband",
    lastUpdate: "2025-08-20",
    size: "3.2 MB",
    version: "4.0.3",
    status: "running",
    icon: Radio,
    category: "aviation",
    installed: true,
    hasOutput: false, // rtl_airband streams audio, not message data
    cpuUsage: 18,
    memoryUsage: 45,
    messageRate: 0,
    assignedDevice: "dev-4",
    screenshots: []
  },
  {
    id: "external-feed-source",
    name: "External Feed Source",
    description: "Connect to external aircraft.json feeds.",
    longDescription: "This app allows you to connect to external ADS-B receivers exposing aircraft.json data (e.g., from tar1090 or readsb). Data from these sources is displayed on your local map but is NEVER forwarded to aggregator feeds.",
    developer: "Airwaves OS",
    website: "",
    sourceUrl: "",
    lastUpdate: "2026-01-07",
    size: "1.2 MB",
    version: "1.0.0",
    status: "running",
    icon: Globe,
    category: "utility",
    installed: true,
    hasOutput: true,
    cpuUsage: 1,
    memoryUsage: 15,
    messageRate: 0,
    screenshots: []
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
    type: "dedicated_app",
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
    type: "integrated_option",
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
    type: "integrated_option",
    destination: "5.9.207.224",
    protocol: "UDP",
    port: 5321,
    status: "disconnected",
    messageRate: 0,
    appId: "ais-catcher"
  },
  {
    id: "feed-4",
    name: "Local VDL2 Stream",
    type: "raw_stream",
    destination: "192.168.1.50",
    protocol: "UDP",
    port: 5555,
    status: "connected",
    messageRate: 22,
    appId: "dumpvdl2"
  },
  {
    id: "feed-5",
    name: "Tower Audio Feed",
    type: "audio_stream",
    destination: "stream.airwaves.local",
    protocol: "TCP",
    port: 8000,
    status: "connected",
    messageRate: 0,
    appId: "rtl_airband"
  }
];

export const systemStats = {
  cpu: 45,
  memory: 62,
  disk: 28,
  diskTotal: "256 GB",
  diskUsed: "71.6 GB",
  temp: 52,
  uptime: "4d 12h 30m",
  os: "Airwaves OS v1.2.0 (Linux 6.1.0)",
  arch: "aarch64",
  model: "Raspberry Pi 5 Model B",
  ip: "192.168.1.100"
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
