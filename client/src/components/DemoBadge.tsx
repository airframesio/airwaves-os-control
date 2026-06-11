import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Marks a page (or card) whose data is mock/demo fallback rather than live
 * device data, so users can always tell the two apart.
 */
export default function DemoBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 font-normal align-middle"
    >
      <FlaskConical className="w-3 h-3" /> Demo data
    </Badge>
  );
}
