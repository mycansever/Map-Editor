import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { TerrainType } from "@/types/enums";

interface SettingsStore {
  projectName: string;
  author: string;
  seaLevel: number;
  exportScale: number;
  defaultTerrain: TerrainType;
  setProjectMeta: (name: string, author: string) => void;
  setSeaLevel: (value: number) => void;
  setExportScale: (value: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  immer((set) => ({
    projectName: "Untitled Project",
    author: "",
    seaLevel: 0.35,
    exportScale: 8,
    defaultTerrain: TerrainType.Plains,
    setProjectMeta: (name, author) =>
      set((state) => {
        state.projectName = name;
        state.author = author;
      }),
    setSeaLevel: (value) => set((state) => void (state.seaLevel = value)),
    setExportScale: (value) => set((state) => void (state.exportScale = Math.max(1, Math.min(16, value)))),
  })),
);