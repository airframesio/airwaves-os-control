import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plane, Ship, Navigation, X, Clock, MapPin, Radio, Activity, ArrowUpRight } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from 'react-dom/server';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Helper component to update map center
function MapUpdater({ selectedVehicle }: { selectedVehicle: { lat: number, lng: number } | null }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (selectedVehicle) {
      // Calculate offset based on sidebar width (320px + padding)
      // We want the vehicle to be centered in the remaining visible area
      // Map width W, Sidebar S = 336px (320px + 16px margin)
      // Visible width V = W - S
      // Center of visible area is at x = V/2
      // True map center is at x = W/2
      // We want the vehicle to be at screen x = V/2
      // Offset needed = W/2 - V/2 = (W - (W-S))/2 = S/2
      // So we need to shift the map center by S/2 to the RIGHT (so vehicle appears S/2 to the LEFT)
      
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

// Mock data for aircraft and ships
const initialVehicles = [
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `A${i + 1}`,
    type: "aircraft",
    callsign: `FLT${100 + i}`,
    icao: Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0'), // Random Hex
    // Aircraft can be anywhere
    lat: 37.7 + (Math.random() - 0.5) * 3,
    lng: -122.4 + (Math.random() - 0.5) * 3,
    heading: Math.floor(Math.random() * 360),
    // Realistic aircraft speeds (150-550 knots)
    speed: 150 + Math.floor(Math.random() * 400),
    alt: 5000 + Math.floor(Math.random() * 30000),
    source: "Simulated Feed",
    rssi: -10 - Math.floor(Math.random() * 20)
  })),
  ...Array.from({ length: 100 }, (_, i) => {
    // Ships restricted to water areas (roughly)
    // Pacific Ocean (West of SF) or Bay Area
    const isOcean = Math.random() > 0.3;
    let lat, lng;
    
    if (isOcean) {
      // Pacific Ocean - West of SF coastline approx -122.55
      lat = 37.0 + Math.random() * 1.5; // 37.0 to 38.5
      lng = -123.5 + Math.random() * 0.9; // -123.5 to -122.6
    } else {
      // SF Bay (rough approximation)
      lat = 37.6 + Math.random() * 0.3;
      lng = -122.35 + Math.random() * 0.1;
    }

    return {
      id: `M${i + 1}`,
      type: "ship",
      callsign: `VESSEL${100 + i}`,
      icao: Math.floor(Math.random() * 900000000 + 100000000).toString(), // Random MMSI-like number
      lat,
      lng,
      heading: Math.floor(Math.random() * 360),
      // Realistic ship speeds (10-35 knots)
      speed: 10 + Math.floor(Math.random() * 25),
      alt: undefined,
      source: "Marine Traffic Feed",
      rssi: -5 - Math.floor(Math.random() * 15)
    };
  })
];

export default function Tracking() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [externalVehicles, setExternalVehicles] = useState<typeof initialVehicles>([]);
  const [zoom, setZoom] = useState(10);
  const [selectedVehicle, setSelectedVehicle] = useState<typeof initialVehicles[0] | null>(null);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Poll external feeds
    const pollExternalFeeds = async () => {
      try {
        const savedFeeds = localStorage.getItem('external_feeds');
        if (!savedFeeds) return;

        const feeds: Array<{ id: string, url: string, interval: number, enabled: boolean, useProxy?: boolean }> = JSON.parse(savedFeeds);
        const enabledFeeds = feeds.filter(f => f.enabled);

        const newExternalVehicles: typeof initialVehicles = [];

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
        
        // Update selected vehicle if it's external
        if (selectedVehicle && selectedVehicle.id.startsWith('EXT-')) {
          const updatedExternal = newExternalVehicles.find(v => v.id === selectedVehicle.id);
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

    // Simulate movement for internal vehicles
    const interval = setInterval(() => {
      setVehicles(prev => {
        const nextVehicles = prev.map(v => {
          // Simple physics simulation
          // Convert speed (knots) to degrees/sec (very rough approximation for visual)
          // 1 degree latitude ~ 60nm
          // Speed in knots = nm/hour
          // degrees/sec = (speed / 3600) / 60
          // We'll slow it down slightly for the visual scale
          const speedFactor = 0.000003; 
          const moveDist = v.speed * speedFactor;
          
          // Calculate new position based on heading
          // Convert Compass Heading (0 is North, CW) to Math Angle (0 is East, CCW)
          // Math Angle = 90 - Heading
          const rad = (90 - v.heading) * (Math.PI / 180); 
          
          // Lat is Y, Lng is X
          const newLat = v.lat + Math.sin(rad) * moveDist;
          const newLng = v.lng + Math.cos(rad) * moveDist;

          // Constraints logic
          let nextLat = newLat;
          let nextLng = newLng;
          let nextHeading = v.heading;

          if (v.type === 'ship') {
             // Simple bounding box checks to keep ships roughly in water
             // West boundary (Ocean) -> East boundary (Coast)
             // Very rough approximation of SF coastline + Bay
             
             const isOcean = nextLng < -122.55;
             const isBay = nextLng > -122.45 && nextLng < -122.2 && nextLat > 37.55 && nextLat < 38.1;
             
             if (!isOcean && !isBay) {
                // If hit land/boundary, turn around
                nextHeading = (v.heading + 180) % 360;
                // Bounce back slightly
                nextLat = v.lat;
                nextLng = v.lng;
             }
          }

          // Random slight heading wobble
          const wobble = (Math.random() * 2 - 1); // +/- 1 degree
          nextHeading = nextHeading + wobble;
          
          // Keep heading 0-360
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
        if (selectedVehicle) {
          const updatedSelected = nextVehicles.find(v => v.id === selectedVehicle.id);
          if (updatedSelected) {
            setSelectedVehicle(updatedSelected);
          }
        }

        return nextVehicles;
      });
    }, 100); // 10fps update for smoothness

    return () => {
      clearInterval(interval);
      clearInterval(feedInterval);
    };
  }, [selectedVehicle]); // Add selectedVehicle to dependency to keep it updated

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
      <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur border border-border/50 p-4 rounded-xl shadow-lg w-64">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Live Tracking
        </h1>
        <p className="text-xs text-muted-foreground mb-3">
          Real-time positions from feeds.
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
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative z-0">
        <MapContainer 
          center={[37.7, -122.4]} 
          zoom={10} 
          minZoom={3}
          style={{ height: "100%", width: "100%", background: mapBackground }}
          key={currentTheme} // Force re-render on theme change
        >
          <MapEvents setZoom={setZoom} />
          <MapUpdater selectedVehicle={selectedVehicle} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileLayer}
          />
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
        "absolute top-4 bottom-4 right-4 w-80 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl z-[400] transition-transform duration-300 ease-in-out flex flex-col",
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

                <Separator className="bg-border/50" />

                {/* Location */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Location
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lat</span>
                      <span>{selectedVehicle.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lng</span>
                      <span>{selectedVehicle.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Signal Info */}
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
                  <Button variant="outline" className="w-full gap-2 text-xs h-9">
                    <Activity className="w-3 h-3" /> View Flight Path
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
