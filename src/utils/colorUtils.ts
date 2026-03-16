import type { RGB } from "@/types";

export function rgbToCss(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function rgbDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;
  if (sat === 0) {
    const v = Math.round(light * 255);
    return { r: v, g: v, b: v };
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const toChannel = (tBase: number) => {
    let t = tBase;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(toChannel(hue + 1 / 3) * 255),
    g: Math.round(toChannel(hue) * 255),
    b: Math.round(toChannel(hue - 1 / 3) * 255),
  };
}