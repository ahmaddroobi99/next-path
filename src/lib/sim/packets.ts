export interface WirePacket {
  id: number;
  seq: number;
  tMs: number;
  destMac: string;
  srcMac: string;
  ethertype: string;
  srcIp: string;
  dstIp: string;
  sport: number;
  dport: number;
  flags: string;
  payload: number;
  wire: number;
  strip: number;
  status: "queued" | "on-wire" | "acked" | "dropped" | "retransmit" | "delivered";
  hex: string;
}

const NEXT_OUI = "08:00:07";
export const LOCAL_MAC = `${NEXT_OUI}:13:40:c2`;
export const PEER_MAC = `${NEXT_OUI}:a2:11:04`;
export const LOCAL_IP = "192.168.1.40";
export const PEER_IP = "192.168.1.90";
export const SHARE_PORT = 5900;

function hexByte(n: number) {
  return n.toString(16).padStart(2, "0").toUpperCase();
}

function macBytes(mac: string) {
  return mac.split(":").map((x) => parseInt(x, 16));
}

function ipBytes(ip: string) {
  return ip.split(".").map((x) => parseInt(x, 10));
}

export function crc32(bytes: number[]) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function buildFrameHex(pkt: {
  destMac: string;
  srcMac: string;
  seq: number;
  payload: number;
  sport: number;
  dport: number;
}) {
  const bytes: number[] = [];
  bytes.push(...macBytes(pkt.destMac));
  bytes.push(...macBytes(pkt.srcMac));
  bytes.push(0x08, 0x00); // IPv4
  // IPv4 header (20)
  const ipStart = bytes.length;
  bytes.push(0x45, 0x00);
  const ipLen = 20 + 20 + Math.min(pkt.payload, 24);
  bytes.push((ipLen >> 8) & 0xff, ipLen & 0xff);
  bytes.push((pkt.seq >> 8) & 0xff, pkt.seq & 0xff);
  bytes.push(0x40, 0x00); // don't fragment
  bytes.push(64, 6); // TTL, TCP
  bytes.push(0, 0); // checksum placeholder
  bytes.push(...ipBytes(LOCAL_IP));
  bytes.push(...ipBytes(PEER_IP));
  let sum = 0;
  for (let i = ipStart; i < ipStart + 20; i += 2) {
    sum += ((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0);
  }
  sum = (~((sum & 0xffff) + (sum >>> 16))) & 0xffff;
  bytes[ipStart + 10] = sum >> 8;
  bytes[ipStart + 11] = sum & 0xff;
  // TCP (20)
  bytes.push(pkt.sport >> 8, pkt.sport & 0xff);
  bytes.push(pkt.dport >> 8, pkt.dport & 0xff);
  const seq = (pkt.seq * pkt.payload) >>> 0;
  bytes.push((seq >>> 24) & 0xff, (seq >>> 16) & 0xff, (seq >>> 8) & 0xff, seq & 0xff);
  bytes.push(0, 0, 0, 0);
  bytes.push(0x50, 0x18); // header len + PSH ACK
  bytes.push(0x10, 0x00); // window
  bytes.push(0, 0, 0, 0);
  for (let i = 0; i < 12; i++) bytes.push((pkt.seq * 17 + i * 13) & 0xff);
  const fcs = crc32(bytes);
  bytes.push((fcs >>> 24) & 0xff, (fcs >>> 16) & 0xff, (fcs >>> 8) & 0xff, fcs & 0xff);
  return bytes.slice(0, 48).map(hexByte).join(" ");
}

export function makeSharePackets(stripCount: number, bytesPerStrip: number): WirePacket[] {
  const packets: WirePacket[] = [];
  const overhead = 14 + 20 + 20 + 4; // eth + ip + tcp + fcs
  for (let i = 0; i < stripCount; i++) {
    const payload = bytesPerStrip;
    packets.push({
      id: i + 1,
      seq: i + 1,
      tMs: 0,
      destMac: PEER_MAC,
      srcMac: LOCAL_MAC,
      ethertype: "0x0800 IPv4",
      srcIp: LOCAL_IP,
      dstIp: PEER_IP,
      sport: 49152,
      dport: SHARE_PORT,
      flags: "PSH ACK",
      payload,
      wire: payload + overhead,
      strip: i,
      status: "queued",
      hex: buildFrameHex({
        destMac: PEER_MAC,
        srcMac: LOCAL_MAC,
        seq: i + 1,
        payload,
        sport: 49152,
        dport: SHARE_PORT,
      }),
    });
  }
  return packets;
}

export function formatMac(mac: string) {
  return mac.toUpperCase();
}
