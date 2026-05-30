import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface FleetNode {
  id: string;
  name?: string;
  hostname?: string;
  status?: string; // "online" | "offline"
  isLocal?: boolean;
}

/**
 * Animated fleet topology: a hub-and-spoke graph with the local node at the
 * center and peers around it. Data flow is shown as dashes traveling along
 * each link toward the hub (online peers only). Pure SVG/CSS — no deps.
 */
export default function FleetTopology({ nodes }: { nodes: FleetNode[] }) {
  const W = 760;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;

  const local = nodes.find((n) => n.isLocal) ?? nodes[0];
  const peers = nodes.filter((n) => n !== local);

  const placed = useMemo(() => {
    const r = Math.min(W, H) * 0.36;
    return peers.map((n, i) => {
      // Distribute peers around the hub; deterministic (no random) angle.
      const angle = (Math.PI * 2 * i) / Math.max(peers.length, 1) - Math.PI / 2;
      return { node: n, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
  }, [peers, cx, cy]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Fleet topology"
    >
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Links + flowing data */}
      {placed.map(({ node, x, y }, i) => {
        const online = (node.status ?? "online") === "online";
        return (
          <g key={node.id ?? i}>
            <line
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={online ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeOpacity={online ? 0.35 : 0.15}
              strokeWidth={1.5}
            />
            {online && (
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="3 14"
                className="fleet-flow"
              >
                {/* data flows from peer -> hub */}
                <animate
                  attributeName="stroke-dashoffset"
                  from="34"
                  to="0"
                  dur={`${1.6 + (i % 3) * 0.4}s`}
                  repeatCount="indefinite"
                />
              </line>
            )}
          </g>
        );
      })}

      {/* Hub (local node) */}
      <circle cx={cx} cy={cy} r={46} fill="url(#hubGlow)" />
      <circle cx={cx} cy={cy} r={22} fill="hsl(var(--primary))" fillOpacity={0.15} stroke="hsl(var(--primary))" strokeWidth={2}>
        <animate attributeName="r" values="22;25;22" dur="3s" repeatCount="indefinite" />
      </circle>
      <text x={cx} y={cy + 40} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
        {local?.name ?? local?.hostname ?? "This node"}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-primary text-[10px] font-bold">
        HUB
      </text>

      {/* Peer nodes */}
      {placed.map(({ node, x, y }, i) => {
        const online = (node.status ?? "online") === "online";
        return (
          <g key={`peer-${node.id ?? i}`}>
            <circle
              cx={x}
              cy={y}
              r={16}
              fill={online ? "hsl(var(--primary))" : "hsl(var(--muted))"}
              fillOpacity={online ? 0.18 : 0.4}
              stroke={online ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeWidth={1.5}
            />
            <circle
              cx={x + 12}
              cy={y - 12}
              r={3}
              className={cn(online ? "fill-emerald-500" : "fill-zinc-500")}
            />
            <text x={x} y={y + 32} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {node.name ?? node.hostname ?? node.id}
            </text>
          </g>
        );
      })}

      {peers.length === 0 && (
        <text x={cx} y={cy + 80} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          No paired nodes yet — pair a device to see data paths.
        </text>
      )}
    </svg>
  );
}
