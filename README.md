# Airwaves OS

A comprehensive web-based SDR (Software Defined Radio) dashboard for managing radio receivers, feeds, and applications across multiple nodes.

## Features

- **Multi-Node Management** - Monitor and control SDR applications across multiple devices from a single dashboard
- **Real-Time Tracking** - Visualize aircraft (ADS-B) and ships (AIS) on interactive maps
- **Data Feeds** - Connect your receivers to global aggregators like FlightRadar24, FlightAware, Airframes.io, and MarineTraffic
- **App Catalog** - Install and manage SDR applications including acarsdec, readsb, AIS-Catcher, rtl_airband, and more
- **Live Message Streaming** - View decoded messages from all your receivers in real-time
- **System Monitoring** - Track CPU, memory, disk usage, and temperature across all nodes
- **Airband Audio** - Stream and monitor aviation frequencies with rtl_airband integration

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Animations**: Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
client/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Page components
│   ├── lib/           # Utilities and mock data
│   └── hooks/         # Custom React hooks
```

## Pages

- **Dashboard** - Overview of system status, active apps, and quick stats
- **My Apps** - Manage installed SDR applications
- **App Store** - Browse and install new applications
- **Data Feeds** - Configure connections to data aggregators
- **Live Messages** - Real-time message stream from all decoders
- **Devices** - Manage connected SDR hardware
- **Nodes** - Multi-node system management
- **Airband** - RTL Airband configuration and audio streaming

## License

MIT
