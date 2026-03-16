import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH, OCEAN_PROVINCE_ID } from "@/utils/constants";

interface CellChange {
  x: number;
  y: number;
  provinceId: number;
}

interface MapStore {
  width: number;
  height: number;
  cells: Uint32Array;
  initializeMap: (width: number, height: number) => void;
  setCell: (x: number, y: number, provinceId: number) => { index: number; oldValue: number; newValue: number } | null;
  setCells: (changes: CellChange[]) => Array<{ index: number; oldValue: number; newValue: number }>;
  getCell: (x: number, y: number) => number;
  setRawMap: (width: number, height: number, cells: Uint32Array) => void;
}

function buildDefaultCells(width: number, height: number): Uint32Array {
  const cells = new Uint32Array(width * height);
  cells.fill(OCEAN_PROVINCE_ID);
  return cells;
}

export const useMapStore = create<MapStore>()(
  immer((set, get) => ({
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
    cells: buildDefaultCells(DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT),
    initializeMap: (width, height) => {
      set((state) => {
        state.width = width;
        state.height = height;
        state.cells = buildDefaultCells(width, height);
      });
    },
    setCell: (x, y, provinceId) => {
      const { width, height, cells } = get();
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const index = y * width + x;
      const oldValue = cells[index] ?? 0;
      if (oldValue === provinceId) return null;
      set((state) => {
        state.cells[index] = provinceId;
      });
      return { index, oldValue, newValue: provinceId };
    },
    setCells: (changes) => {
      const { width, height, cells } = get();
      const diff: Array<{ index: number; oldValue: number; newValue: number }> = [];
      set((state) => {
        for (const change of changes) {
          if (change.x < 0 || change.y < 0 || change.x >= width || change.y >= height) continue;
          const index = change.y * width + change.x;
          const oldValue = cells[index] ?? 0;
          if (oldValue === change.provinceId) continue;
          state.cells[index] = change.provinceId;
          diff.push({ index, oldValue, newValue: change.provinceId });
        }
      });
      return diff;
    },
    getCell: (x, y) => {
      const { width, height, cells } = get();
      if (x < 0 || y < 0 || x >= width || y >= height) return 0;
      return cells[y * width + x] ?? 0;
    },
    setRawMap: (width, height, cells) => {
      set((state) => {
        state.width = width;
        state.height = height;
        state.cells = cells;
      });
    },
  })),
);