import { create } from "zustand";
import { idleSnapshot, LabEngine } from "@/lib/sim/engine";
import { processFrame, sourceToGray } from "@/lib/sim/image";
import type { FilterKind, Snapshot, SourceId } from "@/lib/sim/types";

const LS = "cube-trace-v1";

export const engine = new LabEngine();

interface LabState {
  snap: Snapshot;
  filter: FilterKind;
  sourceId: SourceId;
  speed: number;
  intro: boolean;
  selectedChip: string | null;
  tab: "board" | "screens" | "data";
  gray: Uint8ClampedArray | null;
  localFrame: Uint8ClampedArray | null;
  remoteFrame: Uint8ClampedArray | null;
  upload: HTMLImageElement | null;
  busy: boolean;
  ready: boolean;
  setFilter: (f: FilterKind) => void;
  setSource: (id: SourceId) => void;
  setSpeed: (n: number) => void;
  setNetwork: (partial: Partial<LabEngine["network"]>) => void;
  setChip: (id: string | null) => void;
  setTab: (t: LabState["tab"]) => void;
  setUpload: (img: HTMLImageElement | null) => void;
  dismissIntro: () => void;
  hydrate: () => void;
  capture: () => Promise<void>;
  share: () => Promise<void>;
  toggle: () => void;
  step: () => void;
  reset: () => void;
  tick: (dt: number) => void;
}

function persist(s: LabState) {
  try {
    localStorage.setItem(
      LS,
      JSON.stringify({
        filter: s.filter,
        sourceId: s.sourceId,
        speed: s.speed,
        intro: s.intro,
        network: engine.network,
      }),
    );
  } catch {
    /* ignore */
  }
}

function readSaved(): Partial<LabState> & { network?: LabEngine["network"] } {
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<LabState> & { network?: LabEngine["network"] };
  } catch {
    return {};
  }
}

export const useLab = create<LabState>((set, get) => ({
  snap: idleSnapshot(),
  filter: "none",
  sourceId: "bust",
  speed: 1,
  intro: true,
  selectedChip: null,
  tab: "board",
  gray: null,
  localFrame: null,
  remoteFrame: null,
  upload: null,
  busy: false,
  ready: false,

  hydrate: () => {
    const d = readSaved();
    if (d.network) engine.network = { ...engine.network, ...d.network };
    if (typeof d.speed === "number") engine.speed = d.speed;
    set({
      ready: true,
      filter: d.filter ?? "none",
      sourceId: d.sourceId ?? "bust",
      speed: d.speed ?? 1,
      intro: d.intro ?? true,
    });
  },

  setFilter: (filter) => {
    set({ filter });
    persist(get());
  },
  setSource: (sourceId) => {
    set({ sourceId });
    persist(get());
  },
  setSpeed: (speed) => {
    engine.speed = speed;
    set({ speed });
    persist(get());
  },
  setNetwork: (partial) => {
    engine.network = { ...engine.network, ...partial };
    set({ snap: engine.snapshot() });
    persist(get());
  },
  setChip: (selectedChip) => set({ selectedChip }),
  setTab: (tab) => set({ tab }),
  setUpload: (upload) => set({ upload, sourceId: upload ? "upload" : get().sourceId }),
  dismissIntro: () => {
    set({ intro: false });
    persist(get());
  },

  capture: async () => {
    const { sourceId, upload, filter } = get();
    set({ busy: true });
    const gray = await sourceToGray(sourceId, upload);
    const { quantized } = processFrame(gray, filter);
    engine.payloadBytes = 232_960;
    engine.start("pixel");
    set({
      busy: false,
      gray,
      localFrame: quantized,
      remoteFrame: null,
      snap: engine.snapshot(),
    });
  },

  share: async () => {
    let { localFrame, gray, sourceId, upload, filter } = get();
    set({ busy: true });
    if (!localFrame || !gray) {
      gray = await sourceToGray(sourceId, upload);
      const processed = processFrame(gray, filter);
      localFrame = processed.quantized;
    }
    engine.compressRatio = 0.34;
    engine.payloadBytes = Math.round(232_960 * engine.compressRatio);
    engine.start("share");
    set({
      busy: false,
      gray,
      localFrame,
      remoteFrame: localFrame,
      snap: engine.snapshot(),
    });
  },

  toggle: () => {
    if (engine.mode === "idle") return;
    if (engine.running) engine.pause();
    else engine.resume();
    set({ snap: engine.snapshot() });
  },

  step: () => {
    if (engine.mode === "idle") return;
    engine.running = false;
    engine.step();
    set({ snap: engine.snapshot() });
  },

  reset: () => {
    engine.reset();
    set({
      snap: idleSnapshot(),
      remoteFrame: null,
    });
  },

  tick: (dt) => {
    if (!engine.running) return;
    engine.tick(dt);
    set({ snap: engine.snapshot() });
  },
}));
