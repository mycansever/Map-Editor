import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SelectionStore {
  selectedProvinceId: number | null;
  selectedStateId: number | null;
  selectedCountryTag: string | null;
  multiSelectedProvinces: number[];
  selectProvince: (id: number | null) => void;
  toggleMultiProvince: (id: number) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionStore>()(
  immer((set) => ({
    selectedProvinceId: null,
    selectedStateId: null,
    selectedCountryTag: null,
    multiSelectedProvinces: [],
    selectProvince: (id) =>
      set((state) => {
        state.selectedProvinceId = id;
        if (id === null) state.multiSelectedProvinces = [];
      }),
    toggleMultiProvince: (id) =>
      set((state) => {
        const exists = state.multiSelectedProvinces.includes(id);
        state.multiSelectedProvinces = exists
          ? state.multiSelectedProvinces.filter((p) => p !== id)
          : [...state.multiSelectedProvinces, id];
      }),
    clearSelection: () =>
      set((state) => {
        state.selectedProvinceId = null;
        state.selectedStateId = null;
        state.selectedCountryTag = null;
        state.multiSelectedProvinces = [];
      }),
  })),
);