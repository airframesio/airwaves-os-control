# Airwaves OS

A comprehensive web-based SDR (Software Defined Radio) dashboard for managing radio receivers, feeds, and applications across multiple nodes.

![Airwaves OS](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## Overview

Airwaves OS provides a unified interface for managing your entire SDR infrastructure. Whether you're tracking aircraft with ADS-B, monitoring ship traffic with AIS, or decoding aviation communications with ACARS, Airwaves OS brings everything together in one beautiful, responsive dashboard.

## Features

### Core Capabilities

- **Multi-Node Management** - Monitor and control SDR applications across multiple Raspberry Pis or servers from a single dashboard
- **Real-Time Tracking** - Visualize aircraft (ADS-B) and ships (AIS) on interactive Leaflet maps
- **Data Feeds** - Connect your receivers to global aggregators like FlightRadar24, FlightAware, Airframes.io, and MarineTraffic
- **App Catalog** - Install and manage SDR applications with one click
- **Live Message Streaming** - View decoded messages from all your receivers in real-time
- **System Monitoring** - Track CPU, memory, disk usage, and temperature across all nodes

### Supported Applications

| Application | Description | Category |
|-------------|-------------|----------|
| **readsb** | High-performance ADS-B decoder | Aviation |
| **acarsdec** | Multi-channel ACARS decoder | Aviation |
| **acarshub** | ACARS aggregator and forwarder | Aviation |
| **dumpvdl2** | VDL Mode 2 message decoder | Aviation |
| **rtl_airband** | Multichannel AM/FM receiver | Aviation |
| **AIS-Catcher** | Dual-channel AIS receiver | Maritime |
| **SatDump** | Satellite signal processor | Satcom |
| **rtl_433** | ISM band data receiver | Utility |

### Data Feed Integrations

- FlightRadar24
- FlightAware
- Airframes.io
- Airplanes.live
- MarineTraffic
- Custom TCP/UDP destinations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui, Radix UI |
| Routing | Wouter |
| State | TanStack Query |
| Animations | Framer Motion |
| Maps | Leaflet, React-Leaflet |
| Charts | Recharts |

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

### Static Build

```bash
# Build for production
npm run build

# Preview the build locally
npm run preview
```

The `dist/` folder contains optimized static files that can be deployed to any hosting service.

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui base components
│   │   │   └── layout/     # Layout components (sidebar, header)
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities, mock data, stores
│   │   └── hooks/          # Custom React hooks
│   └── index.html          # Entry HTML file
├── README.md
└── package.json
```

## Pages

| Page | Description |
|------|-------------|
| **Dashboard** | System overview with stats, active apps, and quick actions |
| **My Apps** | Manage installed SDR applications |
| **App Store** | Browse and install new applications |
| **Data Feeds** | Configure aggregator connections with bandwidth monitoring |
| **Live Messages** | Real-time message stream from all decoders |
| **Devices** | Manage connected SDR hardware (RTL-SDR, Airspy, etc.) |
| **Nodes** | Multi-node system management and pairing |
| **Airband** | RTL Airband configuration and Icecast audio streaming |
| **Map** | Interactive aircraft and ship tracking visualization |

## Design Philosophy

Airwaves OS is built with a focus on:

- **Clarity** - Information-dense dashboards that remain readable
- **Responsiveness** - Works on desktop, tablet, and mobile
- **Dark Mode First** - Optimized for low-light environments
- **Real-time Updates** - Live data streaming throughout the UI

## Deployment

The static build can be deployed to:

- **Replit** - Use the Deploy button
- **Vercel / Netlify** - Connect your repo for automatic deployments
- **GitHub Pages** - Push the `dist/` folder to `gh-pages` branch
- **Self-hosted** - Serve with nginx, Apache, or any static file server

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with care for the SDR community.
