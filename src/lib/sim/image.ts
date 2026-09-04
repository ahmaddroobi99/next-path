export const NATIVE = { w: 1120, h: 832, bpp: 2, refreshHz: 68 } as const;
export const WORK = { w: 560, h: 416 } as const;

export const GRAY_LEVELS = [0x1a, 0x5a, 0x9a, 0xdc];

export interface Raster {
  w: number;
  h: number;
  pix: Uint8ClampedArray; // RGBA
}

export const buffers: {
  source: Raster | null;
  framebuffer: Raster | null;
  remote: Raster | null;
  strips: boolean[];
  stripCount: number;
} = {
  source: null,
  framebuffer: null,
  remote: null,
  strips: [],
  stripCount: 16,
};

export function blank(w = WORK.w, h = WORK.h, fill = 0x14): Raster {
  const pix = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < pix.length; i += 4) {
    pix[i] = fill;
    pix[i + 1] = fill;
    pix[i + 2] = fill;
    pix[i + 3] = 255;
  }
  return { w, h, pix };
}

export function toGray(r: number, g: number, b: number) {
  return (r * 77 + g * 150 + b * 29) >> 8;
}

export function quantize2(gray: number) {
  if (gray < 64) return 0;
  if (gray < 128) return 1;
  if (gray < 192) return 2;
  return 3;
}

export function cloneRaster(src: Raster): Raster {
  return { w: src.w, h: src.h, pix: new Uint8ClampedArray(src.pix) };
}

export function rasterFromImage(img: HTMLImageElement | HTMLCanvasElement): Raster {
  const c = document.createElement("canvas");
  c.width = WORK.w;
  c.height = WORK.h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, WORK.w, WORK.h);
  const scale = Math.max(WORK.w / img.width, WORK.h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (WORK.w - dw) / 2, (WORK.h - dh) / 2, dw, dh);
  return { w: WORK.w, h: WORK.h, pix: ctx.getImageData(0, 0, WORK.w, WORK.h).data };
}

export function posterize(src: Raster): Raster {
  const out = cloneRaster(src);
  const p = out.pix;
  for (let i = 0; i < p.length; i += 4) {
    const q = quantize2(toGray(p[i]!, p[i + 1]!, p[i + 2]!));
    const v = GRAY_LEVELS[q]!;
    p[i] = v;
    p[i + 1] = v - 4;
    p[i + 2] = v - 10;
    p[i + 3] = 255;
  }
  return out;
}

export function hexFromRaster(src: Raster | null, n = 24): string {
  if (!src) return "00 00 00 00 00 00 00 00 00 00 00 00";
  const p = src.pix;
  const mid = (src.h >> 1) * src.w * 4 + (src.w >> 1) * 4;
  const bytes: string[] = [];
  for (let i = 0; i < n; i++) {
    const b = p[mid + i] ?? 0;
    bytes.push(b.toString(16).padStart(2, "0"));
  }
  return bytes.join(" ").toUpperCase();
}

export function nativeFrameBytes() {
  return (NATIVE.w * NATIVE.h * NATIVE.bpp) / 8;
}

export function nativeIngestBytes() {
  return NATIVE.w * NATIVE.h; // 8-bit gray
}

function fillRect(
  pix: Uint8ClampedArray,
  w: number,
  x: number,
  y: number,
  rw: number,
  rh: number,
  v: number,
) {
  const h = pix.length / 4 / w;
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(w, (x + rw) | 0);
  const y1 = Math.min(h, (y + rh) | 0);
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * w + x0) * 4;
    for (let xx = x0; xx < x1; xx++) {
      pix[i] = v;
      pix[i + 1] = v;
      pix[i + 2] = v;
      pix[i + 3] = 255;
      i += 4;
    }
  }
}

function drawCube(pix: Uint8ClampedArray, w: number, cx: number, cy: number, s: number) {
  const h = s;
  fillRect(pix, w, cx - s * 0.35, cy - h * 0.1, s * 0.7, s * 0.7, 0x3a);
  fillRect(pix, w, cx - s * 0.2, cy - h * 0.32, s * 0.7, s * 0.7, 0x68);
  fillRect(pix, w, cx - s * 0.48, cy - h * 0.18, s * 0.7, s * 0.7, 0x22);
}

export function makeBenchScene(): Raster {
  const { w, h } = WORK;
  const r = blank(w, h, 0x2a);
  const p = r.pix;
  fillRect(p, w, 0, 0, w, 22, 0x16);
  fillRect(p, w, 18, 36, w - 36, h - 70, 0x48);
  fillRect(p, w, 18, 36, w - 36, 18, 0x1c);
  fillRect(p, w, 26, 42, 8, 8, 0xb0);
  fillRect(p, w, 38, 42, 8, 8, 0x88);
  fillRect(p, w, 50, 42, 8, 8, 0x50);
  fillRect(p, w, 36, 70, w - 72, h - 130, 0x34);
  drawCube(p, w, w * 0.5, h * 0.55, 90);
  fillRect(p, w, 40, h - 28, w - 80, 14, 0x20);
  return r;
}

export function makeChartScene(): Raster {
  const { w, h } = WORK;
  const r = blank(w, h, 0x10);
  const p = r.pix;
  for (let x = 0; x < w; x++) {
    const g = Math.round((x / (w - 1)) * 255);
    fillRect(p, w, x, 24, 1, 70, g);
  }
  const cells = 8;
  const cw = Math.floor(w / cells);
  const ch = 90;
  for (let i = 0; i < cells; i++) {
    fillRect(p, w, i * cw, 110, cw - 2, ch, Math.round((i / (cells - 1)) * 255));
  }
  for (let y = 0; y < 120; y++) {
    for (let x = 0; x < w; x++) {
      const on = ((x >> 2) + (y >> 2)) & 1;
      const v = on ? 0xd0 : 0x18;
      const i = ((y + 220) * w + x) * 4;
      if (i >= 0 && i < p.length) {
        p[i] = v;
        p[i + 1] = v;
        p[i + 2] = v;
        p[i + 3] = 255;
      }
    }
  }
  fillRect(p, w, 40, 350, 80, 40, 0x00);
  fillRect(p, w, 140, 350, 80, 40, 0x55);
  fillRect(p, w, 240, 350, 80, 40, 0xaa);
  fillRect(p, w, 340, 350, 80, 40, 0xff);
  return r;
}

export function makeDesktopScene(): Raster {
  const { w, h } = WORK;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6e6a64";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, w, 22);
  ctx.fillStyle = "#d8d4cc";
  ctx.font = "600 11px 'IBM Plex Sans', sans-serif";
  ctx.fillText("NeXT Path", 10, 15);
  ctx.fillStyle = "#8c8a84";
  ctx.font = "11px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Workspace   Edit   Tools   Window", 92, 15);
  ctx.fillStyle = "#3a3936";
  ctx.fillRect(36, 48, w - 72, h - 92);
  ctx.fillStyle = "#111";
  ctx.fillRect(36, 48, w - 72, 20);
  ctx.fillStyle = "#c17a4a";
  ctx.fillRect(44, 54, 8, 8);
  ctx.fillStyle = "#d8d4cc";
  ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.fillText("MegaPixel — 1120 × 832", 58, 62);
  ctx.fillStyle = "#2a2926";
  ctx.fillRect(52, 80, w - 104, h - 140);
  ctx.fillStyle = "#cfc8b0";
  ctx.font = "22px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Display PostScript", 72, 130);
  ctx.font = "13px 'IBM Plex Sans', sans-serif";
  ctx.fillStyle = "#9a968c";
  ctx.fillText("A page of gray. Four voltages. One cube.", 72, 154);
  ctx.strokeStyle = "#b9b3a6";
  ctx.lineWidth = 2;
  const cx = w * 0.62;
  const cy = h * 0.58;
  ctx.strokeRect(cx, cy, 70, 70);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 22, cy - 18);
  ctx.lineTo(cx + 92, cy - 18);
  ctx.lineTo(cx + 70, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 70, cy);
  ctx.lineTo(cx + 92, cy - 18);
  ctx.lineTo(cx + 92, cy + 52);
  ctx.lineTo(cx + 70, cy + 70);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, h - 26, w, 26);
  ctx.fillStyle = "#8c8a84";
  ctx.font = "10px 'IBM Plex Mono', monospace";
  ctx.fillText("68 Hz   2 bpp   08:00:07:13:40:c2", 12, h - 10);
  const pix = ctx.getImageData(0, 0, w, h).data;
  return { w, h, pix: new Uint8ClampedArray(pix) };
}

export function paintRaster(ctx: CanvasRenderingContext2D, src: Raster | null, reveal = 1) {
  const { w, h } = WORK;
  if (!src) {
    ctx.fillStyle = "#14120f";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const img = new ImageData(new Uint8ClampedArray(src.pix), src.w, src.h);
  ctx.putImageData(img, 0, 0);
  if (reveal < 0.999) {
    const y = Math.floor(h * reveal);
    ctx.fillStyle = "rgba(10,10,8,0.82)";
    ctx.fillRect(0, y, w, h - y);
    ctx.fillStyle = "rgba(193,122,74,0.85)";
    ctx.fillRect(0, y, w, 2);
  }
}

export function paintRemote(
  ctx: CanvasRenderingContext2D,
  src: Raster | null,
  strips: boolean[],
  stripCount: number,
) {
  const { w, h } = WORK;
  ctx.fillStyle = "#100e0c";
  ctx.fillRect(0, 0, w, h);
  if (!src) return;
  const sh = Math.ceil(h / stripCount);
  for (let s = 0; s < stripCount; s++) {
    if (!strips[s]) continue;
    const y = s * sh;
    const hh = Math.min(sh, h - y);
    const slice = ctx.createImageData(w, hh);
    const start = y * w * 4;
    slice.data.set(src.pix.subarray(start, start + w * hh * 4));
    ctx.putImageData(slice, 0, y);
  }
}
