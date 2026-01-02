import React, { useState } from 'react';
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Radio, AppWindow, Rss, Settings, Menu, X, Terminal, Globe, Server, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SidebarProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: SidebarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "My Apps", icon: AppWindow, href: "/apps" },
    { label: "App Catalog", icon: Globe, href: "/store" },
    { label: "Devices", icon: Radio, href: "/devices" },
    { label: "Feeds", icon: Rss, href: "/feeds" },
    { label: "System Fleet", icon: Server, href: "/systems" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

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
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
           <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-sidebar-primary w-full">
             <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
                <Terminal className="w-5 h-5 text-sidebar-primary" />
             </div>
             <div className="flex-1 min-w-0">
               <span className="truncate block">Airwaves OS</span>
             </div>
           </div>
        </div>
        
        {/* System Selector */}
        <div className="px-3 pt-4">
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" className="w-full justify-between bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground group">
                 <span className="flex items-center gap-2 truncate">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   Core (This Device)
                 </span>
                 <ChevronsUpDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-[230px]" align="start">
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
             </DropdownMenuContent>
           </DropdownMenu>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )} onClick={() => setMobileMenuOpen(false)}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
                  {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
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
                <span>45%</span>
              </div>
              <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
                <div className="h-full bg-sidebar-primary w-[45%]"></div>
              </div>
              <div className="flex justify-between mt-2">
                <span>RAM</span>
                <span>62%</span>
              </div>
              <div className="h-1 bg-sidebar-border rounded-full overflow-hidden">
                 <div className="h-full bg-purple-500 w-[62%]"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden flex items-center justify-between px-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-lg">
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary" />
             </div>
             Airwaves OS
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 relative">
           <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
}
