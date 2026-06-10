const truthy = new Set(["1", "true", "yes", "on"]);

export const demoModeEnabled = truthy.has(
  String(import.meta.env.VITE_AIRWAVES_DEMO ?? "").toLowerCase(),
);

