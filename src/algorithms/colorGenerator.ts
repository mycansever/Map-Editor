import type { RGB } from "@/types";
import { hslToRgb, rgbDistance } from "@/utils/colorUtils";

export function generateUniqueColor(index: number, used: RGB[]): RGB {
  const golden = 137.508;
  for (let i = 0; i < 40; i++) {
    const hue = (index * golden + i * 17) % 360;
    const sat = 58 + ((index + i) % 20);
    const light = 42 + ((index * 3 + i) % 20);
    const color = hslToRgb(hue, sat, light);
    const farEnough = used.every((c) => rgbDistance(c, color) >= 30);
    if (farEnough) return color;
  }
  return hslToRgb((index * golden) % 360, 70, 55);
}