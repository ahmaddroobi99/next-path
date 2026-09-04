import { CHIPS, type ChipId } from "@/lib/sim/chips";
import { currentStep, useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

function center(id: ChipId) {
  const c = CHIPS.find((x) => x.id === id);
  if (!c) return { x: 50, y: 50 };
  return { x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2 };
}

function polyline(ids: ChipId[]) {
  return ids
    .map((id) => {
      const p = center(id);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

export function BoardPhoto() {
  const selected = useSim((s) => s.selected);
  const run = useSim((s) => s.run);
  const progress = useSim((s) => s.progress);
  const select = useSim((s) => s.select);
  const step = useSim((s) => currentStep(s));
  const active = new Set(step?.chips ?? []);
  const path = step?.path ?? [];
  const lit = run !== "idle";

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto">
      <div className="relative w-full max-w-full">
        <img
          src="/motherboard.jpg"
          alt="NeXTcube motherboard, Rev 2.4, 1991. Sixteen SIMMs, DSP56001, dual Fujitsu PGAs, 68040 with heatsink, NCR 53C90A, I/O bracket."
          className="block h-auto w-full select-none"
          draggable={false}
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {path.length > 1 && lit && (
            <>
              <polyline
                points={polyline(path)}
                fill="none"
                stroke="rgba(193,122,74,0.3)"
                strokeWidth="0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                points={polyline(path)}
                fill="none"
                stroke="#c17a4a"
                strokeWidth="0.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray="3 2"
                className="path-dash"
              />
              {path.map((id, i) => {
                if (i === path.length - 1) return null;
                const a = center(id);
                const b = center(path[i + 1]!);
                const t = (progress + i * 0.17) % 1;
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                return <circle key={`${id}-${i}`} cx={x} cy={y} r="0.9" fill="#e8e6e1" />;
              })}
            </>
          )}
        </svg>

        {CHIPS.filter((c) => c.id !== "bus").map((chip) => {
          const isActive = active.has(chip.id) && lit;
          const isSel = selected === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-label={chip.name}
              onClick={() => select(isSel ? null : chip.id)}
              className={cn(
                "absolute rounded-sm border transition-[border-color,background-color,box-shadow] duration-200",
                chip.virtual && "flex items-center justify-center",
                isSel
                  ? "border-accent bg-accent/15 shadow-[0_0_0_1px_rgb(232,230,225,0.45)]"
                  : isActive
                    ? "border-copper bg-copper/20"
                    : "border-transparent hover:border-fg/40 hover:bg-fg/10",
              )}
              style={{
                left: `${chip.box.x}%`,
                top: `${chip.box.y}%`,
                width: `${chip.box.w}%`,
                height: `${chip.box.h}%`,
              }}
            >
              {chip.virtual && (
                <span className="pointer-events-none rounded-sm bg-bg/80 px-1 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-copper">
                  {chip.id === "camera" ? "Camera" : chip.id === "monitor" ? "CRT" : "Peer"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
