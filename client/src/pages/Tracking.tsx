import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Mock data for aircraft and ships
const vehicles = [
  { id: "A1", type: "aircraft", callsign: "UAL123", lat: 37.6, lng: -122.3, heading: 45, speed: 350, alt: 12000 },
  { id: "A2", type: "aircraft", callsign: "DAL456", lat: 37.7, lng: -122.45, heading: 135, speed: 420, alt: 18000 },
  { id: "A3", type: "aircraft", callsign: "SWA789", lat: 37.5, lng: -122.2, heading: 270, speed: 280, alt: 8000 },
  { id: "M1", type: "ship", callsign: "CMA CGM", lat: 37.8, lng: -122.5, heading: 90, speed: 15 },
  { id: "M2", type: "ship", callsign: "MAERSK", lat: 37.82, lng: -122.4, heading: 180, speed: 12 },
];

export default function Tracking() {
  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-3rem)] flex flex-col relative">
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
            <Badge variant="secondary" className="font-mono">3</Badge>
          </div>
          <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
            <span className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-emerald-500" /> Vessels
            </span>
            <Badge variant="secondary" className="font-mono">2</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden border border-border/50 relative z-0">
        <MapContainer 
          center={[37.7, -122.4]} 
          zoom={10} 
          style={{ height: "100%", width: "100%", background: "#0f172a" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {vehicles.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={DefaultIcon}>
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
