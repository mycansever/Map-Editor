import type { MapData, Province } from "@/types";

export function recomputeProvinceGeography(map: MapData, provinces: Map<number, Province>): void {
  provinces.forEach((province) => {
    province.cellCount = 0;
    province.centroid = { x: 0, y: 0 };
    province.boundingBox = { minX: map.width, minY: map.height, maxX: 0, maxY: 0 };
    province.coastal = false;
    province.neighbors = [];
  });

  const neighborSets = new Map<number, Set<number>>();
  const { width, height, cells } = map;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = cells[y * width + x];
      const province = provinces.get(id);
      if (!province) continue;
      province.cellCount += 1;
      province.centroid.x += x;
      province.centroid.y += y;
      province.boundingBox.minX = Math.min(province.boundingBox.minX, x);
      province.boundingBox.minY = Math.min(province.boundingBox.minY, y);
      province.boundingBox.maxX = Math.max(province.boundingBox.maxX, x);
      province.boundingBox.maxY = Math.max(province.boundingBox.maxY, y);

      const around = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of around) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nId = cells[ny * width + nx];
        if (nId === id) continue;
        if (!neighborSets.has(id)) neighborSets.set(id, new Set<number>());
        neighborSets.get(id)?.add(nId);
      }
    }
  }

  provinces.forEach((province) => {
    if (province.cellCount > 0) {
      province.centroid.x /= province.cellCount;
      province.centroid.y /= province.cellCount;
    }
    province.neighbors = Array.from(neighborSets.get(province.id) ?? []);
  });
}