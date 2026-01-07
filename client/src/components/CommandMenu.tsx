import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Map,
  MessageSquareText,
  Monitor,
  AppWindow,
  Globe,
  Radio,
  Rss,
  Server,
  Search,
  Plane,
  Ship,
  Terminal,
  LogOut
} from "lucide-react";
import { useLocation } from "wouter";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => setLocation("/"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/map"))}>
              <Map className="mr-2 h-4 w-4" />
              <span>Map & Tracking</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/messages"))}>
              <MessageSquareText className="mr-2 h-4 w-4" />
              <span>Live Messages</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/apps"))}>
              <AppWindow className="mr-2 h-4 w-4" />
              <span>My Apps</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/store"))}>
              <Globe className="mr-2 h-4 w-4" />
              <span>App Catalog</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/monitor"))}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System Monitor</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/devices"))}>
              <Radio className="mr-2 h-4 w-4" />
              <span>Devices</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/feeds"))}>
              <Rss className="mr-2 h-4 w-4" />
              <span>Feeds</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/systems"))}>
              <Server className="mr-2 h-4 w-4" />
              <span>Fleet</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => setLocation("/store"))}>
              <Search className="mr-2 h-4 w-4" />
              <span>Search Catalog...</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setLocation("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
             <CommandItem onSelect={() => runCommand(() => setLocation("/settings"))}>
              <Terminal className="mr-2 h-4 w-4" />
              <span>View System Logs</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
