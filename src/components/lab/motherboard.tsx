import { BOARD, CHIPS, PATH_IN, PATH_OUT } from "@/lib/sim/hardware";
import { pointAt, toPathD } from "@/lib/sim/geom";
import type { ChipDef, VisualPacket } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

function Pins({ x, y, w, h, step = 6 }: { x: number; y: number; w: number; h: number; step?: number }) {
  const dots: { cx: number; cy: number }[] = [];
  for (let px = x + 4; px < x + w - 3; px += step) {
    dots.push({ cx: px, cy: y + 2.5 });
    dots.push({ cx: px, cy: y + h - 2.5 });
  }
  for (let py = y + 6; py < y + h - 5; py += step) {
    dots.push({ cx: x + 2.5, cy: py });
    dots.push({ cx: x + w - 2.5, cy: py });
  }
  return (
    <g className="fill-copper/80">
      {dots.map((d, i) => (
        <rect key={i} x={d.cx - 1} y={d.cy - 1} width={2} height={2} rx={0.3} />
      ))}
    </g>
  );
}

function Simms({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const n = 4;
  const gap = 8;
  const sw = (w - gap * (n + 1)) / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const sx = x + gap + i * (sw + gap);
        return (
          <g key={i}>
            <rect x={sx} y={y + 10} width={sw} height={h - 28} rx={2} className="fill-ceramic/90" />
            <rect x={sx + 2} y={y + 14} width={sw - 4} height={10} className="fill-chip" />
            {Array.from({ length: 8 }, (_, k) => (
              <rect
                key={k}
                x={sx + 3}
                y={y + 28 + k * 8}
                width={sw - 6}
                height={3}
                className="fill-chip/70"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function ChipBody({
  chip,
  active,
  onSelect,
}: {
  chip: ChipDef;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const ceramic = chip.kind === "cpu";
  const port = chip.kind === "port" || chip.kind === "pwr";
  const bus = chip.kind === "bus";
  const nameY = ceramic
    ? chip.y + chip.h / 2 - 4
    : chip.kind === "ram" || chip.kind === "nic"
      ? chip.y + 16
      : chip.y + chip.h / 2 + 3;

  return (
    <g
      role="button"
      tabIndex={0}
      onClick={() => onSelect(chip.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(chip.id);
        }
      }}
      className="cursor-pointer"
    >
      <rect
        x={chip.x}
        y={chip.y}
        width={chip.w}
        height={chip.h}
        rx={bus ? 4 : 5}
        className={cn(
          bus
            ? "fill-bus stroke-path-in/40"
            : ceramic
              ? "fill-ceramic stroke-copper/60"
              : port
                ? "fill-chip stroke-silk/30"
                : "fill-chip stroke-silk/25",
        )}
        strokeWidth={active ? 2 : 1}
        style={active ? { filter: "url(#glow)" } : undefined}
      />
      {ceramic && <Pins x={chip.x} y={chip.y} w={chip.w} h={chip.h} />}
      {ceramic && (
        <rect
          x={chip.x + 22}
          y={chip.y + 18}
          width={chip.w - 44}
          height={chip.h - 48}
          rx={3}
          className="fill-chip stroke-copper/40"
        />
      )}
      {chip.kind === "ram" && <Simms x={chip.x} y={chip.y} w={chip.w} h={chip.h} />}
      {chip.kind === "nic" && (
        <>
          <rect x={chip.x + 12} y={chip.y + 34} width={88} height={52} rx={2} className="fill-elevated" />
          <rect x={chip.x + 112} y={chip.y + 42} width={88} height={36} rx={2} className="fill-elevated" />
        </>
      )}
      <text
        x={chip.x + chip.w / 2}
        y={nameY}
        textAnchor="middle"
        className={cn(
          "pointer-events-none font-sans text-[11px] font-medium",
          ceramic ? "fill-ceramic" : "fill-silk",
        )}
      >
        {chip.name}
      </text>
      {ceramic && (
        <text
          x={chip.x + chip.w / 2}
          y={chip.y + chip.h / 2 + 12}
          textAnchor="middle"
          className="pointer-events-none fill-muted font-mono text-[9px]"
        >
          MCM56824AFN35 · 25 MHz
        </text>
      )}
      {active && (
        <rect
          x={chip.x - 3}
          y={chip.y - 3}
          width={chip.w + 6}
          height={chip.h + 6}
          rx={7}
          className="fill-none stroke-accent"
          strokeWidth={1.2}
        />
      )}
    </g>
  );
}

export function Motherboard({
  packets,
  util,
  selected,
  onSelect,
  pathKind,
}: {
  packets: VisualPacket[];
  util: Record<string, number>;
  selected: string | null;
  onSelect: (id: string) => void;
  pathKind: "in" | "out" | null;
}) {
  const activeChip = Object.entries(util).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <svg
      viewBox={`0 0 ${BOARD.w} ${BOARD.h}`}
      className="h-full w-full"
      role="img"
      aria-label="NeXTcube motherboard"
    >
      <defs>
        <pattern id="vias" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.7" className="fill-copper/25" />
        </pattern>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pcbgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-pcb)" />
          <stop offset="100%" stopColor="var(--color-pcb-dark)" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width={BOARD.w - 16} height={BOARD.h - 16} rx="14" fill="url(#pcbgrad)" />
      <rect
        x="8"
        y="8"
        width={BOARD.w - 16}
        height={BOARD.h - 16}
        rx="14"
        fill="url(#vias)"
        className="pointer-events-none"
      />
      <rect
        x="12"
        y="12"
        width={BOARD.w - 24}
        height={BOARD.h - 24}
        rx="10"
        className="fill-none stroke-copper/30"
        strokeWidth="1.5"
      />

      {[
        [28, 28],
        [BOARD.w - 40, 28],
        [28, BOARD.h - 40],
        [BOARD.w - 40, BOARD.h - 40],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="8" className="fill-pcb-dark stroke-copper/50" />
          <circle cx={cx} cy={cy} r="3.2" className="fill-chip" />
        </g>
      ))}

      <text
        x="640"
        y="24"
        textAnchor="middle"
        className="fill-silk/70 font-mono text-[10px] tracking-[0.28em]"
      >
        NEXT CUBE  MAIN LOGIC  ·  REV D  ·  MCM56824AFN35  ·  25 MHz
      </text>

      <path
        d={toPathD(PATH_IN)}
        className="fill-none stroke-path-in"
        strokeWidth={pathKind === "in" ? 3 : 1.4}
        strokeDasharray={pathKind === "out" ? "6 8" : undefined}
        opacity={pathKind === "out" ? 0.2 : pathKind === "in" ? 0.95 : 0.45}
      />
      <path
        d={toPathD(PATH_OUT)}
        className="fill-none stroke-path-out"
        strokeWidth={pathKind === "out" ? 3 : 1.4}
        strokeDasharray={pathKind === "in" ? "6 8" : undefined}
        opacity={pathKind === "in" ? 0.2 : pathKind === "out" ? 0.95 : 0.45}
      />

      {CHIPS.filter((c) => c.kind === "bus").map((c) => (
        <ChipBody key={c.id} chip={c} active={activeChip === c.id} onSelect={onSelect} />
      ))}
      <text
        x="640"
        y="274"
        textAnchor="middle"
        className="pointer-events-none fill-path-in/80 font-mono text-[11px]"
      >
        NeXTbus  25 MHz  ·  32-bit multiplexed  ·  100 MB/s burst
      </text>

      {CHIPS.filter((c) => c.kind !== "bus").map((c) => (
        <ChipBody
          key={c.id}
          chip={c}
          active={activeChip === c.id || selected === c.id}
          onSelect={onSelect}
        />
      ))}

      {packets.map((p) => {
        const pts = p.path === "in" ? PATH_IN : PATH_OUT;
        const pt = pointAt(pts, p.s);
        return (
          <g key={p.id} filter="url(#glow)">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="7"
              className={p.path === "in" ? "fill-path-in" : "fill-path-out"}
            />
            <circle cx={pt.x} cy={pt.y} r="3" className="fill-fg" />
          </g>
        );
      })}

      <g className="font-mono text-[10px]">
        <rect x="36" y="508" width="12" height="12" className="fill-path-in" rx="2" />
        <text x="54" y="518" className="fill-silk">
          Camera → display
        </text>
        <rect x="220" y="508" width="12" height="12" className="fill-path-out" rx="2" />
        <text x="238" y="518" className="fill-silk">
          Frame buffer → Ethernet
        </text>
        <text x="1244" y="518" textAnchor="end" className="fill-silk/60">
          Click a chip
        </text>
      </g>
    </svg>
  );
}
