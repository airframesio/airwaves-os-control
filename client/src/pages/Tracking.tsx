import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, Polyline } from "react-leaflet";
import { divIcon } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plane, Ship, Navigation, X, Clock, MapPin, Radio, Activity, ArrowUpRight, Eye } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from 'react-dom/server';
import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNodeStore } from "@/lib/nodeStore";
import { useTracking } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import DemoBadge from "@/components/DemoBadge";
import { loadExternalFeeds, parseAircraftJson } from "@/lib/externalFeeds";

const FEED_TIMEOUT_MS = 5_000;

// Helper to generate simulated path
// Helper component to update map center
function MapUpdater({ selectedVehicle, activeNodeLocation }: { selectedVehicle: { lat: number, lng: number } | null, activeNodeLocation: { lat: number, lng: number } }) {
  const map = useMapEvents({});
  const prevNodeLoc = useRef(activeNodeLocation);

  // Effect to move to node location when it changes
  useEffect(() => {
    if (prevNodeLoc.current.lat !== activeNodeLocation.lat || prevNodeLoc.current.lng !== activeNodeLocation.lng) {
      map.setView([activeNodeLocation.lat, activeNodeLocation.lng], 10, {
        animate: true,
        duration: 1.5
      });
      prevNodeLoc.current = activeNodeLocation;
    }
  }, [activeNodeLocation, map]);
  
  // Effect to follow selected vehicle
  useEffect(() => {
    if (selectedVehicle) {
      // Calculate offset based on sidebar width (320px + padding)
      const sidebarOffset = 168; // 336px / 2
      const targetPoint = map.project([selectedVehicle.lat, selectedVehicle.lng], map.getZoom());
      const newCenterPoint = targetPoint.add([sidebarOffset, 0]);
      const newCenter = map.unproject(newCenterPoint, map.getZoom());

      map.setView(newCenter, map.getZoom(), {
        animate: true,
        duration: 0.1 // Short duration for smoother following
      });
    }
  }, [selectedVehicle, map]);

  return null;
}

// Helper component to track map zoom
function MapEvents({ setZoom }: { setZoom: (z: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });
  return null;
}

// Create custom icon function
const createVehicleIcon = (type: string, heading: number, zoom: number, isSelected: boolean) => {
  const rotationOffset = type === 'aircraft' ? -45 : 0;
  
  // Scale icon size based on zoom
  const baseSize = 24;
  let scale = 1;
  
  if (zoom < 6) scale = 0.2; // Tiny dots
  else if (zoom < 8) scale = 0.5; // Small icons
  else if (zoom < 10) scale = 0.8; // Medium icons
  else scale = 1; // Full size

  const size = baseSize * scale;

  const iconMarkup = renderToStaticMarkup(
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Target indicator for selected vehicle */}
      {isSelected && (
        <div className="absolute inset-[-8px] border-2 border-orange-500 rounded-full animate-pulse opacity-80" />
      )}
      
      <div style={{ 
        transform: `rotate(${heading + rotationOffset}deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        transition: 'all 0.3s ease',
      }}>
        {zoom < 6 ? (
          // Simple dot for low zoom
          <div className={`w-2 h-2 rounded-full ${type === 'aircraft' ? 'bg-sky-500' : 'bg-emerald-500'} ${isSelected ? 'ring-2 ring-white scale-150' : ''}`} />
        ) : (
          type === 'aircraft' ? (
            <Plane 
              size={size} 
              className={`${isSelected ? 'text-sky-400 fill-sky-500/40' : 'text-sky-500 fill-sky-500/20'}`}
              strokeWidth={isSelected ? 3 : 2}
            />
          ) : (
            <div style={{ transform: 'rotate(-90deg)' }}> 
              <Ship 
                size={size} 
                className={`${isSelected ? 'text-emerald-400 fill-emerald-500/40' : 'text-emerald-500 fill-emerald-500/20'}`}
                strokeWidth={isSelected ? 3 : 2}
              />
            </div>
          )
        )}
      </div>
    </div>
  );

  return divIcon({
    html: iconMarkup,
    className: 'bg-transparent',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

export default function Tracking() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Connect to Node Store and real API
  const { activeNode, data } = useNodeStore();
  const apiAvailable = useApiStatus();
  const { data: trackingData } = useTracking();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [externalVehicles, setExternalVehicles] = useState<any[]>([]);
  const [zoom, setZoom] = useState(10);
  // Selection is stored by id and the vehicle is looked up on each render, so
  // position updates never need to call a setter from inside another updater.
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  const [showFlightPath, setShowFlightPath] = useState(false);
  const [showAllTrails, setShowAllTrails] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<Record<string, [number, number][]>>({});

  // Tracks whether mock vehicles have been seeded for the current node, so we
  // seed them once and then let the client simulation drive them — rather than
  // resetting positions to origin every time the (empty) tracking API refetches.
  const mockSeededRef = useRef(false);

  // Reset state when active node changes
  useEffect(() => {
    setSelectedVehicleId(null);
    setExternalVehicles([]);
    setVehicleHistory({});
    mockSeededRef.current = false;
    // Internal vehicles will be updated by the sync effect below
  }, [activeNode.id]);

  // With the manager reachable, its tracking data is authoritative, even when
  // it is empty (a quiet sky must not turn into the demo fleet). Mock
  // vehicles are only used when there is no manager, and are seeded once per
  // node so the client simulation can move them without snapping back.
  const isLive = apiAvailable;
  useEffect(() => {
    if (isLive) {
      mockSeededRef.current = false;
      if (!trackingData) return;
      setVehicles((trackingData.vehicles ?? []).map(v => ({
        id: v.id,
        callsign: v.callsign,
        icao: v.id.toUpperCase(),
        type: v.vehicle_type,
        lat: v.lat,
        lng: v.lng,
        alt: v.altitude,
        speed: v.speed,
        heading: v.heading,
        source: v.source,
      })));
    } else if (!mockSeededRef.current) {
      setVehicles(data.vehicles || []);
      mockSeededRef.current = true;
    }
  }, [isLive, trackingData, data.vehicles]);

  const selectedVehicle = useMemo(
    () => (selectedVehicleId
      ? vehicles.find(v => v.id === selectedVehicleId) ?? externalVehicles.find(v => v.id === selectedVehicleId) ?? null
      : null),
    [selectedVehicleId, vehicles, externalVehicles],
  );

  // Drop the selection when the vehicle disappears from every source.
  useEffect(() => {
    if (selectedVehicleId && !selectedVehicle) setSelectedVehicleId(null);
  }, [selectedVehicleId, selectedVehicle]);

  // Keep refs synced with state so the trail recorder (an interval) always
  // reads the latest positions without stale closures.
  const vehiclesRef = useRef<any[]>(vehicles);
  const externalVehiclesRef = useRef<any[]>(externalVehicles);
  useEffect(() => { vehiclesRef.current = vehicles; }, [vehicles]);
  useEffect(() => { externalVehiclesRef.current = externalVehicles; }, [externalVehicles]);

  // Flight path for the selected vehicle comes from accumulated real history.
  useEffect(() => {
    if (selectedVehicle && showFlightPath) {
      setFlightPath(vehicleHistory[selectedVehicle.id] || []);
    } else {
      setFlightPath([]);
    }
  }, [selectedVehicle, showFlightPath, vehicleHistory]);
  
  // Reset flight path view when deselected
  useEffect(() => {
    if (!selectedVehicle) {
      setShowFlightPath(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // External aircraft.json feeds configured under My Apps. Each feed is
  // fetched directly by the browser on its own interval, with a timeout; a
  // feed that is still loading is not requested again, and everything in
  // flight is aborted when the page unmounts.
  useEffect(() => {
    const feeds = loadExternalFeeds().filter(f => f.enabled);
    if (feeds.length === 0) return;

    let alive = true;
    const byFeed = new Map<string, any[]>();
    const controllers = new Map<string, AbortController>();
    const timers: ReturnType<typeof setInterval>[] = [];

    const publish = () => {
      if (alive) setExternalVehicles(Array.from(byFeed.values()).flat());
    };

    const poll = async (feed: (typeof feeds)[number]) => {
      if (controllers.has(feed.id)) return;
      const controller = new AbortController();
      controllers.set(feed.id, controller);
      const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
      try {
        const response = await fetch(feed.url, { signal: controller.signal });
        if (!response.ok) throw new Error(response.statusText);
        byFeed.set(feed.id, parseAircraftJson(feed.id, await response.json()));
      } catch (e) {
        if (!alive) return;
        console.warn(`External feed ${feed.url} failed`, e);
        byFeed.delete(feed.id);
      } finally {
        clearTimeout(timeout);
        controllers.delete(feed.id);
      }
      publish();
    };

    for (const feed of feeds) {
      poll(feed);
      timers.push(setInterval(() => poll(feed), feed.interval * 1000));
    }

    return () => {
      alive = false;
      timers.forEach(clearInterval);
      controllers.forEach(c => c.abort());
    };
  }, [activeNode.id]);

  // Demo only: move mock vehicles between frames. Real positions come from
  // the manager and are never moved by the client.
  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(() => {
      setVehicles(prev => {
        if (prev.length === 0) return prev;
        return prev.map(v => {
          const moveDist = v.speed * 0.000003;
          const rad = (90 - v.heading) * (Math.PI / 180);
          let heading = v.heading + (Math.random() * 2 - 1);
          if (heading < 0) heading += 360;
          if (heading >= 360) heading -= 360;
          return {
            ...v,
            lat: v.lat + Math.sin(rad) * moveDist,
            lng: v.lng + Math.cos(rad) * moveDist,
            heading,
          };
        });
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    // Unified trail recorder: sample every vehicle's position into in-browser
    // history (regardless of "Show All Trails"), so trails are accurate and
    // immediately available when toggled on. Prunes a vehicle's trail once it
    // is no longer present. Deduped by distance and capped for efficiency.
    const MAX_TRAIL_POINTS = 200;
    const MIN_MOVE = 0.0001; // ~10m; ignore jitter
    const recordInterval = setInterval(() => {
      const current = [...vehiclesRef.current, ...externalVehiclesRef.current];
      setVehicleHistory(prev => {
        const next = { ...prev };
        const currentIds = new Set<string>();
        let changed = false;

        for (const v of current) {
          if (typeof v?.lat !== 'number' || typeof v?.lng !== 'number') continue;
          currentIds.add(v.id);
          const existing = next[v.id] || [];
          const last = existing[existing.length - 1];
          if (!last || Math.abs(last[0] - v.lat) > MIN_MOVE || Math.abs(last[1] - v.lng) > MIN_MOVE) {
            next[v.id] = [...existing, [v.lat, v.lng] as [number, number]].slice(-MAX_TRAIL_POINTS);
            changed = true;
          }
        }

        // Delete trails for vehicles that are no longer available.
        for (const id of Object.keys(next)) {
          if (!currentIds.has(id)) {
            delete next[id];
            changed = true;
          }
        }

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(recordInterval);
  }, []);

  // Determine actual theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  // Tile layer URLs for different modes
  const tileLayer = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const mapBackground = isDark ? "#0f172a" : "#f8fafc"; // slate-900 or slate-50

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col relative">
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-top:before,
        .leaflet-tooltip-bottom:before,
        .leaflet-tooltip-left:before,
        .leaflet-tooltip-right:before {
          display: none !important;
        }
      `}</style>
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur border border-border/50 p-4 rounded-xl shadow-lg w-64">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Live Tracking
          <DemoBadge show={!isLive} />
        </h1>
        <p className="text-xs text-muted-foreground mb-3">
          Connected to {activeNode.name}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-2">
              <Plane className="w-3 h-3 text-sky-500" /> Aircraft
            </span>
            <Badge variant="secondary" className="font-mono text-[10px] h-5">{vehicles.filter(v => v.type === 'aircraft').length + externalVehicles.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-2">
              <Ship className="w-3 h-3 text-emerald-500" /> Vessels
            </span>
            <Badge variant="secondary" className="font-mono text-[10px] h-5">{vehicles.filter(v => v.type === 'ship').length}</Badge>
          </div>
          {externalVehicles.length > 0 && (
            <div className="flex items-center justify-between text-xs p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-1">
              <span className="flex items-center gap-2 text-amber-600">
                <Activity className="w-3 h-3" /> External
              </span>
              <Badge variant="outline" className="font-mono text-[10px] h-5 border-amber-500/30 text-amber-600">{externalVehicles.length}</Badge>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex items-center justify-between text-xs p-2">
            <span className="flex items-center gap-2 font-medium">
              <Eye className="w-3 h-3" /> Show All Trails
            </span>
            <Switch 
              checked={showAllTrails}
              onCheckedChange={setShowAllTrails}
              className="scale-75 origin-right"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative z-0">
        <MapContainer 
          center={[activeNode.location.lat, activeNode.location.lng]} 
          zoom={10} 
          minZoom={3}
          style={{ height: "100%", width: "100%", background: mapBackground }}
          key={currentTheme} // Force re-render on theme change
        >
          <MapEvents setZoom={setZoom} />
          <MapUpdater selectedVehicle={selectedVehicle} activeNodeLocation={activeNode.location} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileLayer}
          />
          
          {/* Render trails for all vehicles if enabled, or just the selected one */}
          {[...vehicles, ...externalVehicles].map(v => {
            const isSelected = selectedVehicle?.id === v.id;
            
            // Should we show this trail?
            // Yes if: 
            // 1. Show All Trails is ON
            // 2. OR this vehicle is selected AND Show Flight Path is ON
            if (!showAllTrails && (!isSelected || !showFlightPath)) return null;

            // Trail = accumulated real history, with the live position attached
            // so the trail tip stays connected to the moving marker.
            const history = vehicleHistory[v.id] || [];
            const path: [number, number][] =
              typeof v.lat === 'number' && typeof v.lng === 'number'
                ? [...history, [v.lat, v.lng]]
                : history;

            if (path.length < 2) return null;

            return (
              <Polyline 
                key={`trail-${v.id}`}
                positions={path}
                pathOptions={{ 
                  color: v.type === 'aircraft' ? '#0ea5e9' : '#10b981', // sky-500 or emerald-500
                  weight: isSelected ? 3 : 2, // Thicker if selected, slightly thicker for all trails
                  opacity: isSelected ? 0.8 : 0.6, // More opaque for all trails
                  dashArray: '4 8'
                }} 
              />
            );
          })}

          {[...vehicles, ...externalVehicles].map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const isHovered = hoveredVehicleId === v.id;
            const showTooltip = isSelected || isHovered;

            return (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={createVehicleIcon(v.type, v.heading, zoom, isSelected)}
              eventHandlers={{
                click: () => {
                  setSelectedVehicleId(v.id);
                },
                mouseover: () => {
                  setHoveredVehicleId(v.id);
                },
                mouseout: () => {
                  setHoveredVehicleId(null);
                }
              }}
            >
              {showTooltip && (
                <Tooltip 
                  permanent={true} 
                  direction="top" 
                  offset={[0, -10]}
                  className="bg-transparent border-none shadow-none p-0"
                  opacity={1}
                  interactive={false} 
                >
                  <div className="bg-popover/90 backdrop-blur-md text-popover-foreground border border-border/50 shadow-xl rounded-lg overflow-hidden min-w-[160px] flex flex-col gap-0.5 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={cn(
                          "font-bold text-xs px-1.5 py-0.5 rounded text-white shadow-sm",
                          v.type === 'aircraft' ? "bg-sky-500" : "bg-emerald-500"
                        )}>
                          {v.callsign}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{v.icao}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-1 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span className="text-foreground font-medium">{Math.round(v.speed)}</span>
                        {v.type === 'aircraft' ? 'kts' : 'kn'}
                      </span>
                      {v.alt && (
                        <span className="flex items-center gap-0.5 ml-2">
                          <Activity className="w-3 h-3" />
                          <span className="text-foreground font-medium">{Math.round(v.alt/1000)}k</span>
                          ft
                        </span>
                      )}
                    </div>
                  </div>
                </Tooltip>
              )}
            </Marker>
          )})}
        </MapContainer>
      </div>

      {/* Floating Details Pane */}
      <div className={cn(
        "absolute top-4 bottom-4 right-4 w-80 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl z-10 transition-transform duration-300 ease-in-out flex flex-col",
        selectedVehicle ? "translate-x-0" : "translate-x-[120%]"
      )}>
        {selectedVehicle && (
          <>
            <div className="p-4 border-b border-border/50 flex items-start justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/50",
                  selectedVehicle.type === 'aircraft' ? "bg-sky-500/10 text-sky-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {selectedVehicle.type === 'aircraft' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{selectedVehicle.callsign}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] py-0 h-5 px-1.5 bg-background/50 uppercase tracking-wide">
                      {selectedVehicle.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">ICAO: {selectedVehicle.icao}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedVehicleId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Primary Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-background/50 border-border/50 shadow-sm">
                    <CardContent className="p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Speed</div>
                      <div className="text-xl font-bold font-mono">
                        {Math.round(selectedVehicle.speed)}
                        <span className="text-xs text-muted-foreground ml-1 font-sans font-normal">
                          {selectedVehicle.type === 'aircraft' ? 'kts' : 'kn'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/50 border-border/50 shadow-sm">
                    <CardContent className="p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Heading</div>
                      <div className="text-xl font-bold font-mono">
                        {Math.round(selectedVehicle.heading)}°
                        <Navigation 
                          className="w-3 h-3 inline-block ml-1 text-muted-foreground" 
                          style={{ transform: `rotate(${selectedVehicle.heading}deg)` }} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                  {selectedVehicle.alt && (
                    <Card className="bg-background/50 border-border/50 shadow-sm col-span-2">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Altitude</div>
                        <div className="text-xl font-bold font-mono">
                          {Math.round(selectedVehicle.alt).toLocaleString()}
                          <span className="text-xs text-muted-foreground ml-1 font-sans font-normal">ft</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Location
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Latitude</span>
                      <span className="font-mono">{selectedVehicle.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Longitude</span>
                      <span className="font-mono">{selectedVehicle.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" /> Signal
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-medium">{selectedVehicle.source || 'Unknown Source'}</span>
                    </div>
                    {selectedVehicle.rssi !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Signal Strength (RSSI)</span>
                        <span className={cn(
                          "font-medium font-mono",
                          selectedVehicle.rssi > -10 ? "text-emerald-500" : 
                          selectedVehicle.rssi > -20 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {selectedVehicle.rssi} dBFS
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Seen</span>
                      <span className="font-mono text-xs">Just now</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Flight Path (Placeholder) */}
                <div className="pt-2">
                  <Button 
                    variant={showFlightPath ? "secondary" : "outline"} 
                    className="w-full gap-2 text-xs h-9"
                    onClick={() => setShowFlightPath(!showFlightPath)}
                  >
                    <Activity className="w-3 h-3" /> {showFlightPath ? "Hide Flight Path" : "View Flight Path"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-border/50 bg-muted/20 text-xs text-center text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
