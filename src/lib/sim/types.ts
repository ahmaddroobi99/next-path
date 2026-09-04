export const MP_W = 1120;
export const MP_H = 832;
export const TILE_COLS = 16;
export const TILE_ROWS = 12;

export type Mode = "idle" | "pixel" | "share";
export type FilterKind = "none" | "sharpen" | "edge" | "invert";
export type SourceId = "bust" | "office" | "facade" | "camera" | "workspace" | "zone" | "upload";

export interface Point {
  x: number;
  y: number;
}

export interface ChipSpec {
  label: string;
  value: string;
}

export interface ChipDef {
  id: string;
  name: string;
  part: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "cpu" | "dsp" | "ram" | "fb" | "nic" | "io" | "pwr" | "port" | "bus";
  blurb: string;
  specs: ChipSpec[];
  internals?: ChipSpec[];
}

export interface StageDef {
  id: string;
  at: number;
  chip: string;
  title: string;
  detail: string;
  format: string;
  bytes: number;
}

export interface VisualPacket {
  id: number;
  path: "in" | "out";
  s: number;
  size: number;
}

export interface LogEntry {
  t: number;
  kind: "tx" | "rx" | "drop" | "rtx" | "ack" | "sys";
  seq: number;
  bytes: number;
  note: string;
}

export interface Metrics {
  cpu: number;
  dsp: number;
  bus: number;
  netKbps: number;
  fps: number;
  cacheHit: number;
  busMBps: number;
}

export interface Inspector {
  address: string;
  hex: string[];
  ascii: string;
  label: string;
}

export interface NetworkCfg {
  bandwidth: number;
  latency: number;
  loss: number;
}

export interface Snapshot {
  mode: Mode;
  running: boolean;
  t: number;
  stageIndex: number;
  stage: StageDef | null;
  packets: VisualPacket[];
  metrics: Metrics;
  inspector: Inspector;
  log: LogEntry[];
  util: Record<string, number>;
  remoteTiles: number;
  remoteTotal: number;
  dropped: number;
  retransmits: number;
  bytesOnWire: number;
  compressRatio: number;
  done: boolean;
}
