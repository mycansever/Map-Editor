import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { BrushShape, TerrainType, ToolType } from "@/types/enums";
import { DEFAULT_BRUSH, DEFAULT_TOOL } from "@/utils/constants";

interface ToolStore {
  activeTool: ToolType;
  brushSize: number;
  brushShape: BrushShape;
  activeProvinceId: number | null;
  activeStateId: number | null;
  activeCountryTag: string | null;
  activeTerrainType: TerrainType;
  setTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setBrushShape: (shape: BrushShape) => void;
  increaseBrushSize: () => void;
  decreaseBrushSize: () => void;
  setActiveProvinceId: (id: number | null) => void;
  setActiveStateId: (id: number | null) => void;
  setActiveCountryTag: (tag: string | null) => void;
  setActiveTerrainType: (terrain: TerrainType) => void;
}

export const useToolStore = create<ToolStore>()(
  immer((set) => ({
    activeTool: DEFAULT_TOOL,
    brushSize: DEFAULT_BRUSH.size,
    brushShape: DEFAULT_BRUSH.shape,
    activeProvinceId: null,
    activeStateId: null,
    activeCountryTag: null,
    activeTerrainType: TerrainType.Plains,
    setTool: (tool) => set((state) => void (state.activeTool = tool)),
    setBrushSize: (size) => set((state) => void (state.brushSize = Math.max(1, Math.min(10, size)))),
    setBrushShape: (shape) => set((state) => void (state.brushShape = shape)),
    increaseBrushSize: () => set((state) => void (state.brushSize = Math.min(10, state.brushSize + 1))),
    decreaseBrushSize: () => set((state) => void (state.brushSize = Math.max(1, state.brushSize - 1))),
    setActiveProvinceId: (id) => set((state) => void (state.activeProvinceId = id)),
    setActiveStateId: (id) => set((state) => void (state.activeStateId = id)),
    setActiveCountryTag: (tag) => set((state) => void (state.activeCountryTag = tag)),
    setActiveTerrainType: (terrain) => set((state) => void (state.activeTerrainType = terrain)),
  })),
);