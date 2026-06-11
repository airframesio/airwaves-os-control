import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Inline alert shown when the device is reachable but a live-data query
 * failed, so users know the data below is a fallback rather than live.
 */
export function LiveDataErrorNotice({
  message = "Couldn't load live data from the device.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

/** Centered empty state for zero-item lists. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-border/60 bg-card/30">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <div className="font-semibold">{title}</div>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
