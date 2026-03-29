import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Check, ExternalLink, ArrowRight, LayoutGrid, List, Loader2, Radio, Plane, Ship, Satellite, Waves, BarChart3, Map, Box } from "lucide-react";
import { useNodeStore } from "@/lib/nodeStore";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAppCatalog, useContainers, useInstallApp } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";

// Map app IDs to icons for catalog apps
const appIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  readsb: Plane,
  acarsdec: Radio,
  dumpvdl2: Waves,
  dumphfdl: Satellite,
  vdlm2dec: Waves,
  "ais-catcher": Ship,
  "rtl-airband": Radio,
  "rtl-433": Waves,
  satdump: Satellite,
  acarshub: BarChart3,
  tar1090: Map,
  graphs1090: BarChart3,
};

export default function AppStore() {
  const [search, setSearch] = useState("");
  const categories = ["All", "Decoder", "Visualization"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [, setLocation] = useLocation();
  const { data, installApp, activeNode } = useNodeStore();

  // Real API data
  const apiAvailable = useApiStatus();
  const { data: catalogApps } = useAppCatalog();
  const { data: containers } = useContainers();
  const installMutation = useInstallApp();

  // Determine installed container names
  const installedNames = new Set(
    (containers ?? []).map(c => c.name.replace(/^airwaves-/, ''))
  );

  // Build the app list: use catalog API when available, fall back to nodeStore
  const apps = apiAvailable && catalogApps
    ? catalogApps.map(app => ({
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        installed: installedNames.has(app.id),
        status: installMutation.isPending && installMutation.variables === app.id ? 'installing' as const : 'running' as const,
        icon: appIcons[app.id] ?? Box,
      }))
    : data.apps;

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
                          app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || app.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">App Store</h1>
          <p className="text-xl text-muted-foreground mt-2">Discover powerful SDR applications for {activeNode.name}.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search for apps..." 
            className="pl-10 h-12 text-base bg-card/50 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="All" className="w-full" onValueChange={setActiveCategory}>
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap justify-start border-b-0">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat} 
                className="px-5 py-2.5 rounded-full border border-border/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all hover:bg-muted/50"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map(app => (
            <div 
              key={app.id} 
              className="group cursor-pointer flex flex-col h-full rounded-3xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              onClick={() => setLocation(`/store/${app.id}`)}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <app.icon className="w-8 h-8 text-primary" />
                  </div>
                  {app.installed ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Installed</Badge>
                  ) : app.status === 'installing' ? (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 flex gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Installing</Badge>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="mb-2">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{app.name}</h3>
                  <p className="text-xs font-medium text-muted-foreground capitalize mt-1">{app.category}</p>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {app.description}
                </p>

                <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                  {app.installed ? "Manage App" : "Click to Install"} <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No apps found</p>
            <p className="text-sm">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
