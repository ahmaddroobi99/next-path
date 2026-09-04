import { Pause, Play, SkipForward, RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Slider } from "@/components/ui/slider";
import { allSteps, currentStep, useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

export function ControlDock() {
  const fileRef = useRef<HTMLInputElement>(null);
  const journey = useSim((s) => s.journey);
  const setJourney = useSim((s) => s.setJourney);
  const source = useSim((s) => s.source);
  const setSource = useSim((s) => s.setSource);
  const loadUpload = useSim((s) => s.loadUpload);
  const run = useSim((s) => s.run);
  const play = useSim((s) => s.play);
  const pause = useSim((s) => s.pause);
  const stepOnce = useSim((s) => s.stepOnce);
  const reset = useSim((s) => s.reset);
  const speed = useSim((s) => s.speed);
  const setSpeed = useSim((s) => s.setSpeed);
  const cpu = useSim((s) => s.cpu);
  const dsp = useSim((s) => s.dsp);
  const bus = useSim((s) => s.bus);
  const net = useSim((s) => s.net);
  const bandwidth = useSim((s) => s.bandwidth);
  const latency = useSim((s) => s.latency);
  const loss = useSim((s) => s.loss);
  const setNet = useSim((s) => s.setNet);
  const kbps = useSim((s) => s.kbps);
  const fps = useSim((s) => s.fps);
  const step = useSim((s) => currentStep(s));
  const steps = useSim((s) => allSteps(s));
  const stepIndex = useSim((s) => s.stepIndex);

  function onFile(file: File | undefined) {
    if (!file) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => loadUpload(img);
    img.src = URL.createObjectURL(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={journey === "pixel" ? "primary" : "secondary"}
          onClick={() => setJourney("pixel")}
        >
          Pixel path
        </Button>
        <Button
          variant={journey === "share" ? "primary" : "secondary"}
          onClick={() => setJourney("share")}
        >
          Desktop share
        </Button>
      </div>

      {journey === "pixel" && (
        <div>
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
            Camera feed
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["bench", "chart", "upload"] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={source === k ? "copper" : "secondary"}
                onClick={() => {
                  if (k === "upload") fileRef.current?.click();
                  else setSource(k);
                }}
              >
                {k === "upload" && <Upload className="size-3.5" />}
                {k === "bench" ? "Bench" : k === "chart" ? "Chart" : "Upload"}
              </Button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {run === "running" ? (
          <Button onClick={pause} className="flex-1">
            <Pause className="size-4" /> Pause
          </Button>
        ) : (
          <Button onClick={play} className="flex-1">
            <Play className="size-4" /> {run === "done" ? "Run again" : "Run"}
          </Button>
        )}
        <Button variant="secondary" onClick={stepOnce} aria-label="Step">
          <SkipForward className="size-4" />
        </Button>
        <Button variant="ghost" onClick={reset} aria-label="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div>
        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
          Clock {speed.toFixed(1)}×
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[0.5, 1, 3].map((v) => (
            <Button
              key={v}
              size="sm"
              variant={speed === v ? "primary" : "secondary"}
              onClick={() => setSpeed(v)}
            >
              {v}×
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <Meter label="68040" value={cpu} tone="copper" />
        <Meter label="DSP56001" value={dsp} tone="warn" />
        <Meter label="NeXTbus" value={bus} tone="ok" />
        <Meter label="10 Mb/s link" value={net} tone="signal" />
        <div className="flex justify-between pt-1 font-mono text-[0.7rem] text-muted">
          <span className="tabular">{kbps} kb/s</span>
          <span className="tabular">{fps} Hz</span>
        </div>
      </div>

      {journey === "share" && (
        <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
            Network conditions
          </p>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs text-muted">
              Bandwidth <span className="tabular text-fg">{bandwidth.toFixed(1)} Mb/s</span>
            </span>
            <Slider
              min={0.5}
              max={10}
              step={0.5}
              value={[bandwidth]}
              onValueChange={(v) => setNet({ bandwidth: v[0] ?? 10 })}
            />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs text-muted">
              Latency <span className="tabular text-fg">{latency} ms</span>
            </span>
            <Slider
              min={0}
              max={400}
              step={10}
              value={[latency]}
              onValueChange={(v) => setNet({ latency: v[0] ?? 40 })}
            />
          </label>
          <label className="block">
            <span className="mb-1 flex justify-between text-xs text-muted">
              Loss <span className="tabular text-fg">{loss}%</span>
            </span>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[loss]}
              onValueChange={(v) => setNet({ loss: v[0] ?? 0 })}
            />
          </label>
        </div>
      )}

      <ol className="space-y-1">
        {steps.map((st, i) => (
          <li
            key={st.id}
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors duration-150",
              i === stepIndex && run !== "idle"
                ? "border-copper/50 bg-copper/10 text-fg"
                : "border-transparent text-muted",
            )}
          >
            <span className="font-mono text-[0.65rem] text-subtle">{String(i + 1).padStart(2, "0")} </span>
            {st.title}
          </li>
        ))}
      </ol>

      {step && (
        <p className="text-xs leading-relaxed text-subtle">
          <span className="text-copper">{step.kicker}. </span>
          {step.format}
        </p>
      )}
    </div>
  );
}
