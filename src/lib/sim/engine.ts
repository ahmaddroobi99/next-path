import { PIXEL_STAGES, SHARE_STAGES } from "./hardware";
import { makeFrame, packetsFor, wireTimeSec } from "./ethernet";
import type { LogEntry, Mode, NetworkCfg, Snapshot, StageDef, VisualPacket } from "./types";
import { TILE_COLS, TILE_ROWS } from "./types";

const PIXEL_DURATION = 12;
const SHARE_DURATION = 14;

function stageAt(list: StageDef[], t: number): { stage: StageDef; index: number } {
  let index = 0;
  for (let i = 0; i < list.length; i++) {
    if (t >= list[i].at) index = i;
  }
  return { stage: list[index], index };
}

function emptyMetrics() {
  return { cpu: 0, dsp: 0, bus: 0, netKbps: 0, fps: 68, cacheHit: 0, busMBps: 0 };
}

function emptyInspector() {
  return {
    address: "0x00000000",
    hex: Array.from({ length: 8 }, () => "00 ".repeat(16).trim()),
    ascii: ".".repeat(16),
    label: "Idle · no transaction",
  };
}

export function idleSnapshot(): Snapshot {
  return {
    mode: "idle",
    running: false,
    t: 0,
    stageIndex: 0,
    stage: null,
    packets: [],
    metrics: emptyMetrics(),
    inspector: emptyInspector(),
    log: [],
    util: {},
    remoteTiles: 0,
    remoteTotal: TILE_COLS * TILE_ROWS,
    dropped: 0,
    retransmits: 0,
    bytesOnWire: 0,
    compressRatio: 1,
    done: false,
  };
}

export class LabEngine {
  mode: Mode = "idle";
  running = false;
  t = 0;
  speed = 1;
  network: NetworkCfg = { bandwidth: 10, latency: 12, loss: 2 };
  compressRatio = 0.34;
  payloadBytes = 80_000;
  log: LogEntry[] = [];
  seq = 1;
  dropped = 0;
  retransmits = 0;
  bytesOnWire = 0;
  remoteTiles = 0;
  lastLogT = -1;
  hexSeed = 0;

  start(mode: Mode) {
    this.mode = mode;
    this.running = true;
    this.t = 0;
    this.log = [];
    this.seq = 1;
    this.dropped = 0;
    this.retransmits = 0;
    this.bytesOnWire = 0;
    this.remoteTiles = 0;
    this.lastLogT = -1;
    this.hexSeed = (Math.random() * 0xffff) | 0;
    this.push("sys", 0, mode === "pixel" ? "Pixel journey armed" : "Desktop share armed");
  }

  pause() {
    this.running = false;
  }

  resume() {
    if (this.mode !== "idle") this.running = true;
  }

  reset() {
    this.mode = "idle";
    this.running = false;
    this.t = 0;
    this.log = [];
    this.remoteTiles = 0;
    this.dropped = 0;
    this.retransmits = 0;
    this.bytesOnWire = 0;
  }

  step() {
    const dur = this.mode === "pixel" ? PIXEL_DURATION : SHARE_DURATION;
    this.t = Math.min(1, this.t + 0.07);
    this.maybeEmit(dur);
  }

  tick(dt: number) {
    if (!this.running || this.mode === "idle") return;
    const dur = this.mode === "pixel" ? PIXEL_DURATION : SHARE_DURATION;
    this.t = Math.min(1, this.t + (dt * this.speed) / dur);
    this.maybeEmit(dur);
    if (this.t >= 1) this.running = false;
  }

  private maybeEmit(dur: number) {
    if (this.mode !== "share") return;
    if (this.t < 0.36) return;
    const totalPkts = packetsFor(this.payloadBytes);
    const span = 0.5;
    const local = Math.min(1, Math.max(0, (this.t - 0.36) / span));
    const target = Math.floor(local * totalPkts);
    while (this.seq <= target) {
      const drop = Math.random() * 100 < this.network.loss;
      const frame = makeFrame(this.seq, 1400);
      const latencyBit = this.network.latency / 1000;
      void latencyBit;
      void dur;
      if (drop) {
        this.dropped += 1;
        this.push("drop", 1400, `seq=${this.seq}  ${frame.tcp}  lost on wire`);
        this.retransmits += 1;
        this.push("rtx", 1400, `seq=${this.seq}  retransmit + ACK`);
        this.bytesOnWire += 1400 * 2;
      } else {
        this.push("tx", 1400, `seq=${this.seq}  ${frame.ip}  ${frame.tcp}`);
        this.bytesOnWire += 1514;
      }
      const tiles = TILE_COLS * TILE_ROWS;
      this.remoteTiles = Math.min(tiles, Math.floor((this.seq / totalPkts) * tiles));
      this.seq += 1;
    }
  }

  private push(kind: LogEntry["kind"], bytes: number, note: string) {
    this.log.unshift({ t: this.t, kind, seq: this.seq, bytes, note });
    if (this.log.length > 48) this.log.length = 48;
  }

  snapshot(): Snapshot {
    const stages = this.mode === "share" ? SHARE_STAGES : PIXEL_STAGES;
    const { stage, index } = this.mode === "idle" ? { stage: null, index: 0 } : stageAt(stages, this.t);
    const util: Record<string, number> = {};
    if (stage) {
      util[stage.chip] = 0.55 + 0.45 * Math.abs(Math.sin(this.t * 14));
      if (stage.chip === "cpu") {
        util.bus = 0.4;
        util.ram = 0.35;
      }
      if (stage.chip === "dsp") util.bus = 0.25;
      if (stage.chip === "eth" || stage.chip === "rj45") {
        util.eth = 0.8;
        util.bus = 0.45;
      }
    }

    const packets: VisualPacket[] = [];
    if (this.mode === "pixel" && this.t > 0) {
      packets.push({ id: 1, path: "in", s: Math.min(1, this.t), size: stage?.bytes ?? 0 });
      if (this.t > 0.18) {
        packets.push({ id: 2, path: "in", s: Math.min(1, this.t - 0.08), size: 4096 });
      }
    }
    if (this.mode === "share" && this.t > 0) {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const s = this.t - i * 0.06;
        if (s > 0 && s < 1) packets.push({ id: 10 + i, path: "out", s, size: 1514 });
      }
    }

    const cpu =
      stage?.chip === "cpu" ? 0.7 + 0.2 * Math.sin(this.t * 20) : stage ? 0.18 : 0;
    const dsp = stage?.chip === "dsp" ? 0.85 : this.mode === "share" && this.t < 0.3 ? 0.4 : 0.05;
    const bus = stage ? 0.35 + (stage.chip === "bus" ? 0.5 : 0.1) : 0;
    const netKbps =
      this.mode === "share" && this.t > 0.36
        ? this.network.bandwidth * 1000 * 0.7
        : 0;
    const busMBps = bus * 28;

    const addr = (0x04000000 + Math.floor(this.t * 232960)) >>> 0;
    const hex = this.makeHex();

    return {
      mode: this.mode,
      running: this.running,
      t: this.t,
      stageIndex: index,
      stage,
      packets,
      metrics: {
        cpu: clamp01(cpu),
        dsp: clamp01(dsp),
        bus: clamp01(bus),
        netKbps,
        fps: this.mode === "idle" ? 0 : 68,
        cacheHit: stage?.chip === "cpu" ? 0.78 + 0.1 * Math.sin(this.t * 9) : 0.12,
        busMBps,
      },
      inspector: {
        address: `0x${addr.toString(16).padStart(8, "0")}`,
        hex,
        ascii: asciiFromHex(hex[0] ?? ""),
        label: stage ? `${stage.format} · ${stage.title}` : "Bus idle",
      },
      log: this.log,
      util,
      remoteTiles: this.remoteTiles,
      remoteTotal: TILE_COLS * TILE_ROWS,
      dropped: this.dropped,
      retransmits: this.retransmits,
      bytesOnWire: this.bytesOnWire,
      compressRatio: this.compressRatio,
      done: this.t >= 1,
    };
  }

  wireEstimate() {
    return wireTimeSec(this.payloadBytes, this.network.bandwidth);
  }

  private makeHex(): string[] {
    const lines: string[] = [];
    let n = this.hexSeed + Math.floor(this.t * 4096);
    for (let r = 0; r < 8; r++) {
      const bytes: string[] = [];
      for (let i = 0; i < 16; i++) {
        n = (n * 1103515245 + 12345) >>> 0;
        const v = this.mode === "idle" ? 0 : (n >>> 16) & 0xff;
        bytes.push(v.toString(16).padStart(2, "0"));
      }
      lines.push(bytes.join(" "));
    }
    return lines;
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function asciiFromHex(line: string) {
  return line
    .split(" ")
    .map((h) => {
      const n = parseInt(h, 16);
      return n >= 32 && n < 127 ? String.fromCharCode(n) : ".";
    })
    .join("");
}
