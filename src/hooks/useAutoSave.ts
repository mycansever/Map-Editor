import { useEffect } from "react";
import { useMapStore } from "@/stores/useMapStore";
import { useProvinceStore } from "@/stores/useProvinceStore";
import { useStateStore } from "@/stores/useStateStore";
import { useCountryStore } from "@/stores/useCountryStore";
import { useAdjacencyStore } from "@/stores/useAdjacencyStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { buildProjectData } from "@/utils/fileUtils";

const SAVE_KEY = "gse-autosave-v4";

export function useAutoSave(): void {
  useEffect(() => {
    const timer = window.setInterval(() => {
      const map = useMapStore.getState();
      const provinces = Array.from(useProvinceStore.getState().provinces.values());
      const states = Array.from(useStateStore.getState().states.values());
      const countries = Array.from(useCountryStore.getState().countries.values());
      const adjacencies = useAdjacencyStore.getState().adjacencies;
      const settings = useSettingsStore.getState();
      const project = buildProjectData(
        { width: map.width, height: map.height, cells: map.cells },
        provinces,
        states,
        countries,
        adjacencies,
        { name: settings.projectName, author: settings.author },
        settings.exportScale,
      );
      localStorage.setItem(SAVE_KEY, JSON.stringify(project));
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);
}

export function restoreFromAutoSave(): string | null {
  return localStorage.getItem(SAVE_KEY);
}