import type { Point } from "./types";

export function polylineLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.hypot(dx, dy);
  }
  return len;
}

export function pointAt(pts: Point[], s: number): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1 || s <= 0) return pts[0];
  if (s >= 1) return pts[pts.length - 1];
  const total = polylineLength(pts);
  let remain = s * total;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const seg = Math.hypot(dx, dy);
    if (remain <= seg || i === pts.length - 1) {
      const t = seg === 0 ? 0 : remain / seg;
      return { x: pts[i - 1].x + dx * t, y: pts[i - 1].y + dy * t };
    }
    remain -= seg;
  }
  return pts[pts.length - 1];
}

export function toPathD(pts: Point[]): string {
  if (pts.length === 0) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}
