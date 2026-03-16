import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Province, RGB } from "@/types";
import { ProvinceType, TerrainType } from "@/types/enums";
import { generateUniqueColor } from "@/algorithms/colorGenerator";
import { OCEAN_COLOR, OCEAN_PROVINCE_ID } from "@/utils/constants";

interface ProvinceStore {
  provinces: Map<number, Province>;
  nextId: number;
  addProvince: (name?: string) => Province;
  updateProvince: (id: number, updates: Partial<Province>) => void;
  setProvinces: (provinces: Province[]) => void;
  removeProvince: (id: number) => void;
  getProvinceArray: () => Province[];
}

function baseProvince(id: number, name: string, color: RGB): Province {
  return {
    id,
    name,
    color,
    type: ProvinceType.Land,
    terrain: TerrainType.Plains,
    continent: 0,
    coastal: false,
    isIsland: false,
    manpower: 10000,
    population: 100000,
    growthRate: 1,
    development: 4,
    taxBase: 25,
    productionEfficiency: 40,
    victoryPoints: 0,
    infrastructure: 1,
    navalBase: 0,
    airBase: 0,
    fortLevel: 0,
    supplyHub: false,
    antiAir: 0,
    radar: 0,
    resources: [],
    cellCount: 0,
    centroid: { x: 0, y: 0 },
    boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    neighbors: [],
  };
}

export const useProvinceStore = create<ProvinceStore>()(
  immer((set, get) => ({
    provinces: new Map<number, Province>([
      [
        OCEAN_PROVINCE_ID,
        {
          ...baseProvince(OCEAN_PROVINCE_ID, "Ocean", OCEAN_COLOR),
          type: ProvinceType.Sea,
          terrain: TerrainType.Ocean,
          population: 0,
          manpower: 0,
        },
      ],
    ]),
    nextId: 2,
    addProvince: (name) => {
      const state = get();
      const color = generateUniqueColor(state.nextId, Array.from(state.provinces.values()).map((p) => p.color));
      const province = baseProvince(state.nextId, name ?? `Province ${state.nextId}`, color);
      set((draft) => {
        draft.provinces.set(draft.nextId, province);
        draft.nextId += 1;
      });
      return province;
    },
    updateProvince: (id, updates) => {
      set((state) => {
        const current = state.provinces.get(id);
        if (!current) return;
        state.provinces.set(id, { ...current, ...updates });
      });
    },
    setProvinces: (provinces) => {
      set((state) => {
        state.provinces = new Map<number, Province>(provinces.map((p) => [p.id, p]));
        state.nextId = Math.max(...provinces.map((p) => p.id), 1) + 1;
      });
    },
    removeProvince: (id) => {
      if (id === OCEAN_PROVINCE_ID) return;
      set((state) => {
        state.provinces.delete(id);
      });
    },
    getProvinceArray: () => Array.from(get().provinces.values()),
  })),
);