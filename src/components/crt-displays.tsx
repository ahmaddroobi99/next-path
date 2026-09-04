import { useEffect, useRef } from "react";
import { WORK, buffers, paintRaster, paintRemote } from "@/lib/sim/image";
import { useSim } from "@/lib/sim/store";
import { Badge } from "@/components/ui/badge";

export function MegaPixelCrt() {
  const reveal = useSim((s) => s.reveal);
  const rev = useSim((s) => s.frameRev);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = WORK.w;
    c.height = WORK.h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const src = buffers.framebuffer ?? buffers.source;
    paintRaster(ctx, src, reveal);
  }, [reveal, rev]);

  return (
    <figure className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
          MegaPixel · 1120×832 · 2-bit
        </figcaption>
        <Badge>68 Hz</Badge>
      </div>
      <div className="relative overflow-hidden rounded-md border border-border bg-bg p-1.5">
        <canvas
          ref={ref}
          width={WORK.w}
          height={WORK.h}
          className="block h-auto w-full rounded-xs"
          style={{ aspectRatio: `${WORK.w} / ${WORK.h}` }}
        />
        <div className="crt-scan absolute inset-1.5 rounded-xs" />
      </div>
    </figure>
  );
}

export function RemoteCrt() {
  const rev = useSim((s) => s.frameRev);
  const acked = useSim((s) => s.acked);
  const dropped = useSim((s) => s.dropped);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = WORK.w;
    c.height = WORK.h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    paintRemote(ctx, buffers.remote ?? null, buffers.strips, 16);
  }, [rev]);

  return (
    <figure className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
          Remote viewer · TCP 5900
        </figcaption>
        <Badge tone={dropped ? "warn" : "signal"}>
          {acked} ok · {dropped} drop
        </Badge>
      </div>
      <div className="relative overflow-hidden rounded-md border border-border bg-bg p-1.5">
        <canvas
          ref={ref}
          width={WORK.w}
          height={WORK.h}
          className="block h-auto w-full rounded-xs"
          style={{ aspectRatio: `${WORK.w} / ${WORK.h}` }}
        />
        <div className="crt-scan absolute inset-1.5 rounded-xs" />
      </div>
    </figure>
  );
}
