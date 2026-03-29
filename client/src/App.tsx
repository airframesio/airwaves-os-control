import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { NodeProvider } from "./lib/nodeStore";
import { useState, useEffect } from "react";
import { useApiStatus } from "./hooks/useApiStatus";
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
import SetupWizard from "./pages/SetupWizard";
import AppLayout from "./components/layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary>
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
      </ErrorBoundary>
    </AppLayout>
  );
}

function AppWithSetup() {
  const apiAvailable = useApiStatus();
  const [setupComplete, setSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem('airwaves_setup_complete') === 'true';
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if setup is needed: config has empty device.id
    if (apiAvailable && !setupComplete) {
      import('./lib/api').then(({ configApi }) => {
        configApi.get().then(config => {
          if (config.device.id && config.station.latitude !== 0) {
            // Already configured
            setSetupComplete(true);
            localStorage.setItem('airwaves_setup_complete', 'true');
          }
          setChecking(false);
        }).catch(() => setChecking(false));
      });
    } else {
      setChecking(false);
    }
  }, [apiAvailable, setupComplete]);

  const handleSetupComplete = () => {
    setSetupComplete(true);
    localStorage.setItem('airwaves_setup_complete', 'true');
  };

  // Show wizard on first boot when API is available and config is empty
  if (!checking && apiAvailable && !setupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  return <Router />;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <NodeProvider>
            <AppWithSetup />
            <Toaster />
          </NodeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
