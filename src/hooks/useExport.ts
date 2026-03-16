import { useCallback } from "react";
import { toast } from "sonner";
import { useMapStore } from "@/stores/useMapStore";
import { useProvinceStore } from "@/stores/useProvinceStore";
import { useStateStore } from "@/stores/useStateStore";
import { useCountryStore } from "@/stores/useCountryStore";
import { useAdjacencyStore } from "@/stores/useAdjacencyStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { ExportSettings, ProjectData } from "@/types";
import { ViewMode } from "@/types/enums";
import {
  buildProjectData,
  downloadBlob,
  downloadText,
  exportPng,
  toAdjacenciesCsv,
  toCountriesCsv,
  toDefinitionCsv,
  toStatesCsv,
} from "@/utils/fileUtils";

export function useExport() {
  return useCallback(async (settings: ExportSettings) => {
    const map = useMapStore.getState();
    const provinceMap = useProvinceStore.getState().provinces;
    const stateMap = useStateStore.getState().states;
    const countryMap = useCountryStore.getState().countries;
    const adjacencies = useAdjacencyStore.getState().adjacencies;
    const meta = useSettingsStore.getState();

    if (settings.exportProvincesPng) {
      const blob = await exportPng(
        { width: map.width, height: map.height, cells: map.cells },
        provinceMap,
        stateMap,
        countryMap,
        settings.pixelsPerCell,
        ViewMode.Province,
        false,
      );
      downloadBlob("provinces.png", blob);
    }

    if (settings.exportTerrainPng) {
      const blob = await exportPng(
        { width: map.width, height: map.height, cells: map.cells },
        provinceMap,
        stateMap,
        countryMap,
        settings.pixelsPerCell,
        ViewMode.Terrain,
        settings.antiAlias,
      );
      downloadBlob("terrain.png", blob);
    }

    if (settings.exportPoliticalPng) {
      const blob = await exportPng(
        { width: map.width, height: map.height, cells: map.cells },
        provinceMap,
        stateMap,
        countryMap,
        settings.pixelsPerCell,
        ViewMode.Political,
        settings.antiAlias,
      );
      downloadBlob("political.png", blob);
    }

    const provinces = Array.from(provinceMap.values());
    const states = Array.from(stateMap.values());
    const countries = Array.from(countryMap.values());

    if (settings.exportDefinitionCsv) downloadText("definition.csv", toDefinitionCsv(provinces));
    if (settings.exportStatesCsv) downloadText("states.csv", toStatesCsv(states));
    if (settings.exportCountriesCsv) downloadText("countries.csv", toCountriesCsv(countries));
    if (settings.exportAdjacenciesCsv) downloadText("adjacencies.csv", toAdjacenciesCsv(adjacencies));
    if (settings.exportProjectJson) {
      const project: ProjectData = buildProjectData(
        { width: map.width, height: map.height, cells: map.cells },
        provinces,
        states,
        countries,
        adjacencies,
        { name: meta.projectName, author: meta.author },
        meta.exportScale,
      );
      downloadText(`${meta.projectName.replace(/\s+/g, "_")}.gse.json`, JSON.stringify(project, null, 2));
    }
    toast.success("Export completed");
  }, []);
}