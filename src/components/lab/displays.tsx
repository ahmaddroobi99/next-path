import { useEffect, useRef } from "react";
import { blitGray } from "@/lib/sim/image";
import { MP_H, MP_W, TILE_COLS, TILE_ROWS } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

function PhosphorCanvas({
  gray,
  mask,
  className,
  label,
}: {
  gray: Uint8ClampedArray | null;
  mask?: boolean[];
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!gray) {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, MP_W, MP_H);
      ctx.fillStyle = "#3a3a32";
      ctx.font = "28px 'IBM Plex Mono', monospace";
      ctx.fillText(label === "remote" ? "NO SIGNAL" : "WAITING FOR RASTER", 64, MP_H / 2);
      return;
    }
    if (mask) {
      const copy = new Uint8ClampedArray(gray.length);
      const tw = Math.ceil(MP_W / TILE_COLS);
      const th = Math.ceil(MP_H / TILE_ROWS);
      for (let ty = 0; ty < TILE_ROWS; ty++) {
        for (let tx = 0; tx < TILE_COLS; tx++) {
          if (!mask[ty * TILE_COLS + tx]) continue;
          for (let y = ty * th; y < Math.min(MP_H, (ty + 1) * th); y++) {
            copy.set(gray.subarray(y * MP_W + tx * tw, y * MP_W + Math.min(MP_W, (tx + 1) * tw)), y * MP_W + tx * tw);
          }
        }
      }
      blitGray(ctx, copy, MP_W, MP_H, true);
    } else {
      blitGray(ctx, gray, MP_W, MP_H, true);
    }
  }, [gray, mask, label]);

  return (
    <canvas
      ref={ref}
      width={MP_W}
      height={MP_H}
      className={cn("h-full w-full object-contain", className)}
    />
  );
}

function tileMask(count: number): boolean[] {
  const total = TILE_COLS * TILE_ROWS;
  return Array.from({ length: total }, (_, i) => i < count);
}

export function MegaPixel({
  gray,
  live,
}: {
  gray: Uint8ClampedArray | null;
  live: boolean;
}) {
  return (
    <figure className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-chip">
      <figcaption className="flex items-center justify-between px-3 py-2 font-mono text-[10px] tracking-wider text-muted uppercase">
        <span>MegaPixel Display · 1120×832 · 2-bit · 68 Hz</span>
        <span className={cn("tabular", live ? "text-ok" : "text-subtle")}>{live ? "SCAN" : "HOLD"}</span>
      </figcaption>
      <div className="relative min-h-0 flex-1 bg-black">
        <PhosphorCanvas gray={gray} label="local" className="absolute inset-0 h-full w-full object-contain" />
        <div className="scanlines absolute inset-0 opacity-60" />
      </div>
    </figure>
  );
}

export function RemoteViewer({
  gray,
  tiles,
  total,
  latency,
}: {
  gray: Uint8ClampedArray | null;
  tiles: number;
  total: number;
  latency: number;
}) {
  const mask = gray ? tileMask(tiles) : undefined;
  return (
    <figure className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-chip">
      <figcaption className="flex items-center justify-between px-3 py-2 font-mono text-[10px] tracking-wider text-muted uppercase">
        <span>Remote viewer · 10BASE-T · {latency} ms</span>
        <span className="tabular text-path-out">
          {tiles}/{total} tiles
        </span>
      </figcaption>
      <div className="relative min-h-0 flex-1 bg-black">
        <PhosphorCanvas gray={gray} mask={mask} label="remote" className="absolute inset-0 h-full w-full object-contain" />
        <div className="scanlines absolute inset-0 opacity-50" />
      </div>
    </figure>
  );
}
