import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from 'react-dom/server';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Create custom icon function
const createVehicleIcon = (type: string, heading: number) => {
  // Determine rotation offset based on default icon orientation
  // Plane icon points top-right (45deg), so rotate -45 to align with North (0deg)
  // Ship icon points right (90deg) usually? Or left?
  // Let's assume standard rotation. 
  // Standard CSS rotation is clockwise. 
  // If Heading 0 is North.
  // Plane (45deg natural). To point North, rotate -45deg.
  // Ship (generic boat shape). Let's treat it same way if it's top down but Ship icon is profile.
  // Actually, let's keep it simple.
  
  const rotationOffset = type === 'aircraft' ? -45 : 0;
  
  const iconMarkup = renderToStaticMarkup(
    <div style={{ 
      transform: `rotate(${heading + rotationOffset}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%'
    }}>
      {type === 'aircraft' ? (
        <Plane 
          size={24} 
          className="text-sky-500 fill-sky-500/20" 
          strokeWidth={2}
        />
      ) : (
        <div style={{ transform: 'rotate(-90deg)' }}> 
           {/* Ship icon usually points right, so rotate -90 to point up, then apply heading */}
          <Ship 
            size={24} 
            className="text-emerald-500 fill-emerald-500/20" 
            strokeWidth={2}
          />
        </div>
      )}
    </div>
  );

  return divIcon({
    html: iconMarkup,
    className: 'bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
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

  useEffect(() => {
    setMounted(true);

    // Simulate movement
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
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
      }));
    }, 100); // 10fps update for smoothness

    return () => clearInterval(interval);
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
          style={{ height: "100%", width: "100%", background: mapBackground }}
          key={currentTheme} // Force re-render on theme change
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileLayer}
          />
          {vehicles.map((v) => (
            <Marker 
              key={v.id} 
              position={[v.lat, v.lng]} 
              icon={createVehicleIcon(v.type, v.heading)}
            >
              <Popup className="bg-card text-card-foreground border-border">
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-2 font-bold text-base">
                    {v.type === 'aircraft' ? <Plane className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
                    {v.callsign}
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Heading</span>
                      <span>{v.heading}°</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Speed</span>
                      <span>{v.speed} {v.type === 'aircraft' ? 'kts' : 'kn'}</span>
                    </div>
                    {v.alt && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Altitude</span>
                        <span>{v.alt} ft</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
