import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-muted", className)} />
  );
}

/** Skeleton for a stat card (used on Dashboard) */
export function StatCardSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Shimmer className="h-8 w-16 mb-2" />
        <Shimmer className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/** Skeleton for a list item */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Shimmer className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-48" />
      </div>
      <Shimmer className="h-6 w-16 rounded-full" />
    </div>
  );
}

/** Skeleton for a full page */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-2">
        <Shimmer className="h-8 w-48" />
        <Shimmer className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50">
          <CardHeader><Shimmer className="h-5 w-40" /></CardHeader>
          <CardContent><Shimmer className="h-[300px] w-full rounded-lg" /></CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardHeader><Shimmer className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
