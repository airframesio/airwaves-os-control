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
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNodeStore } from "@/lib/nodeStore";
import { useTracking } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";

// Helper to generate simulated path
const generateSimulatedPath = (vehicle: { lat: number, lng: number, heading: number }) => {
  const path: [number, number][] = [];
  let { lat, lng, heading } = vehicle;
  
  // Add current position
  path.push([lat, lng]);

  // Generate 20 points backwards
  for (let i = 0; i < 20; i++) {
    const dist = 0.01; 
    const rad = (90 - heading) * (Math.PI / 180);
    
    // Reverse direction
    lat -= Math.sin(rad) * dist;
    lng -= Math.cos(rad) * dist;
    
    // Slight curve for realism
    heading += (Math.random() * 10 - 5);

    path.push([lat, lng]);
  }
  return path;
};

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
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const selectedVehicleRef = useRef(selectedVehicle);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  const [showFlightPath, setShowFlightPath] = useState(false);
  const [showAllTrails, setShowAllTrails] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<Record<string, [number, number][]>>({});

  // Reset state when active node changes
  useEffect(() => {
    setSelectedVehicle(null);
    setExternalVehicles([]);
    setVehicleHistory({});
    // Internal vehicles will be updated by the polling effect below
  }, [activeNode.id]);

  // Sync vehicles: prefer real tracking API, fall back to mock from nodeStore
  useEffect(() => {
    if (apiAvailable && trackingData?.vehicles?.length) {
      setVehicles(trackingData.vehicles.map(v => ({
        id: v.id,
        callsign: v.callsign,
        type: v.vehicle_type,
        lat: v.lat,
        lng: v.lng,
        altitude: v.altitude,
        speed: v.speed,
        heading: v.heading,
        source: v.source,
      })));
    } else {
      setVehicles(data.vehicles || []);
    }
  }, [apiAvailable, trackingData, data.vehicles]);

  // Keep ref synced with state
  useEffect(() => {
    selectedVehicleRef.current = selectedVehicle;
  }, [selectedVehicle]);

  // Generate simulated flight path history for selected vehicle
  useEffect(() => {
    if (selectedVehicle && showFlightPath) {
      if (selectedVehicle.id.startsWith('EXT-')) {
        // For external vehicles, use real recorded history
        setFlightPath(vehicleHistory[selectedVehicle.id] || []);
      } else {
        setFlightPath(generateSimulatedPath(selectedVehicle));
      }
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

    // Poll external feeds
    const pollExternalFeeds = async () => {
      try {
        const savedFeeds = localStorage.getItem('external_feeds');
        if (!savedFeeds) return;

        const feeds: Array<{ id: string, url: string, interval: number, enabled: boolean, useProxy?: boolean }> = JSON.parse(savedFeeds);
        const enabledFeeds = feeds.filter(f => f.enabled);

        const newExternalVehicles: any[] = [];

        for (const feed of enabledFeeds) {
          try {
            if (!feed.url) continue;

            const useProxy = feed.useProxy ?? true;
            let fetchUrl = feed.url;
            
            if (useProxy) {
              fetchUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feed.url)}`;
            }

            const response = await fetch(fetchUrl);
            if (!response.ok) {
              console.error(`Failed to fetch feed ${feed.id}: ${response.statusText}`);
              continue;
            }

            const data = await response.json();
            
            // Handle both standard aircraft.json (dump1090/readsb) and potentially array format if simplified
            // Standard format has "aircraft": [] array
            const aircraftList = Array.isArray(data) ? data : (data.aircraft || []);

            // Map to internal format
            aircraftList.forEach((ac: any, index: number) => {
              // Basic validation - need lat/lon
              if (ac.lat === undefined || ac.lon === undefined) return;

              // Use hex/flight or generate ID
              const hex = ac.hex || ac.icao || `UNK${index}`;
              const callsign = (ac.flight || ac.callsign || hex).trim();
              
              newExternalVehicles.push({
                id: `EXT-${feed.id}-${hex}`,
                type: 'aircraft',
                callsign: callsign,
                icao: hex.toUpperCase(),
                lat: typeof ac.lat === 'number' ? ac.lat : parseFloat(ac.lat),
                lng: typeof ac.lon === 'number' ? ac.lon : parseFloat(ac.lon),
                heading: typeof ac.track === 'number' ? ac.track : (typeof ac.heading === 'number' ? ac.heading : 0),
                speed: typeof ac.speed === 'number' ? ac.speed : (typeof ac.gs === 'number' ? ac.gs : 0), // gs = ground speed
                alt: typeof ac.alt_baro === 'number' ? ac.alt_baro : (typeof ac.altitude === 'number' ? ac.altitude : 0),
                source: "External Feed Source",
                rssi: typeof ac.rssi === 'number' ? ac.rssi : (typeof ac.sig === 'number' ? ac.sig : undefined)
              });
            });

          } catch (e) {
            console.error(`Failed to fetch feed ${feed.id}`, e);
          }
        }
        setExternalVehicles(newExternalVehicles);
        
        // Update history for external vehicles
        setVehicleHistory(prev => {
          const next = { ...prev };
          const currentIds = new Set(newExternalVehicles.map(v => v.id));
          let hasChanges = false;
          
          // 1. Add/Update existing
          newExternalVehicles.forEach(v => {
            const existing = next[v.id] || [];
            // Check distance to avoid duplicates if stationary (approx 1m)
            const last = existing[existing.length - 1];
            if (!last || Math.abs(last[0] - v.lat) > 0.00001 || Math.abs(last[1] - v.lng) > 0.00001) {
               next[v.id] = [...existing, [v.lat, v.lng]].slice(-200); // Keep last 200 points
               hasChanges = true;
            }
          });

          // 2. Remove stale vehicles from history (cleanup)
          // Keep history ONLY if vehicle is still present OR if it's the currently selected vehicle
          Object.keys(next).forEach(id => {
            if (!currentIds.has(id)) {
              // If it's not the selected vehicle, remove it to prevent memory leaks and stale trails
              if (selectedVehicleRef.current?.id !== id) {
                 delete next[id];
                 hasChanges = true;
              }
            }
          });
          
          return hasChanges ? next : prev;
        });

        // Update selected vehicle if it's external
        if (selectedVehicleRef.current && selectedVehicleRef.current.id.startsWith('EXT-')) {
          const updatedExternal = newExternalVehicles.find(v => v.id === selectedVehicleRef.current?.id);
          if (updatedExternal) {
            setSelectedVehicle(updatedExternal);
          }
        }

      } catch (e) {
        console.error("Error polling feeds", e);
      }
    };

    const feedInterval = setInterval(pollExternalFeeds, 2000);
    pollExternalFeeds();

    // Simulate movement for internal vehicles (updates local state based on NodeStore data)
    const interval = setInterval(() => {
      setVehicles(prev => {
        // Only run simulation if we have vehicles
        if (prev.length === 0) return prev;

        const nextVehicles = prev.map(v => {
          // Simple physics simulation
          const speedFactor = 0.000003; 
          const moveDist = v.speed * speedFactor;
          
          const rad = (90 - v.heading) * (Math.PI / 180); 
          const newLat = v.lat + Math.sin(rad) * moveDist;
          const newLng = v.lng + Math.cos(rad) * moveDist;

          let nextLat = newLat;
          let nextLng = newLng;
          let nextHeading = v.heading;

          // Constraints (simplified for generic locations, just keep bounds sanity)
          // Just bounce if they go too far from start (not implementing complex geo-fencing per node for now)
          
          // Random slight heading wobble
          const wobble = (Math.random() * 2 - 1); 
          nextHeading = nextHeading + wobble;
          
          if (nextHeading < 0) nextHeading += 360;
          if (nextHeading >= 360) nextHeading -= 360;

          return {
            ...v,
            lat: nextLat,
            lng: nextLng,
            heading: nextHeading
          };
        });

        // Update selected vehicle reference if one is selected
        if (selectedVehicleRef.current) {
          const updatedSelected = nextVehicles.find(v => v.id === selectedVehicleRef.current?.id);
          if (updatedSelected) {
            setSelectedVehicle(updatedSelected);
          }
        }

        return nextVehicles;
      });
    }, 100); 

    return () => {
      clearInterval(interval);
      clearInterval(feedInterval);
    };
  }, []); // Only run once on mount

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

            // Get path data
            let path: [number, number][] = [];
            if (v.id.startsWith('EXT-')) {
               path = vehicleHistory[v.id] || [];
            } else {
               // Only generate simulated path if we need it
               path = generateSimulatedPath(v);
            }

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
                  setSelectedVehicle(v);
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
                onClick={() => setSelectedVehicle(null)}
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
