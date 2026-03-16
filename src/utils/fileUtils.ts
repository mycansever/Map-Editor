import type { Country, MapData, ProjectData, Province, State } from "@/types";
import { TerrainType, ViewMode } from "@/types/enums";
import { TERRAIN_COLORS } from "./constants";

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsvRow(parts: Array<string | number>): string {
  return parts.map((p) => `${p}`.replace(/;/g, ",")).join(";");
}

export function buildProjectData(
  map: MapData,
  provinces: Province[],
  states: State[],
  countries: Country[],
  adjacencies: ProjectData["adjacencies"],
  meta: { name: string; author: string },
  exportScale: number,
): ProjectData {
  const now = new Date().toISOString();
  return {
    version: "4.0.0",
    name: meta.name,
    author: meta.author,
    description: "Grand Strategy Editor Project",
    createdAt: now,
    lastModified: now,
    map: {
      width: map.width,
      height: map.height,
      cells: Array.from(map.cells),
    },
    provinces,
    states,
    countries,
    adjacencies,
    settings: {
      seaLevel: 0.35,
      defaultTerrain: TerrainType.Plains,
      exportScale,
      gridColor: "#2d3748",
      backgroundColor: "#0f0f1a",
    },
  };
}

export async function exportPng(
  mapData: MapData,
  provinces: Map<number, Province>,
  states: Map<number, State>,
  countries: Map<string, Country>,
  pixelsPerCell: number,
  mode: ViewMode,
  antiAlias: boolean,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = mapData.width * pixelsPerCell;
  canvas.height = mapData.height * pixelsPerCell;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.imageSmoothingEnabled = antiAlias;

  const provinceToState = new Map<number, number>();
  states.forEach((state) => state.provinces.forEach((pid) => provinceToState.set(pid, state.id)));

  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const pid = mapData.cells[y * mapData.width + x];
      const province = provinces.get(pid);
      let color = province?.color ?? { r: 0, g: 0, b: 0 };
      if (mode === ViewMode.Terrain && province) {
        color = TERRAIN_COLORS[province.terrain] ?? color;
      }
      if (mode === ViewMode.Political) {
        const sid = provinceToState.get(pid);
        const state = sid ? states.get(sid) : undefined;
        const country = state?.owner ? countries.get(state.owner) : undefined;
        color = country?.color ?? { r: 70, g: 70, b: 70 };
      }
      ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
      ctx.fillRect(x * pixelsPerCell, y * pixelsPerCell, pixelsPerCell, pixelsPerCell);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("PNG export failed"));
      else resolve(blob);
    }, "image/png");
  });
}

export function toDefinitionCsv(provinces: Province[]): string {
  const lines = ["id;r;g;b;name;type"];
  for (const p of provinces) {
    lines.push(toCsvRow([p.id, p.color.r, p.color.g, p.color.b, p.name, p.type]));
  }
  return lines.join("\n");
}

export function toStatesCsv(states: State[]): string {
  const lines = ["id;name;category;owner;provinces"];
  for (const s of states) {
    lines.push(toCsvRow([s.id, s.name, s.category, s.owner ?? "", s.provinces.join(",")]));
  }
  return lines.join("\n");
}

export function toCountriesCsv(countries: Country[]): string {
  const lines = ["tag;name;adjective;capital;government;ideology;r;g;b"];
  for (const c of countries) {
    lines.push(toCsvRow([c.tag, c.name, c.adjective, c.capitalProvince, c.government, c.ideology, c.color.r, c.color.g, c.color.b]));
  }
  return lines.join("\n");
}

export function toAdjacenciesCsv(adjacencies: ProjectData["adjacencies"]): string {
  const lines = ["from;to;type;through;comment"];
  for (const a of adjacencies) {
    lines.push(toCsvRow([a.from, a.to, a.type, a.through, a.comment]));
  }
  return lines.join("\n");
}