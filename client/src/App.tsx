import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { NodeProvider } from "./lib/nodeStore";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import AppStore from "./pages/AppStore";
import AppDetails from "./pages/AppDetails";
import MyApps from "./pages/MyApps";
import Devices from "./pages/Devices";
import DeviceConfig from "./pages/DeviceConfig";
import Feeds from "./pages/Feeds";
import Settings from "./pages/Settings";
import Systems from "./pages/Systems";
import SystemMonitor from "./pages/SystemMonitor";
import Tracking from "./pages/Tracking";
import LiveMessages from "./pages/LiveMessages";
import RtlAirband from "./pages/RtlAirband";
import AppLayout from "./components/layout/AppLayout";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/map" component={Tracking} />
        <Route path="/messages" component={LiveMessages} />
        <Route path="/airband" component={RtlAirband} />
        <Route path="/monitor" component={SystemMonitor} />
        <Route path="/store" component={AppStore} />
        <Route path="/store/:id" component={AppDetails} />
        <Route path="/apps" component={MyApps} />

        <Route path="/devices" component={Devices} />
        <Route path="/devices/:id/config" component={DeviceConfig} />
        <Route path="/feeds" component={Feeds} />
        <Route path="/systems" component={Systems} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NodeProvider>
            <Router />
            <Toaster />
          </NodeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
