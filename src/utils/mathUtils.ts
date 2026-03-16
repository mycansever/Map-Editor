import { BrushShape } from "@/types/enums";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getBrushOffsets(size: number, shape: BrushShape): Array<{ dx: number; dy: number }> {
  const radius = Math.floor(size / 2);
  const points: Array<{ dx: number; dy: number }> = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (shape === BrushShape.Square) {
        points.push({ dx, dy });
        continue;
      }
      if (shape === BrushShape.Circle && dx * dx + dy * dy <= radius * radius) {
        points.push({ dx, dy });
        continue;
      }
      if (shape === BrushShape.Diamond && Math.abs(dx) + Math.abs(dy) <= radius) {
        points.push({ dx, dy });
      }
    }
  }
  return points;
}

export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let cx = x0;
  let cy = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
  return points;
}