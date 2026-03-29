# Airwaves OS Control

Web management interface for Airwaves OS. React + Vite + Wouter (NOT Next.js).

## Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 7
- **Routing**: Wouter (NOT Next.js - no `"use client"` directives needed)
- **UI**: shadcn/ui (New York style, neutral base) + Radix UI + Tailwind CSS 4
- **State**: TanStack Query v5 + React Context (NodeProvider) + localStorage
- **Charts**: Recharts
- **Maps**: Leaflet + React Leaflet
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Key Files

- `client/src/lib/api.ts` - Typed fetch client for all manager API endpoints
- `client/src/hooks/useAirwavesApi.ts` - TanStack Query hooks (useSystemStats, useContainers, etc.)
- `client/src/hooks/useManagerEvents.ts` - WebSocket hook for real-time stats + container events
- `client/src/hooks/useApiStatus.ts` - Detects if manager API is available
- `client/src/lib/nodeStore.tsx` - Multi-node context with mock data (fallback)
- `client/src/lib/mockData.tsx` - Mock data types and fixtures
- `vite.config.ts` - Vite proxy: `/api/v1/*` -> `localhost:8080`, `/ws` -> `ws://localhost:8080`

## Conventions

- Every page auto-detects API and falls back to mock data
- Pattern: `const apiAvailable = useApiStatus(); const { data } = useXxx();`
- WebSocket stats preferred over REST poll: `wsStats ?? liveStats ?? mockValue`
- No `"use client"` directives - this is Vite/React, not Next.js
- Dark mode default, Inter + JetBrains Mono fonts

## Development

```bash
npm install
npm run dev          # Starts on port 5000, proxies /api/v1/* to localhost:8080

# Run with real manager:
# In airwaves-os repo: make dev-up
# Then: npm run dev
```

## Companion Repo

Backend: [airframesio/airwaves-os](https://github.com/airframesio/airwaves-os) - the OS + Rust manager
