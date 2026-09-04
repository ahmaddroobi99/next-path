import { DST_MAC, SRC_MAC } from "./hardware";

export interface EtherFrame {
  seq: number;
  dest: string;
  src: string;
  etherType: string;
  ip: string;
  tcp: string;
  payload: number;
  hex: string;
}

function randNibble() {
  return Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
}

export function makeFrame(seq: number, payload = 1400): EtherFrame {
  const ident = `${randNibble()}${randNibble()}`;
  const srcPort = 49152 + (seq % 1000);
  const hex = [
    DST_MAC.replaceAll(":", ""),
    SRC_MAC.replaceAll(":", ""),
    "0800",
    "4500",
    (payload + 40).toString(16).padStart(4, "0"),
    ident,
    "4000",
    "40",
    "06",
    "0000",
    "0a000001",
    "0a000002",
    srcPort.toString(16).padStart(4, "0"),
    "170c",
    seq.toString(16).padStart(8, "0"),
    "00000000",
    "5002",
    "ffff",
    "0000",
    "0000",
  ]
    .join("")
    .slice(0, 96);

  return {
    seq,
    dest: DST_MAC,
    src: SRC_MAC,
    etherType: "0x0800 IPv4",
    ip: "10.0.0.1 → 10.0.0.2",
    tcp: `${srcPort} → 5900`,
    payload,
    hex: hex.match(/.{1,2}/g)?.join(" ") ?? hex,
  };
}

export function packetsFor(bytes: number, mss = 1400): number {
  return Math.max(1, Math.ceil(bytes / mss));
}

export function wireTimeSec(bytes: number, mbps: number): number {
  return (bytes * 8) / (mbps * 1_000_000);
}
