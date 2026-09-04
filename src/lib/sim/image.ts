import { MP_H, MP_W, type FilterKind } from "./types";

export const GRAYS = [0x1c, 0x6a, 0xb4, 0xf2] as const;

export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function quantize2(v: number): number {
  if (v < 48) return GRAYS[0];
  if (v < 120) return GRAYS[1];
  if (v < 188) return GRAYS[2];
  return GRAYS[3];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function rasterToGray(
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dw = MP_W,
  dh = MP_H,
): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = dw;
  c.height = dh;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Uint8ClampedArray(dw * dh);
  ctx.fillStyle = "#14120e";
  ctx.fillRect(0, 0, dw, dh);
  const scale = Math.min(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  ctx.drawImage(source, (dw - w) / 2, (dh - h) / 2, w, h);
  const data = ctx.getImageData(0, 0, dw, dh).data;
  const gray = new Uint8ClampedArray(dw * dh);
  let lo = 255;
  let hi = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = luminance(data[i], data[i + 1], data[i + 2]);
    gray[p] = v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const range = Math.max(1, hi - lo);
  for (let p = 0; p < gray.length; p++) {
    gray[p] = ((gray[p] - lo) / range) * 255;
  }
  return gray;
}

export function applyFilter(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  kind: FilterKind,
): Uint8ClampedArray {
  if (kind === "none") return src;
  if (kind === "invert") {
    const out = new Uint8ClampedArray(src.length);
    for (let i = 0; i < src.length; i++) out[i] = 255 - src[i];
    return out;
  }
  const out = new Uint8ClampedArray(src.length);
  const at = (x: number, y: number) => src[y * w + x];
  if (kind === "sharpen") {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const v = 5 * at(x, y) - at(x - 1, y) - at(x + 1, y) - at(x, y - 1) - at(x, y + 1);
        out[y * w + x] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    return out;
  }
  // Sobel edge
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
      const mag = Math.hypot(gx, gy);
      out[y * w + x] = mag > 255 ? 255 : mag;
    }
  }
  return out;
}

export function quantizeBuffer(src: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i++) out[i] = quantize2(src[i]);
  return out;
}

export function blitGray(
  ctx: CanvasRenderingContext2D,
  gray: Uint8ClampedArray,
  w: number,
  h: number,
  phosphor = true,
) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    const g = gray[i];
    if (phosphor) {
      d[p] = g * 0.92;
      d[p + 1] = g * 0.95;
      d[p + 2] = g * 0.82;
    } else {
      d[p] = g;
      d[p + 1] = g;
      d[p + 2] = g;
    }
    d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function sampleHex(gray: Uint8ClampedArray, offset = 0, rows = 8): string[] {
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const start = offset + r * 16;
    const bytes: string[] = [];
    for (let i = 0; i < 16; i++) {
      const b = gray[(start + i) % gray.length] ?? 0;
      bytes.push(b.toString(16).padStart(2, "0"));
    }
    lines.push(bytes.join(" "));
  }
  return lines;
}

export function asciiRow(gray: Uint8ClampedArray, offset = 0): string {
  let s = "";
  for (let i = 0; i < 16; i++) {
    const b = gray[(offset + i) % gray.length] ?? 0;
    s += b >= 32 && b < 127 ? String.fromCharCode(b) : ".";
  }
  return s;
}

export function paintWorkspace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, w, 28);
  ctx.fillStyle = "#d8d8d0";
  ctx.font = "500 13px 'IBM Plex Sans', sans-serif";
  ctx.fillText("Workspace    File    Edit    Windows    Hide    Quit", 16, 19);

  const win = { x: 80, y: 56, w: w * 0.62, h: h * 0.62 };
  roundRect(ctx, win.x, win.y, win.w, win.h, 2, "#c8c8c0");
  ctx.fillStyle = "#222";
  ctx.fillRect(win.x, win.y, win.w, 22);
  ctx.fillStyle = "#eee";
  ctx.font = "500 12px 'IBM Plex Sans', sans-serif";
  ctx.fillText("File Viewer — /LocalApps", win.x + 10, win.y + 16);

  ctx.fillStyle = "#dcdcd4";
  ctx.fillRect(win.x + 1, win.y + 22, win.w - 2, win.h - 23);

  const icons = ["Mail.app", "Edit.app", "Terminal", "Preview", "Lisp", "Interface"];
  icons.forEach((name, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const ix = win.x + 36 + col * 150;
    const iy = win.y + 56 + row * 120;
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(ix, iy, 48, 48);
    ctx.strokeStyle = "#111";
    ctx.strokeRect(ix, iy, 48, 48);
    ctx.fillStyle = "#111";
    ctx.font = "12px 'IBM Plex Sans', sans-serif";
    ctx.fillText(name, ix, iy + 66);
  });

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, h - 64, w, 64);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i === 0 ? "#c81e1e" : "#4a4a4a";
    ctx.fillRect(24 + i * 56, h - 52, 40, 40);
  }
}

export function paintZone(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.createImageData(w, h);
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot(x - cx, y - cy);
      const v = (Math.sin(r * r * 0.00045) + 1) * 127.5;
      const p = (y * w + x) * 4;
      img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export async function sourceToGray(sourceId: string, upload?: HTMLImageElement | null) {
  const c = document.createElement("canvas");
  c.width = MP_W;
  c.height = MP_H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Uint8ClampedArray(MP_W * MP_H);

  if (sourceId === "workspace") {
    paintWorkspace(ctx, MP_W, MP_H);
    return rasterToGray(c, MP_W, MP_H);
  }
  if (sourceId === "zone") {
    paintZone(ctx, MP_W, MP_H);
    return rasterToGray(c, MP_W, MP_H);
  }
  if (sourceId === "upload" && upload) {
    return rasterToGray(upload, upload.naturalWidth, upload.naturalHeight);
  }
  const map: Record<string, string> = {
    bust: "/scenes/bust.jpg",
    office: "/scenes/office.jpg",
    facade: "/scenes/facade.jpg",
    camera: "/scenes/camera.jpg",
  };
  const src = map[sourceId];
  if (!src) {
    paintWorkspace(ctx, MP_W, MP_H);
    return rasterToGray(c, MP_W, MP_H);
  }
  try {
    const img = await loadImage(src);
    return rasterToGray(img, img.naturalWidth, img.naturalHeight);
  } catch {
    paintWorkspace(ctx, MP_W, MP_H);
    return rasterToGray(c, MP_W, MP_H);
  }
}

export function processFrame(gray: Uint8ClampedArray, filter: FilterKind) {
  const filtered = applyFilter(gray, MP_W, MP_H, filter);
  const quantized = quantizeBuffer(filtered);
  return { filtered, quantized };
}

export function deltaBytes(a: Uint8ClampedArray, b: Uint8ClampedArray, tileW = 70, tileH = 70) {
  const cols = Math.ceil(MP_W / tileW);
  const rows = Math.ceil(MP_H / tileH);
  let changed = 0;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      let diff = false;
      for (let y = ty * tileH; y < Math.min(MP_H, (ty + 1) * tileH) && !diff; y++) {
        for (let x = tx * tileW; x < Math.min(MP_W, (tx + 1) * tileW); x++) {
          if (a[y * MP_W + x] !== b[y * MP_W + x]) {
            diff = true;
            break;
          }
        }
      }
      if (diff) changed++;
    }
  }
  const total = cols * rows;
  const raw = MP_W * MP_H * 0.25;
  const packed = (changed / total) * raw + 24 * changed;
  return { changed, total, bytes: Math.round(packed), ratio: packed / raw };
}
