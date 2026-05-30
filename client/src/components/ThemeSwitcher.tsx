import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfig, useUpdateConfig } from "@/hooks/useAirwavesApi";
import { useApiStatus } from "@/hooks/useApiStatus";
import type { AirwavesConfig } from "@/lib/api";

type ThemeChoice = "light" | "dark" | "system";

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Laptop, label: "System" },
];

/**
 * Single source of truth for the theme control. Reads/writes next-themes (which
 * applies the `class` and persists to localStorage) AND persists the choice to
 * the device config (config.preferences.theme) so it survives reflash and is
 * captured in backups. Both the nav and Settings render this same component, so
 * they stay in sync automatically.
 */
export function ThemeSwitcher({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const apiAvailable = useApiStatus();
  const { data: config } = useConfig();
  const updateConfig = useUpdateConfig();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: next-themes resolves on the client.
  useEffect(() => setMounted(true), []);

  // One-time hydrate from device config when it loads and differs from current.
  const configTheme = config?.preferences?.theme;
  useEffect(() => {
    if (configTheme && configTheme !== theme) {
      setTheme(configTheme);
    }
    // Only when the persisted value changes (e.g. initial load / device switch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configTheme]);

  const choose = (value: ThemeChoice) => {
    setTheme(value);
    // Persist to device config so it's durable + backed up.
    if (apiAvailable && config && config.preferences?.theme !== value) {
      const next: AirwavesConfig = {
        ...config,
        preferences: { ...(config.preferences ?? {}), theme: value },
      };
      updateConfig.mutate(next);
    }
  };

  const current = mounted ? (theme as ThemeChoice) ?? "system" : undefined;
  const btn = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg bg-muted/50 p-1", className)}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            "flex items-center justify-center rounded-md transition-colors",
            btn,
            current === value
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitcher;
