import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { NodeProvider } from "./lib/nodeStore";
import { useState, useEffect } from "react";
import { useApiStatusState } from "./hooks/useApiStatus";
import { Radio } from "lucide-react";
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

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary>
      <ApiStatusBanner />
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

function SetupSplash() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Radio className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <span className="text-sm text-muted-foreground">Connecting to your device…</span>
      </div>
    </div>
  );
}

function AppWithSetup() {
  const { available: apiAvailable, resolved: apiResolved } = useApiStatusState();
  const [setupState, setSetupState] = useState<'unknown' | 'needed' | 'complete'>(() => {
    return localStorage.getItem('airwaves_setup_complete') === 'true' ? 'complete' : 'unknown';
  });

  useEffect(() => {
    if (!apiResolved || setupState !== 'unknown') return;

    if (!apiAvailable) {
      // Demo mode: no device to set up, go straight to the dashboard.
      // Not persisted, so a device reached later still gets the wizard.
      setSetupState('complete');
      return;
    }

    let cancelled = false;
    import('./lib/api').then(({ configApi }) =>
      configApi.get().then(config => {
        if (cancelled) return;
        const prefs = config.preferences as Record<string, unknown> | undefined;
        const configured =
          prefs?.setup_completed === true ||
          Boolean(config.device.id && (config.station.latitude !== 0 || config.station.longitude !== 0));
        if (configured) {
          localStorage.setItem('airwaves_setup_complete', 'true');
          setSetupState('complete');
        } else {
          setSetupState('needed');
        }
      })
    ).catch(() => {
      // Config unreadable: fail open to the dashboard rather than
      // trapping a configured device behind the wizard.
      if (!cancelled) setSetupState('complete');
    });
    return () => { cancelled = true; };
  }, [apiResolved, apiAvailable, setupState]);

  const handleSetupComplete = () => {
    localStorage.setItem('airwaves_setup_complete', 'true');
    setSetupState('complete');
  };

  if (setupState === 'needed') {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }
  if (setupState === 'unknown') {
    return <SetupSplash />;
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
