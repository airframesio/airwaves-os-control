import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Radio, AppWindow, Rss, Settings, Menu, X, Terminal, Globe, Server, ChevronsUpDown, Check, AudioWaveform, Map, ChevronLeft, ChevronRight, Sun, Moon, Laptop, MessageSquareText, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import logoIcon from "@/assets/airwaves-logo.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";

interface SidebarProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: SidebarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [systemStats, setSystemStats] = useState({ cpu: 45, ram: 62 });

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Simulate system stats changes
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(20, Math.min(85, prev.ram + (Math.random() * 6 - 3)))
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const mainNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Map", icon: Map, href: "/map" },
    { label: "Live Messages", icon: MessageSquareText, href: "/messages" },
    { label: "Feeds", icon: Rss, href: "/feeds" },
  ];

  const appNavItems = [
    { label: "My Apps", icon: AppWindow, href: "/apps" },
    { label: "App Catalog", icon: Globe, href: "/store" },
  ];

  const systemNavItems = [
    { label: "Monitor", icon: Monitor, href: "/monitor" },
    { label: "Devices", icon: Radio, href: "/devices" },
    { label: "Fleet", icon: Server, href: "/systems" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  // Helper function to render nav link
  const NavLink = ({ item }: { item: any }) => {
    const isActive = location === item.href;
    
    if (collapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={item.href} className={cn(
              "flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-all duration-200",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )} onClick={() => setMobileMenuOpen(false)}>
              <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link href={item.href} className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border" 
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )} onClick={() => setMobileMenuOpen(false)}>
          <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
          {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden selection:bg-primary/20">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16 items-center" : "lg:w-64"
        )}
      >
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border/50 relative w-full",
          collapsed ? "justify-center px-0" : "px-6"
        )}>
           <div className={cn(
             "flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-primary w-full",
             collapsed && "justify-center"
            )}>
             <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src={logoIcon} alt="Airwaves OS Logo" className="w-full h-full object-contain" />
             </div>
             {!collapsed && (
               <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                 <span className="truncate block">Airwaves OS</span>
               </div>
             )}
           </div>
           
           {/* Collapse Toggle - Only visible on desktop */}
           <Button
             variant="outline"
             size="icon"
             className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-sidebar-border shadow-md bg-sidebar hidden lg:flex z-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground p-0"
             onClick={() => setCollapsed(!collapsed)}
           >
             {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
           </Button>
        </div>
        
        {/* System Selector */}
        <div className={cn("pt-4 w-full", collapsed ? "px-2 flex justify-center" : "px-3")}>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button 
                 variant="outline" 
                 className={cn(
                   "bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground group",
                   collapsed ? "px-0 justify-center h-10 w-10 p-0 rounded-lg" : "w-full justify-between"
                  )}
                >
                 {!collapsed ? (
                   <>
                     <span className="flex items-center gap-2 truncate">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       Core (This Device)
                     </span>
                     <ChevronsUpDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                   </>
                 ) : (
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 )}
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-[230px]" align="start" side={collapsed ? "right" : "bottom"}>
               <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">Switch System</div>
               <DropdownMenuItem className="gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span>Core (This Device)</span>
                 <Check className="w-4 h-4 ml-auto" />
               </DropdownMenuItem>
               <DropdownMenuItem className="gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span>Attic Node</span>
               </DropdownMenuItem>
               <DropdownMenuItem className="gap-2 text-muted-foreground">
                 <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                 <span>Garage Node</span>
               </DropdownMenuItem>
               
               <DropdownMenuSeparator />
               
               <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">Theme</div>
               <div className="flex gap-1 px-2 pb-1">
                 <Button 
                   variant={theme === 'light' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   className="flex-1 h-8 px-0" 
                   onClick={() => setTheme('light')}
                 >
                   <Sun className="h-4 w-4" />
                   <span className="sr-only">Light</span>
                 </Button>
                 <Button 
                   variant={theme === 'dark' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   className="flex-1 h-8 px-0" 
                   onClick={() => setTheme('dark')}
                 >
                   <Moon className="h-4 w-4" />
                   <span className="sr-only">Dark</span>
                 </Button>
                 <Button 
                   variant={theme === 'system' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   className="flex-1 h-8 px-0" 
                   onClick={() => setTheme('system')}
                 >
                   <Laptop className="h-4 w-4" />
                   <span className="sr-only">System</span>
                 </Button>
               </div>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className={cn("space-y-1 w-full", collapsed ? "px-2 flex flex-col items-center" : "px-3")}>
            {mainNavItems.map((item) => <NavLink key={item.href} item={item} />)}
            
            {!collapsed && <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-6 mb-2">Apps</div>}
            {collapsed && <div className="h-px w-8 bg-sidebar-border/50 my-3" />}
            {appNavItems.map((item) => <NavLink key={item.href} item={item} />)}

            {!collapsed && <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-6 mb-2">System</div>}
            {collapsed && <div className="h-px w-8 bg-sidebar-border/50 my-3" />}
            {systemNavItems.map((item) => <NavLink key={item.href} item={item} />)}
          </nav>
        </div>

        <div className={cn("border-t border-sidebar-border/50 w-full", collapsed ? "p-2 flex justify-center" : "p-4")}>
          {collapsed ? (
             <div className="flex flex-col items-center gap-3 py-2 bg-sidebar-accent/30 rounded-lg w-10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="h-1 bg-sidebar-border rounded-full overflow-hidden w-6">
                  <div 
                    className="h-full bg-sidebar-primary transition-all duration-1000 ease-in-out" 
                    style={{ width: `${systemStats.cpu}%` }}
                  ></div>
                </div>
                <div className="h-1 bg-sidebar-border rounded-full overflow-hidden w-6">
                   <div 
                     className="h-full bg-purple-500 transition-all duration-1000 ease-in-out" 
                     style={{ width: `${systemStats.ram}%` }}
                   ></div>
                </div>
             </div>
          ) : (
            <div className="bg-sidebar-accent/30 rounded-lg p-3 text-xs text-sidebar-foreground/60">
              <div className="flex justify-between items-center mb-2">
                <span>System Status</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>CPU</span>
                  <span>{Math.round(systemStats.cpu)}%</span>
                </div>
                <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sidebar-primary transition-all duration-1000 ease-in-out" 
                    style={{ width: `${systemStats.cpu}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span>RAM</span>
                  <span>{Math.round(systemStats.ram)}%</span>
                </div>
                <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-purple-500 transition-all duration-1000 ease-in-out" 
                     style={{ width: `${systemStats.ram}%` }}
                   ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-lg">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
                <img src={logoIcon} alt="Airwaves OS Logo" className="w-full h-full object-cover" />
             </div>
             Airwaves OS
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Scrollable Area */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden relative",
          location === "/map" ? "p-0" : (location === "/apps" ? "p-4 lg:p-6" : "p-4 lg:p-8")
        )}>
           <div className={cn(
             "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
             location === "/map" ? "h-full" : (location === "/apps" ? "h-full w-full max-w-none" : "max-w-7xl mx-auto")
           )}>
             {children}
           </div>
        </div>
      </main>
    </div>
  );
}
