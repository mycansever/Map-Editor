import { AdjacencyType, ProvinceType } from "@/types/enums";
import type { Adjacency, MapData, Province } from "@/types";

export function calculateAdjacencies(mapData: MapData, provinces: Map<number, Province>): Adjacency[] {
  const result: Adjacency[] = [];
  const seen = new Set<string>();
  const { width, height, cells } = mapData;

  const pushAdj = (a: number, b: number) => {
    if (a === b || a === 0 || b === 0) return;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const key = `${min}-${max}`;
    if (seen.has(key)) return;
    seen.add(key);
    const pa = provinces.get(min);
    const pb = provinces.get(max);
    const isLand = pa?.type === ProvinceType.Land && pb?.type === ProvinceType.Land;
    result.push({
      from: min,
      to: max,
      type: isLand ? AdjacencyType.Land : AdjacencyType.Sea,
      through: -1,
      comment: "auto",
    });
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const id = cells[i];
      if (x + 1 < width) pushAdj(id, cells[i + 1]);
      if (y + 1 < height) pushAdj(id, cells[i + width]);
    }
  }

  return result;
}