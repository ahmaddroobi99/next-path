import { create } from "zustand";
import type { ChipId } from "./chips";
import { PIXEL_STEPS, SHARE_STEPS, type JourneyKind, type Step } from "./journeys";
import {
  buffers,
  cloneRaster,
  hexFromRaster,
  makeBenchScene,
  makeDesktopScene,
  makeChartScene,
  nativeFrameBytes,
  posterize,
  rasterFromImage,
  type Raster,
} from "./image";
import { makeSharePackets, type WirePacket } from "./packets";

export type SourceKind = "bench" | "chart" | "upload";
export type RunState = "idle" | "running" | "paused" | "done";
export type BoardView = "photo" | "schematic";

export interface Sim {
  powered: boolean;
  view: BoardView;
  selected: ChipId | null;
  journey: JourneyKind;
  run: RunState;
  stepIndex: number;
  progress: number;
  speed: number;
  source: SourceKind;
  cpu: number;
  dsp: number;
  bus: number;
  net: number;
  fps: number;
  kbps: number;
  hex: string;
  reveal: number;
  bandwidth: number;
  latency: number;
  loss: number;
  packets: WirePacket[];
  acked: number;
  dropped: number;
  retrans: number;
  frameRev: number;
  powerOn: () => void;
  select: (id: ChipId | null) => void;
  setView: (v: BoardView) => void;
  setJourney: (j: JourneyKind) => void;
  setSpeed: (s: number) => void;
  setSource: (s: SourceKind) => void;
  loadUpload: (img: HTMLImageElement) => void;
  setNet: (p: Partial<Pick<Sim, "bandwidth" | "latency" | "loss">>) => void;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  tick: (dt: number) => void;
}

function stepsOf(j: JourneyKind): Step[] {
  return j === "pixel" ? PIXEL_STEPS : SHARE_STEPS;
}

function ensureSource(kind: SourceKind): Raster {
  if (kind === "chart") return makeChartScene();
  return makeBenchScene();
}

function bumpHex(journey: JourneyKind, step: Step | undefined): string {
  if (!step) return hexFromRaster(buffers.source);
  if (journey === "share") return hexFromRaster(buffers.framebuffer);
  if (step.reveal != null) return hexFromRaster(buffers.framebuffer);
  return hexFromRaster(buffers.source);
}

export const useSim = create<Sim>((set, get) => ({
  powered: false,
  view: "photo",
  selected: null,
  journey: "pixel",
  run: "idle",
  stepIndex: 0,
  progress: 0,
  speed: 1,
  source: "bench",
  cpu: 0,
  dsp: 0,
  bus: 0,
  net: 0,
  fps: 0,
  kbps: 0,
  hex: "00 00 00 00 00 00 00 00",
  reveal: 0,
  bandwidth: 10,
  latency: 40,
  loss: 2,
  packets: [],
  acked: 0,
  dropped: 0,
  retrans: 0,
  frameRev: 0,

  powerOn: () => {
    const src = ensureSource("bench");
    const desk = posterize(makeDesktopScene());
    buffers.source = src;
    buffers.framebuffer = desk;
    buffers.remote = null;
    buffers.strips = [];
    set({
      powered: true,
      source: "bench",
      reveal: 1,
      frameRev: get().frameRev + 1,
      hex: hexFromRaster(src),
    });
  },

  select: (id) => set({ selected: id }),
  setView: (view) => set({ view }),
  setJourney: (journey) => {
    set({ journey, selected: null });
    get().reset();
  },
  setSpeed: (speed) => set({ speed }),
  setSource: (source) => {
    if (source === "upload") {
      set({ source });
      return;
    }
    const src = ensureSource(source);
    buffers.source = src;
    buffers.framebuffer = null;
    buffers.remote = null;
    buffers.strips = [];
    set({
      source,
      frameRev: get().frameRev + 1,
      hex: hexFromRaster(src),
      reveal: 0,
      run: "idle",
      stepIndex: 0,
      progress: 0,
    });
  },
  loadUpload: (img) => {
    const src = rasterFromImage(img);
    buffers.source = src;
    buffers.framebuffer = null;
    buffers.remote = null;
    buffers.strips = [];
    set({
      source: "upload",
      frameRev: get().frameRev + 1,
      hex: hexFromRaster(src),
      reveal: 0,
      run: "idle",
      stepIndex: 0,
      progress: 0,
    });
  },
  setNet: (p) => set(p),

  play: () => {
    const s = get();
    if (s.run === "done") {
      get().reset();
    }
    if (!buffers.source) {
      buffers.source = ensureSource(s.source === "upload" ? "bench" : s.source);
    }
    if (s.journey === "share" && !buffers.framebuffer && buffers.source) {
      buffers.framebuffer = posterize(buffers.source);
      set({ reveal: 1, frameRev: get().frameRev + 1 });
    }
    const steps = stepsOf(get().journey);
    set({
      run: "running",
      selected: get().selected ?? steps[0]?.chips[0] ?? null,
    });
  },
  pause: () => set({ run: "paused" }),
  stepOnce: () => {
    const s = get();
    if (s.run === "done") return;
    if (s.run === "idle") {
      s.play();
      set({ run: "paused" });
    }
    applyStepFinish(get, set, 1);
  },
  reset: () => {
    buffers.remote = null;
    buffers.strips = [];
    if (get().journey === "pixel") {
      buffers.framebuffer = posterize(makeDesktopScene());
    }
    set({
      run: "idle",
      stepIndex: 0,
      progress: 0,
      cpu: 0,
      dsp: 0,
      bus: 0,
      net: 0,
      fps: 0,
      kbps: 0,
      reveal: 1,
      packets: [],
      acked: 0,
      dropped: 0,
      retrans: 0,
      frameRev: get().frameRev + 1,
      hex: hexFromRaster(buffers.source),
    });
  },

  tick: (dt) => {
    const s = get();
    if (s.run !== "running") return;
    const steps = stepsOf(s.journey);
    const step = steps[s.stepIndex];
    if (!step) {
      set({ run: "done" });
      return;
    }
    const dur = step.durationMs / Math.max(0.25, s.speed);
    let next = s.progress + (dt * 1000) / dur;
    const cpu = s.cpu + (step.cpu - s.cpu) * Math.min(1, dt * 6);
    const dsp = s.dsp + (step.dsp - s.dsp) * Math.min(1, dt * 6);
    const bus = s.bus + (step.bus - s.bus) * Math.min(1, dt * 6);
    const net = s.net + (step.net - s.net) * Math.min(1, dt * 6);
    let reveal = s.reveal;
    if (step.reveal != null) {
      const prev = steps[s.stepIndex - 1]?.reveal ?? 0;
      reveal = prev + (step.reveal - prev) * Math.min(1, next);
    }
    if (s.journey === "share") {
      drivePackets(get, set, step, Math.min(1, next));
    }
    if (next >= 1) {
      applyStepFinish(get, set, 1);
      return;
    }
    set({
      progress: next,
      cpu,
      dsp,
      bus,
      net,
      reveal,
      fps: s.journey === "pixel" ? Math.round(reveal * 68) : Math.max(1, Math.round((s.bandwidth / 10) * 8)),
      kbps: Math.round(net * s.bandwidth * 10),
      hex: bumpHex(s.journey, step),
    });
  },
}));

function applyStepFinish(
  get: () => Sim,
  set: (p: Partial<Sim>) => void,
  _force: number,
) {
  const s = get();
  const steps = stepsOf(s.journey);
  const step = steps[s.stepIndex];
  if (!step) {
    set({ run: "done" });
    return;
  }
  if (s.journey === "pixel" && step.id === "cpu-convert" && buffers.source) {
    buffers.framebuffer = posterize(buffers.source);
  }
  if (s.journey === "pixel" && step.reveal != null && buffers.source) {
    buffers.framebuffer = posterize(buffers.source);
  }
  if (s.journey === "share" && step.packets === "build" && s.packets.length === 0) {
    const compressed = Math.max(400, Math.min(1400, Math.round(nativeFrameBytes() / 8 / 16)));
    set({ packets: makeSharePackets(16, compressed) });
  }
  if (s.journey === "share" && step.id === "remote" && buffers.framebuffer) {
    buffers.remote = cloneRaster(buffers.framebuffer);
    buffers.strips = Array.from({ length: 16 }, () => true);
  }
  const nextIndex = s.stepIndex + 1;
  if (nextIndex >= steps.length) {
    set({
      run: "done",
      progress: 1,
      stepIndex: steps.length - 1,
      cpu: step.cpu,
      dsp: step.dsp,
      bus: step.bus,
      net: step.net,
      reveal: step.reveal ?? s.reveal,
      frameRev: s.frameRev + 1,
      hex: bumpHex(s.journey, step),
    });
    return;
  }
  const incoming = steps[nextIndex];
  set({
    stepIndex: nextIndex,
    progress: 0,
    cpu: step.cpu,
    dsp: step.dsp,
    bus: step.bus,
    net: step.net,
    reveal: incoming?.reveal != null ? (step.reveal ?? 0) : (step.reveal ?? s.reveal),
    frameRev: s.frameRev + 1,
    selected: incoming?.chips[0] ?? s.selected,
    hex: bumpHex(s.journey, step),
  });
}

function drivePackets(
  get: () => Sim,
  set: (p: Partial<Sim>) => void,
  step: Step,
  t: number,
) {
  const s = get();
  if (step.packets === "build" && s.packets.length === 0) {
    const compressed = Math.max(400, Math.min(1400, Math.round(nativeFrameBytes() / 8 / 16)));
    set({ packets: makeSharePackets(16, compressed) });
    return;
  }
  if (!step.packets || s.packets.length === 0) return;

  const packets = s.packets.map((p) => ({ ...p }));
  let acked = 0;
  let dropped = 0;
  let retrans = 0;
  const n = packets.length;
  const sendUpTo = step.packets === "send" || step.packets === "ack" ? Math.floor(t * n) : Math.floor(t * n * 0.4);
  const ackLag = s.latency / 400;
  const ackUpTo =
    step.packets === "ack" ? Math.floor(Math.max(0, t - ackLag) * n) : step.packets === "send" ? Math.floor(Math.max(0, t - 0.35 - ackLag) * n) : -1;

  if (buffers.framebuffer && !buffers.remote) {
    buffers.remote = cloneRaster(buffers.framebuffer);
    buffers.strips = Array.from({ length: 16 }, () => false);
  }

  for (let i = 0; i < n; i++) {
    const p = packets[i]!;
    const dropRoll = ((i * 37 + 11) % 100) < s.loss;
    if (i <= sendUpTo) {
      if (dropRoll && step.packets !== "ack") {
        p.status = t > (i + 0.7) / n ? "retransmit" : "dropped";
      } else {
        p.status = "on-wire";
      }
    }
    if (i <= ackUpTo) {
      if (dropRoll) {
        p.status = "retransmit";
        retrans++;
        dropped++;
      } else {
        p.status = "acked";
        acked++;
        if (buffers.strips.length) buffers.strips[p.strip] = true;
      }
    }
    if (step.packets === "ack" && t > 0.92) {
      p.status = "delivered";
      acked = n;
      if (buffers.strips.length) buffers.strips[p.strip] = true;
    }
  }
  if (step.packets === "ack" && t > 0.92) {
    acked = n;
    buffers.strips = Array.from({ length: 16 }, () => true);
  }

  set({
    packets,
    acked,
    dropped,
    retrans,
    frameRev: s.frameRev + 1,
    kbps: Math.round(s.bandwidth * 100 * Math.min(1, t + 0.2)),
  });
}

export function currentStep(s: Sim): Step | undefined {
  return stepsOf(s.journey)[s.stepIndex];
}

export function allSteps(s: Sim): Step[] {
  return stepsOf(s.journey);
}
