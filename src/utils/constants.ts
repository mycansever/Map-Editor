import { BrushShape, TerrainType, ToolType, ViewMode } from "@/types/enums";
import type { ExportSettings, RGB } from "@/types";

export const DEFAULT_MAP_WIDTH = 120;
export const DEFAULT_MAP_HEIGHT = 80;
export const OCEAN_PROVINCE_ID = 1;
export const MAX_HISTORY = 30;

export const DEFAULT_VIEW_MODE = ViewMode.Province;
export const DEFAULT_TOOL = ToolType.Select;
export const DEFAULT_BRUSH = { size: 2, shape: BrushShape.Circle };

export const OCEAN_COLOR: RGB = { r: 30, g: 75, b: 140 };

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  pixelsPerCell: 8,
  antiAlias: false,
  borderOverlay: false,
  labelOverlay: false,
  exportProvincesPng: true,
  exportTerrainPng: true,
  exportPoliticalPng: true,
  exportDefinitionCsv: true,
  exportStatesCsv: true,
  exportCountriesCsv: true,
  exportAdjacenciesCsv: true,
  exportProjectJson: true,
};

export const TERRAIN_COLORS: Record<TerrainType, RGB> = {
  [TerrainType.Plains]: { r: 144, g: 190, b: 109 },
  [TerrainType.Forest]: { r: 34, g: 120, b: 51 },
  [TerrainType.Hills]: { r: 153, g: 143, b: 100 },
  [TerrainType.Mountain]: { r: 139, g: 119, b: 101 },
  [TerrainType.Desert]: { r: 222, g: 202, b: 148 },
  [TerrainType.Marsh]: { r: 107, g: 142, b: 120 },
  [TerrainType.Jungle]: { r: 22, g: 91, b: 42 },
  [TerrainType.Urban]: { r: 169, g: 169, b: 169 },
  [TerrainType.Ocean]: { r: 30, g: 75, b: 140 },
  [TerrainType.Coastal]: { r: 60, g: 120, b: 180 },
  [TerrainType.Arctic]: { r: 220, g: 235, b: 245 },
  [TerrainType.Savanna]: { r: 195, g: 175, b: 100 },
  [TerrainType.Steppe]: { r: 180, g: 170, b: 110 },
  [TerrainType.Farmland]: { r: 160, g: 200, b: 80 },
  [TerrainType.Tundra]: { r: 170, g: 190, b: 180 },
  [TerrainType.DeepOcean]: { r: 15, g: 40, b: 100 },
};

export const HOTKEY_HELP = "V/B/E/G/I/T/S/C/M tools, [ ] brush, Ctrl+Z/Y undo-redo";