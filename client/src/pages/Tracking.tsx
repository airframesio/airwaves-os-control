import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
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
const createVehicleIcon = (type: string, heading: number, zoom: number) => {
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
      transform: `rotate(${heading + rotationOffset}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      transition: 'all 0.3s ease'
    }}>
      {zoom < 6 ? (
        // Simple dot for low zoom
        <div className={`w-2 h-2 rounded-full ${type === 'aircraft' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
      ) : (
        type === 'aircraft' ? (
          <Plane 
            size={size} 
            className="text-sky-500 fill-sky-500/20" 
            strokeWidth={2}
          />
        ) : (
          <div style={{ transform: 'rotate(-90deg)' }}> 
            <Ship 
              size={size} 
              className="text-emerald-500 fill-emerald-500/20" 
              strokeWidth={2}
            />
          </div>
        )
      )}
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
    lat: 37.7 + (Math.random() - 0.5) * 2,
    lng: -122.4 + (Math.random() - 0.5) * 2,
    heading: Math.floor(Math.random() * 360),
    speed: 250 + Math.floor(Math.random() * 300),
    alt: 5000 + Math.floor(Math.random() * 30000)
  })),
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `M${i + 1}`,
    type: "ship",
    callsign: `VESSEL${100 + i}`,
    lat: 37.7 + (Math.random() - 0.5) * 2,
    lng: -122.4 + (Math.random() - 0.5) * 2,
    heading: Math.floor(Math.random() * 360),
    speed: 10 + Math.floor(Math.random() * 20),
    alt: undefined
  }))
];

export default function Tracking() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [zoom, setZoom] = useState(10);
  const [selectedVehicle, setSelectedVehicle] = useState<typeof initialVehicles[0] | null>(null);

  useEffect(() => {
    setMounted(true);

    // Simulate movement
    const interval = setInterval(() => {
      setVehicles(prev => {
        const nextVehicles = prev.map(v => {
          // Simple physics simulation
          // Convert speed (knots) to degrees/sec (very rough approximation for visual)
          // 1 degree latitude ~ 60nm
          // Speed in knots = nm/hour
          // degrees/sec = (speed / 3600) / 60
          // We'll slow it down even more for the visual so they don't fly off screen instantly
          const speedFactor = 0.000005; 
          const moveDist = v.speed * speedFactor;
          
          // Calculate new position based on heading
          // Convert Compass Heading (0 is North, CW) to Math Angle (0 is East, CCW)
          // Math Angle = 90 - Heading
          const rad = (90 - v.heading) * (Math.PI / 180); 
          
          // Lat is Y, Lng is X
          const newLat = v.lat + Math.sin(rad) * moveDist;
          const newLng = v.lng + Math.cos(rad) * moveDist;

          // Random slight heading wobble
          const wobble = (Math.random() * 2 - 1); // +/- 1 degree
          let newHeading = v.heading + wobble;
          
          // Keep heading 0-360
          if (newHeading < 0) newHeading += 360;
          if (newHeading >= 360) newHeading -= 360;

          return {
            ...v,
            lat: newLat,
            lng: newLng,
            heading: newHeading
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

    return () => clearInterval(interval);
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
      <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur border border-border/50 p-4 rounded-xl shadow-lg w-80">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          Live Tracking
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Real-time positions from ADS-B and AIS feeds.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-sky-500" /> Aircraft
            </span>
            <Badge variant="secondary" className="font-mono">{vehicles.filter(v => v.type === 'aircraft').length}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-emerald-500" /> Vessels
            </span>
            <Badge variant="secondary" className="font-mono">{vehicles.filter(v => v.type === 'ship').length}</Badge>
          </div>
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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileLayer}
          />
          {vehicles.map((v) => (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={createVehicleIcon(v.type, v.heading, zoom)}
              eventHandlers={{
                click: () => {
                  setSelectedVehicle(v);
                },
              }}
            >
              <Popup className="bg-transparent border-none shadow-none p-0" offset={[0, -10]}>
                <div className="bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/50 shadow-xl rounded-xl overflow-hidden min-w-[200px]">
                  <div className="p-3 border-b border-border/50 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      v.type === 'aircraft' ? "bg-sky-500/10 text-sky-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {v.type === 'aircraft' ? <Plane className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-none">{v.callsign}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 capitalize">{v.type}</div>
                    </div>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded p-1.5 text-center">
                      <div className="text-muted-foreground scale-90 origin-center mb-0.5">SPD</div>
                      <div className="font-mono font-medium">{Math.round(v.speed)}</div>
                    </div>
                    {v.alt && (
                      <div className="bg-muted/50 rounded p-1.5 text-center">
                        <div className="text-muted-foreground scale-90 origin-center mb-0.5">ALT</div>
                        <div className="font-mono font-medium">{Math.round(v.alt)}</div>
                      </div>
                    )}
                    <div className="bg-muted/50 rounded p-1.5 text-center">
                      <div className="text-muted-foreground scale-90 origin-center mb-0.5">HDG</div>
                      <div className="font-mono font-medium">{Math.round(v.heading)}°</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
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
                    <span className="text-xs text-muted-foreground font-mono">ID: {selectedVehicle.id}</span>
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
                      <span className="font-medium">ADS-B Receiver #4</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Signal Strength</span>
                      <span className="text-emerald-500 font-medium">-12 dBFS</span>
                    </div>
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
