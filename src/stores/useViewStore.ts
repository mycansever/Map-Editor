import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Coordinate } from "@/types";
import { ViewMode } from "@/types/enums";

interface ViewStore {
  zoom: number;
  offsetX: number;
  offsetY: number;
  cursor: Coordinate | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  setCursor: (coord: Coordinate | null) => void;
  handleWheelZoom: (deltaY: number, mouseX: number, mouseY: number) => void;
  panBy: (dx: number, dy: number) => void;
  zoomToFit: (mapWidth: number, mapHeight: number, canvasWidth: number, canvasHeight: number) => void;
}

export const useViewStore = create<ViewStore>()(
  immer((set, get) => ({
    zoom: 6,
    offsetX: 16,
    offsetY: 16,
    cursor: null,
    viewMode: ViewMode.Province,
    setViewMode: (mode) => set((state) => void (state.viewMode = mode)),
    setZoom: (zoom) => set((state) => void (state.zoom = Math.max(2, Math.min(40, zoom)))),
    setOffset: (x, y) =>
      set((state) => {
        state.offsetX = x;
        state.offsetY = y;
      }),
    setCursor: (coord) => set((state) => void (state.cursor = coord)),
    handleWheelZoom: (deltaY, mouseX, mouseY) => {
      const state = get();
      const factor = 1.12;
      let newZoom = deltaY < 0 ? state.zoom * factor : state.zoom / factor;
      newZoom = Math.max(2, Math.min(40, newZoom));
      const mapX = (mouseX - state.offsetX) / state.zoom;
      const mapY = (mouseY - state.offsetY) / state.zoom;
      const newOffsetX = mouseX - mapX * newZoom;
      const newOffsetY = mouseY - mapY * newZoom;
      set((draft) => {
        draft.zoom = newZoom;
        draft.offsetX = newOffsetX;
        draft.offsetY = newOffsetY;
      });
    },
    panBy: (dx, dy) =>
      set((state) => {
        state.offsetX += dx;
        state.offsetY += dy;
      }),
    zoomToFit: (mapWidth, mapHeight, canvasWidth, canvasHeight) => {
      const zoom = Math.max(2, Math.min(40, Math.min(canvasWidth / mapWidth, canvasHeight / mapHeight) * 0.9));
      set((state) => {
        state.zoom = zoom;
        state.offsetX = (canvasWidth - mapWidth * zoom) / 2;
        state.offsetY = (canvasHeight - mapHeight * zoom) / 2;
      });
    },
  })),
);