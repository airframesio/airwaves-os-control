import { Switch, Route, Link } from "wouter";
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
import SystemUpdate from "./pages/SystemUpdate";
import Tracking from "./pages/Tracking";
import LiveMessages from "./pages/LiveMessages";
import RtlAirband from "./pages/RtlAirband";
import SetupWizard from "./pages/SetupWizard";
import AppLayout from "./components/layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import ApiStatusBanner from "./components/ApiStatusBanner";

function UpdateBanner() {
  const apiAvailable = useApiStatus();
  const [show, setShow] = useState(false);
  const [osVersion, setOsVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!apiAvailable) return;
    let cancelled = false;
    import("./lib/api").then(({ updateApi }) => {
      updateApi.getStatus().then((s) => {
        if (cancelled) return;
        if (s.update_available && s.highest_severity === "required") {
          setShow(true);
          setOsVersion(s.available_os_version);
        }
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [apiAvailable]);

  if (!show) return null;
  return (
    <Link href="/updates">
      <div className="bg-red-500/10 border-b border-red-500/30 text-red-500 text-sm px-4 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/15">
        A required system update is available{osVersion ? ` (Airwaves OS ${osVersion})` : ""}. Click to review and install.
      </div>
    </Link>
  );
}

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary>
      <ApiStatusBanner />
      <UpdateBanner />
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
        <Route path="/updates" component={SystemUpdate} />
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
