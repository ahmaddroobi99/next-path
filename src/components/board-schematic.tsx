import { CPU_UNITS, type ChipId } from "@/lib/sim/chips";
import { currentStep, useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

interface Node {
  id: ChipId | "iu" | "fpu" | "mmu" | "icache" | "dcache";
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: "cpu" | "io" | "mem" | "net" | "virt";
}

const NODES: Node[] = [
  { id: "camera", label: "Camera", sub: "ADC", x: 24, y: 18, w: 120, h: 48, kind: "virt" },
  { id: "dsp", label: "DSP56001", sub: "25 MHz 24-bit", x: 190, y: 18, w: 150, h: 48, kind: "io" },
  { id: "dspRam", label: "MCM56824", sub: "8K×24 SRAM", x: 380, y: 18, w: 140, h: 48, kind: "mem" },
  { id: "icp", label: "ICP DMA", sub: "12 channels", x: 190, y: 92, w: 150, h: 48, kind: "io" },
  { id: "bus", label: "NeXTbus 32-bit · 25 MHz · 100 MB/s burst", x: 24, y: 168, w: 752, h: 36, kind: "io" },
  { id: "ram", label: "SIMM RAM", sub: "8–64 MB", x: 24, y: 230, w: 140, h: 56, kind: "mem" },
  { id: "cpu", label: "MC68040", sub: "25 MHz", x: 190, y: 222, w: 400, h: 132, kind: "cpu" },
  { id: "memctl", label: "MemCtl", sub: "RAS/CAS", x: 616, y: 230, w: 160, h: 56, kind: "io" },
  { id: "framebuffer", label: "Framebuffer", sub: "256 KB · 2 bpp", x: 24, y: 382, w: 170, h: 56, kind: "mem" },
  { id: "vlsi", label: "Display VLSI", sub: "68 Hz timing", x: 220, y: 382, w: 160, h: 56, kind: "io" },
  { id: "monitor", label: "MegaPixel", sub: "1120×832", x: 406, y: 382, w: 150, h: 56, kind: "virt" },
  { id: "nic", label: "82586 MAC", sub: "CSMA/CD", x: 24, y: 468, w: 160, h: 52, kind: "net" },
  { id: "phy", label: "PHY", sub: "Manchester", x: 210, y: 468, w: 120, h: 52, kind: "net" },
  { id: "rj45", label: "10BASE-T", sub: "RJ-45", x: 356, y: 468, w: 120, h: 52, kind: "net" },
  { id: "bnc", label: "10BASE2", sub: "BNC", x: 500, y: 468, w: 110, h: 52, kind: "net" },
  { id: "remote", label: "Remote viewer", sub: "peer CRT", x: 636, y: 468, w: 140, h: 52, kind: "virt" },
];

const CPU_BOXES: { id: Node["id"]; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: "icache", label: "I$ 4 KB", x: 206, y: 258, w: 84, h: 36 },
  { id: "dcache", label: "D$ 4 KB", x: 298, y: 258, w: 84, h: 36 },
  { id: "mmu", label: "PMMU", x: 390, y: 258, w: 84, h: 36 },
  { id: "iu", label: "Integer", x: 206, y: 304, w: 176, h: 36 },
  { id: "fpu", label: "FPU", x: 390, y: 304, w: 84, h: 36 },
];

function nodeCenter(id: string) {
  const n = NODES.find((x) => x.id === id);
  if (n) return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
  const u = CPU_BOXES.find((x) => x.id === id);
  if (u) return { x: u.x + u.w / 2, y: u.y + u.h / 2 };
  return { x: 400, y: 280 };
}

export function BoardSchematic() {
  const selected = useSim((s) => s.selected);
  const select = useSim((s) => s.select);
  const run = useSim((s) => s.run);
  const progress = useSim((s) => s.progress);
  const step = useSim((s) => currentStep(s));
  const activeChips = new Set(step?.chips ?? []);
  const activeUnits = new Set(step?.units ?? []);
  const path = step?.path ?? [];

  const fillFor = (kind: Node["kind"], on: boolean) => {
    if (on) return "rgba(193,122,74,0.22)";
    if (kind === "cpu") return "rgba(232,230,225,0.04)";
    if (kind === "net") return "rgba(122,163,173,0.08)";
    if (kind === "mem") return "rgba(232,230,225,0.03)";
    if (kind === "virt") return "rgba(232,230,225,0.02)";
    return "rgba(232,230,225,0.03)";
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
      <svg viewBox="0 0 800 540" className="h-full w-full" role="img" aria-label="NeXTcube block diagram">
        {path.length > 1 && run !== "idle" && (
          <polyline
            points={path.map((id) => {
              const p = nodeCenter(id);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="#c17a4a"
            strokeWidth="2"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}
        {path.length > 1 && run === "running" && path.slice(0, -1).map((id, i) => {
          const a = nodeCenter(id);
          const b = nodeCenter(path[i + 1]!);
          const t = (progress + i * 0.2) % 1;
          return (
            <circle
              key={`${id}-${i}`}
              cx={a.x + (b.x - a.x) * t}
              cy={a.y + (b.y - a.y) * t}
              r="5"
              fill="#e8e6e1"
            />
          );
        })}

        {NODES.map((n) => {
          const on = n.id === "cpu" ? activeChips.has("cpu") : activeChips.has(n.id as ChipId);
          const sel = selected === n.id;
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onClick={() => select(sel ? null : (n.id as ChipId))}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx="8"
                fill={fillFor(n.kind, on)}
                stroke={sel ? "#e8e6e1" : on ? "#c17a4a" : "rgba(232,230,225,0.16)"}
                strokeWidth={sel ? 1.6 : 1}
              />
              <text
                x={n.x + n.w / 2}
                y={n.sub ? n.y + n.h / 2 - 4 : n.y + n.h / 2 + 4}
                textAnchor="middle"
                fill="#e8e6e1"
                fontSize="12"
                fontFamily="IBM Plex Sans, sans-serif"
              >
                {n.label}
              </text>
              {n.sub && (
                <text
                  x={n.x + n.w / 2}
                  y={n.y + n.h / 2 + 12}
                  textAnchor="middle"
                  fill="#8c8a84"
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {n.sub}
                </text>
              )}
            </g>
          );
        })}

        {CPU_BOXES.map((u) => {
          const on = activeUnits.has(u.id as (typeof CPU_UNITS)[number]["id"]);
          return (
            <g key={u.id}>
              <rect
                x={u.x}
                y={u.y}
                width={u.w}
                height={u.h}
                rx="6"
                fill={on ? "rgba(193,122,74,0.35)" : "rgba(12,12,13,0.55)"}
                stroke={on ? "#c17a4a" : "rgba(232,230,225,0.14)"}
              />
              <text
                x={u.x + u.w / 2}
                y={u.y + u.h / 2 + 4}
                textAnchor="middle"
                fill="#e8e6e1"
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
              >
                {u.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
