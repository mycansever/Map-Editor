import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Brush,
  Eraser,
  Flag,
  FolderOpen,
  GanttChartSquare,
  MapPinned,
  Pickaxe,
  Pipette,
  Save,
  Search,
  Settings2,
  Shuffle,
  SquareDashedMousePointer,
  Undo2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { MapCanvas } from "@/components/canvas/MapCanvas";
import { Minimap } from "@/components/canvas/Minimap";
import { useMapStore } from "@/stores/useMapStore";
import { useProvinceStore } from "@/stores/useProvinceStore";
import { useStateStore } from "@/stores/useStateStore";
import { useCountryStore } from "@/stores/useCountryStore";
import { useToolStore } from "@/stores/useToolStore";
import { useViewStore } from "@/stores/useViewStore";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useAdjacencyStore } from "@/stores/useAdjacencyStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { restoreFromAutoSave, useAutoSave } from "@/hooks/useAutoSave";
import { useExport } from "@/hooks/useExport";
import { calculateAdjacencies } from "@/algorithms/adjacencyCalculator";
import { recomputeProvinceGeography } from "@/algorithms/mapAnalysis";
import { generateRandomMap } from "@/algorithms/randomMapGenerator";
import { OCEAN_PROVINCE_ID } from "@/utils/constants";
import { buildProjectData, downloadText } from "@/utils/fileUtils";
import type { ExportSettings, ProjectData, Province } from "@/types";
import { BrushShape, ProvinceType, TerrainType, ToolType, ViewMode } from "@/types/enums";

type SideTab = "province" | "state" | "country" | "stats" | "history" | "bookmarks";

function cloneProvince(p: Province): Province {
  return {
    ...p,
    color: { ...p.color },
    centroid: { ...p.centroid },
    boundingBox: { ...p.boundingBox },
    neighbors: [...p.neighbors],
    resources: p.resources.map((r) => ({ ...r })),
  };
}

export function App() {
  const map = useMapStore((s) => ({ width: s.width, height: s.height, cells: s.cells }));
  const initializeMap = useMapStore((s) => s.initializeMap);
  const setRawMap = useMapStore((s) => s.setRawMap);
  const setCells = useMapStore((s) => s.setCells);

  const provinces = useProvinceStore((s) => s.provinces);
  const addProvince = useProvinceStore((s) => s.addProvince);
  const updateProvince = useProvinceStore((s) => s.updateProvince);
  const setProvinces = useProvinceStore((s) => s.setProvinces);
  const removeProvince = useProvinceStore((s) => s.removeProvince);

  const states = useStateStore((s) => s.states);
  const addState = useStateStore((s) => s.addState);
  const setStates = useStateStore((s) => s.setStates);
  const updateState = useStateStore((s) => s.updateState);
  const countries = useCountryStore((s) => s.countries);
  const addCountry = useCountryStore((s) => s.addCountry);
  const setCountries = useCountryStore((s) => s.setCountries);

  const tool = useToolStore((s) => s);
  const view = useViewStore((s) => s);
  const setZoom = useViewStore((s) => s.setZoom);
  const setOffset = useViewStore((s) => s.setOffset);
  const zoomToFit = useViewStore((s) => s.zoomToFit);
  const selection = useSelectionStore((s) => s);

  const undoStack = useHistoryStore((s) => s.undoStack);
  const redoStack = useHistoryStore((s) => s.redoStack);
  const undoAction = useHistoryStore((s) => s.undo);
  const redoAction = useHistoryStore((s) => s.redo);
  const clearHistory = useHistoryStore((s) => s.clear);

  const setAdjacencies = useAdjacencyStore((s) => s.setAdjacencies);
  const adjacencies = useAdjacencyStore((s) => s.adjacencies);
  const settings = useSettingsStore((s) => s);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const runExport = useExport();
  useAutoSave();

  const [activeTab, setActiveTab] = useState<SideTab>("province");
  const [search, setSearch] = useState("");
  const [rightPanelWidth] = useState(320);
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showOpenAutoSave, setShowOpenAutoSave] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; provinceId: number } | null>(null);
  const [randomConfig, setRandomConfig] = useState({ width: 220, height: 140, provinceCount: 420, countryCount: 8, seaRatio: 0.4, seed: 42 });
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
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
  });

  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);

  const provinceArray = useMemo(() => Array.from(provinces.values()), [provinces]);
  const stateArray = useMemo(() => Array.from(states.values()), [states]);
  const countryArray = useMemo(() => Array.from(countries.values()), [countries]);

  const selectedProvince = selection.selectedProvinceId ? provinces.get(selection.selectedProvinceId) ?? null : null;

  const recomputeDerived = () => {
    const currentMap = useMapStore.getState();
    const clonedProvinces = Array.from(useProvinceStore.getState().provinces.values()).map(cloneProvince);
    const provinceMap = new Map(clonedProvinces.map((p) => [p.id, p]));
    recomputeProvinceGeography({ width: currentMap.width, height: currentMap.height, cells: currentMap.cells }, provinceMap);
    setProvinces(Array.from(provinceMap.values()));
    setAdjacencies(calculateAdjacencies({ width: currentMap.width, height: currentMap.height, cells: currentMap.cells }, provinceMap));
  };

  const applyHistoryDiff = (mode: "undo" | "redo") => {
    const diff = mode === "undo" ? undoAction() : redoAction();
    if (!diff) return;
    const current = useMapStore.getState();
    const next = new Uint32Array(current.cells);
    for (const change of diff.cellChanges) {
      next[change.index] = mode === "undo" ? change.oldValue : change.newValue;
    }
    setRawMap(current.width, current.height, next);
    recomputeDerived();
  };

  const newProject = () => {
    const width = Number(window.prompt("Map width (20-500)", "120") ?? "120");
    const height = Number(window.prompt("Map height (20-500)", "80") ?? "80");
    const safeW = Math.max(20, Math.min(500, Number.isFinite(width) ? width : 120));
    const safeH = Math.max(20, Math.min(500, Number.isFinite(height) ? height : 80));
    initializeMap(safeW, safeH);
    const ocean = provinces.get(OCEAN_PROVINCE_ID);
    if (ocean) setProvinces([cloneProvince(ocean)]);
    setStates([]);
    setCountries([]);
    clearHistory();
    setAdjacencies([]);
    toast.success("New project created");
    window.setTimeout(() => zoomToFit(safeW, safeH, mapViewportRef.current?.clientWidth ?? 800, mapViewportRef.current?.clientHeight ?? 500), 10);
  };

  const saveProject = () => {
    const data = buildProjectData(
      { width: map.width, height: map.height, cells: map.cells },
      provinceArray,
      stateArray,
      countryArray,
      adjacencies,
      { name: settings.projectName, author: settings.author },
      settings.exportScale,
    );
    downloadText(`${settings.projectName.replace(/\s+/g, "_")}.gse.json`, JSON.stringify(data, null, 2));
    toast.success("Project saved");
  };

  const loadProjectData = (data: ProjectData) => {
    setRawMap(data.map.width, data.map.height, new Uint32Array(data.map.cells));
    setProvinces(data.provinces.map(cloneProvince));
    setStates(data.states);
    setCountries(data.countries);
    setAdjacencies(data.adjacencies);
    settings.setProjectMeta(data.name, data.author);
    settings.setExportScale(Math.max(8, data.settings.exportScale));
    clearHistory();
    toast.success("Project loaded");
    window.setTimeout(() => zoomToFit(data.map.width, data.map.height, mapViewportRef.current?.clientWidth ?? 800, mapViewportRef.current?.clientHeight ?? 500), 10);
  };

  const openProject = () => projectInputRef.current?.click();

  const runRandomGeneration = async () => {
    setGenerationProgress(5);
    setGenerationStatus("Heightmap and terrain...");
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    setGenerationProgress(35);
    setGenerationStatus("Generating provinces...");
    const result = generateRandomMap(randomConfig);
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    setGenerationProgress(70);
    setGenerationStatus("Building states and countries...");
    setRawMap(result.map.width, result.map.height, result.map.cells);
    setProvinces(result.provinces.map(cloneProvince));
    setStates(result.states);
    setCountries(result.countries);
    setAdjacencies(calculateAdjacencies(result.map, new Map(result.provinces.map((p) => [p.id, p]))));
    clearHistory();
    setGenerationProgress(100);
    setGenerationStatus("Done");
    toast.success(`Random map generated: ${result.provinces.length} provinces`);
    window.setTimeout(() => {
      setShowRandomDialog(false);
      setGenerationProgress(0);
      setGenerationStatus("");
      zoomToFit(result.map.width, result.map.height, mapViewportRef.current?.clientWidth ?? 800, mapViewportRef.current?.clientHeight ?? 500);
    }, 260);
  };

  const importFromImage = async (file: File) => {
    const bitmap = await createImageBitmap(file);
    const width = Math.min(500, Math.max(20, bitmap.width));
    const height = Math.min(500, Math.max(20, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;

    const colorToProvince = new Map<string, number>();
    const importedProvinces: Province[] = [];
    const cells = new Uint32Array(width * height);
    let nextId = 2;

    const ocean = provinces.get(OCEAN_PROVINCE_ID);
    if (ocean) importedProvinces.push(cloneProvince(ocean));

    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4] ?? 0;
      const g = data[i * 4 + 1] ?? 0;
      const b = data[i * 4 + 2] ?? 0;
      const key = `${r},${g},${b}`;
      if (!colorToProvince.has(key)) {
        const pid = nextId++;
        colorToProvince.set(key, pid);
        const type = b > r + 24 && b > g + 24 ? ProvinceType.Sea : ProvinceType.Land;
        importedProvinces.push({
          id: pid,
          name: `Imported ${pid}`,
          color: { r, g, b },
          type,
          terrain: type === ProvinceType.Sea ? TerrainType.Ocean : TerrainType.Plains,
          continent: 0,
          coastal: false,
          isIsland: false,
          manpower: 20000,
          population: type === ProvinceType.Sea ? 0 : 120000,
          growthRate: 1,
          development: 3,
          taxBase: 20,
          productionEfficiency: 30,
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
          boundingBox: { minX: width, minY: height, maxX: 0, maxY: 0 },
          neighbors: [],
        });
      }
      cells[i] = colorToProvince.get(key) ?? OCEAN_PROVINCE_ID;
    }

    setRawMap(width, height, cells);
    setProvinces(importedProvinces);
    setStates([]);
    setCountries([]);
    clearHistory();
    recomputeDerived();
    toast.success(`Image imported: ${colorToProvince.size} provinces`);
  };

  const quickProvince = () => {
    const province = addProvince();
    tool.setActiveProvinceId(province.id);
    tool.setTool(ToolType.Paint);
    toast.success(`Ready to paint ${province.name}`);
  };

  const focusProvince = (provinceId: number) => {
    const province = provinces.get(provinceId);
    if (!province) return;
    selection.selectProvince(provinceId);
    const viewport = mapViewportRef.current;
    if (!viewport) return;
    const targetZoom = Math.max(8, view.zoom);
    setZoom(targetZoom);
    setOffset(viewport.clientWidth / 2 - province.centroid.x * targetZoom, viewport.clientHeight / 2 - province.centroid.y * targetZoom);
  };

  useEffect(() => {
    const autosave = restoreFromAutoSave();
    if (autosave) setShowOpenAutoSave(true);
  }, []);

  useKeyboardShortcuts({
    onUndo: () => applyHistoryDiff("undo"),
    onRedo: () => applyHistoryDiff("redo"),
    onSave: saveProject,
    onNew: newProject,
    onOpen: openProject,
    onExport: () => setShowExportDialog(true),
    onAddBookmark: () => addBookmark(`Bookmark ${bookmarks.length + 1}`, view.offsetX, view.offsetY, view.zoom),
  });

  const filteredProvinces = provinceArray.filter((province) => province.name.toLowerCase().includes(search.toLowerCase()));

  const stats = useMemo(() => {
    const land = provinceArray.filter((p) => p.type === ProvinceType.Land).length;
    const sea = provinceArray.filter((p) => p.type === ProvinceType.Sea).length;
    const totalPopulation = provinceArray.reduce((sum, p) => sum + p.population, 0);
    const totalManpower = provinceArray.reduce((sum, p) => sum + p.manpower, 0);
    const avgDev = provinceArray.length > 0 ? provinceArray.reduce((sum, p) => sum + p.development, 0) / provinceArray.length : 0;
    return { land, sea, totalPopulation, totalManpower, avgDev };
  }, [provinceArray]);

  const estimatedExportMB = Math.round((map.width * map.height * Math.max(8, exportSettings.pixelsPerCell) * Math.max(8, exportSettings.pixelsPerCell) * 4) / 1024 / 1024);

  return (
    <div className="h-screen bg-[#0f0f1a] text-slate-100">
      <Toaster theme="dark" richColors position="top-right" />
      <input
        ref={projectInputRef}
        type="file"
        accept=".json,.gse.json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const parsed = JSON.parse(text) as ProjectData;
            loadProjectData(parsed);
          } catch {
            toast.error("Invalid project file");
          }
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/bmp"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await importFromImage(file);
        }}
      />

      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-[#15172a] px-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GanttChartSquare className="h-4 w-4 text-blue-400" />
          <span>Grand Strategy Game Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={newProject}><BookOpen className="h-4 w-4" />New</button>
          <button className="btn" onClick={openProject}><FolderOpen className="h-4 w-4" />Open</button>
          <button className="btn" onClick={saveProject}><Save className="h-4 w-4" />Save</button>
          <button className="btn" onClick={() => setShowExportDialog(true)}><Upload className="h-4 w-4" />Export</button>
          <button className="btn" disabled={undoStack.length === 0} onClick={() => applyHistoryDiff("undo")}><Undo2 className="h-4 w-4" />Undo</button>
          <button className="btn" disabled={redoStack.length === 0} onClick={() => applyHistoryDiff("redo")}>Redo</button>
          <button className="btn-primary" onClick={() => setShowRandomDialog(true)}><Shuffle className="h-4 w-4" />One-Click Generate</button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-5.5rem)]">
        <aside className="w-60 border-r border-slate-800 bg-[#121427] p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Tools</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ t: ToolType.Select, i: SquareDashedMousePointer }, { t: ToolType.Paint, i: Brush }, { t: ToolType.Erase, i: Eraser }, { t: ToolType.Fill, i: Pickaxe }, { t: ToolType.Eyedropper, i: Pipette }, { t: ToolType.TerrainPaint, i: MapPinned }, { t: ToolType.StatePaint, i: Settings2 }, { t: ToolType.CountryPaint, i: Flag }].map((entry) => (
              <button key={entry.t} className={`tool-btn ${tool.activeTool === entry.t ? "tool-btn-active" : ""}`} onClick={() => tool.setTool(entry.t)}>
                <entry.i className="h-4 w-4" />
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs uppercase tracking-wide text-slate-400">Brush</p>
          <input type="range" min={1} max={10} value={tool.brushSize} onChange={(e) => tool.setBrushSize(Number(e.target.value))} className="w-full" />
          <div className="mt-2 flex gap-2">
            {[BrushShape.Circle, BrushShape.Square, BrushShape.Diamond].map((shape) => (
              <button key={shape} className={`btn flex-1 ${tool.brushShape === shape ? "border-blue-500 text-blue-300" : ""}`} onClick={() => tool.setBrushShape(shape)}>{shape}</button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs uppercase tracking-wide text-slate-400">View</p>
          <select value={view.viewMode} onChange={(e) => view.setViewMode(e.target.value as ViewMode)} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
            {Object.values(ViewMode).map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

          <p className="mb-2 mt-4 text-xs uppercase tracking-wide text-slate-400">Active Targets</p>
          <button className="btn w-full" onClick={quickProvince}><WandSparkles className="h-4 w-4" />Quick Province</button>
          <select value={tool.activeProvinceId ?? ""} onChange={(e) => tool.setActiveProvinceId(Number(e.target.value) || null)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
            <option value="">Paint province</option>
            {provinceArray.map((province) => (
              <option key={province.id} value={province.id}>{province.name} #{province.id}</option>
            ))}
          </select>
          <select value={tool.activeStateId ?? ""} onChange={(e) => tool.setActiveStateId(Number(e.target.value) || null)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
            <option value="">State target</option>
            {stateArray.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
          <select value={tool.activeCountryTag ?? ""} onChange={(e) => tool.setActiveCountryTag(e.target.value || null)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
            <option value="">Country target</option>
            {countryArray.map((country) => (
              <option key={country.tag} value={country.tag}>{country.name}</option>
            ))}
          </select>
          <select value={tool.activeTerrainType} onChange={(e) => tool.setActiveTerrainType(e.target.value as TerrainType)} className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm">
            {Object.values(TerrainType).map((terrain) => (
              <option key={terrain} value={terrain}>{terrain}</option>
            ))}
          </select>

          <button className="btn mt-3 w-full" onClick={() => imageInputRef.current?.click()}>Import PNG</button>
        </aside>

        <main ref={mapViewportRef} className="relative flex-1">
          <MapCanvas
            onMapEdited={recomputeDerived}
            onContextMenuRequest={(payload) => {
              setContextMenu({ x: payload.screenX, y: payload.screenY, provinceId: payload.provinceId });
            }}
          />
          <div className="absolute bottom-3 right-3">
            <Minimap
              width={map.width}
              height={map.height}
              cells={map.cells}
              provinces={provinces}
              states={states}
              countries={countries}
              viewMode={view.viewMode}
              zoom={view.zoom}
              offsetX={view.offsetX}
              offsetY={view.offsetY}
              mainCanvasWidth={mapViewportRef.current?.clientWidth ?? 800}
              mainCanvasHeight={mapViewportRef.current?.clientHeight ?? 500}
              onNavigate={(mapX, mapY) => {
                const viewport = mapViewportRef.current;
                if (!viewport) return;
                setOffset(viewport.clientWidth / 2 - mapX * view.zoom, viewport.clientHeight / 2 - mapY * view.zoom);
              }}
            />
          </div>
        </main>

        <aside style={{ width: rightPanelWidth }} className="border-l border-slate-800 bg-[#121427]">
          <div className="flex border-b border-slate-800 text-xs">
            {(["province", "state", "country", "stats", "history", "bookmarks"] as SideTab[]).map((tab) => (
              <button key={tab} className={`flex-1 px-1 py-2 uppercase ${activeTab === tab ? "bg-slate-800 text-blue-300" : "text-slate-400"}`} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>

          <div className="h-[calc(100%-2rem)] overflow-y-auto p-3 text-sm">
            {(activeTab === "province" || activeTab === "state" || activeTab === "country") && (
              <div>
                <label className="mb-2 flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-2 py-1">
                  <Search className="h-3 w-3" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search province" className="w-full bg-transparent outline-none" />
                </label>
              </div>
            )}

            {activeTab === "province" && (
              <div className="space-y-3">
                {selectedProvince && (
                  <div className="rounded border border-slate-700 bg-slate-900/70 p-2">
                    <p className="font-semibold">{selectedProvince.name} #{selectedProvince.id}</p>
                    <label className="mt-2 block text-xs text-slate-400">Name</label>
                    <input className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1" value={selectedProvince.name} onChange={(e) => updateProvince(selectedProvince.id, { name: e.target.value })} />
                    <label className="mt-2 block text-xs text-slate-400">Development</label>
                    <input type="range" min={1} max={30} value={selectedProvince.development} onChange={(e) => updateProvince(selectedProvince.id, { development: Number(e.target.value) })} className="w-full" />
                  </div>
                )}

                {filteredProvinces.slice(0, 140).map((province) => (
                  <button key={province.id} className="flex w-full items-center justify-between rounded border border-slate-700 bg-slate-900 px-2 py-1 text-left hover:border-slate-500" onClick={() => focusProvince(province.id)}>
                    <span>{province.name}</span>
                    <span className="text-xs text-slate-400">#{province.id}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "state" && (
              <div className="space-y-2">
                <button className="btn w-full" onClick={() => addState()}>Create State</button>
                {stateArray.map((state) => (
                  <div key={state.id} className="rounded border border-slate-700 bg-slate-900 px-2 py-1">
                    <p className="font-medium">{state.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{state.provinces.length} provinces</span>
                      <select value={state.owner ?? ""} onChange={(e) => updateState(state.id, { owner: e.target.value || null, controller: e.target.value || null })} className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5">
                        <option value="">Unowned</option>
                        {countryArray.map((country) => <option key={country.tag} value={country.tag}>{country.tag}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "country" && (
              <div className="space-y-2">
                <button className="btn w-full" onClick={() => addCountry()}>Create Country</button>
                {countryArray.map((country) => (
                  <div key={country.tag} className="rounded border border-slate-700 bg-slate-900 px-2 py-1">
                    <p className="font-medium">{country.name} ({country.tag})</p>
                    <p className="text-xs text-slate-400">States: {country.states.length}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-1 text-sm">
                <p>Map: {map.width} x {map.height} ({map.width * map.height} cells)</p>
                <p>Provinces: {provinceArray.length}</p>
                <p>Land: {stats.land} | Sea: {stats.sea}</p>
                <p>States: {stateArray.length}</p>
                <p>Countries: {countryArray.length}</p>
                <p>Adjacencies: {adjacencies.length}</p>
                <p>Total Population: {Math.round(stats.totalPopulation / 1_000_000)}M</p>
                <p>Total Manpower: {Math.round(stats.totalManpower / 1_000_000)}M</p>
                <p>Average Dev: {stats.avgDev.toFixed(2)}</p>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-1">
                {undoStack.slice().reverse().map((item) => (
                  <div key={item.id} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs">
                    {item.actionName} - {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "bookmarks" && (
              <div className="space-y-2">
                <button className="btn w-full" onClick={() => addBookmark(`Bookmark ${bookmarks.length + 1}`, view.offsetX, view.offsetY, view.zoom)}>Save Current View</button>
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs">
                    <button onClick={() => { setOffset(bookmark.offsetX, bookmark.offsetY); setZoom(bookmark.zoom); }}>{bookmark.name}</button>
                    <button className="text-red-300" onClick={() => removeBookmark(bookmark.id)}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <footer className="flex h-8 items-center justify-between border-t border-slate-800 bg-[#15172a] px-3 text-xs text-slate-300">
        <div>Zoom: {view.zoom.toFixed(1)}x | Cursor: {view.cursor ? `${Math.floor((view.cursor.x - view.offsetX) / view.zoom)}, ${Math.floor((view.cursor.y - view.offsetY) / view.zoom)}` : "-"} | Tool: {tool.activeTool}</div>
        <div>{settings.projectName} | Autosave every 30s</div>
      </footer>

      {contextMenu && (
        <div className="fixed z-30 w-44 rounded border border-slate-700 bg-slate-900 p-1 text-sm" style={{ left: contextMenu.x + 2, top: contextMenu.y + 2 }} onMouseLeave={() => setContextMenu(null)}>
          <button className="menu-item" onClick={() => { selection.selectProvince(contextMenu.provinceId); setContextMenu(null); }}>Select Province</button>
          <button className="menu-item" onClick={() => { tool.setActiveProvinceId(contextMenu.provinceId); tool.setTool(ToolType.Paint); setContextMenu(null); }}>Paint With This</button>
          <button className="menu-item" onClick={() => { focusProvince(contextMenu.provinceId); setContextMenu(null); }}>Zoom To Province</button>
          <button
            className="menu-item text-red-300"
            onClick={() => {
              const targetId = contextMenu.provinceId;
              const changes: Array<{ x: number; y: number; provinceId: number }> = [];
              for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                  if (map.cells[y * map.width + x] === targetId) changes.push({ x, y, provinceId: OCEAN_PROVINCE_ID });
                }
              }
              setCells(changes);
              removeProvince(targetId);
              recomputeDerived();
              setContextMenu(null);
            }}
          >
            Delete Province
          </button>
        </div>
      )}

      {showRandomDialog && (
        <div className="modal-wrap">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold">One-Click Random Generation</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <label>Width<input type="number" min={20} max={500} value={randomConfig.width} onChange={(e) => setRandomConfig((s) => ({ ...s, width: Number(e.target.value) }))} className="field" /></label>
              <label>Height<input type="number" min={20} max={500} value={randomConfig.height} onChange={(e) => setRandomConfig((s) => ({ ...s, height: Number(e.target.value) }))} className="field" /></label>
              <label>Province Count<input type="number" min={50} max={3000} value={randomConfig.provinceCount} onChange={(e) => setRandomConfig((s) => ({ ...s, provinceCount: Number(e.target.value) }))} className="field" /></label>
              <label>Country Count<input type="number" min={2} max={50} value={randomConfig.countryCount} onChange={(e) => setRandomConfig((s) => ({ ...s, countryCount: Number(e.target.value) }))} className="field" /></label>
              <label>Sea Ratio<input type="range" min={0.1} max={0.8} step={0.01} value={randomConfig.seaRatio} onChange={(e) => setRandomConfig((s) => ({ ...s, seaRatio: Number(e.target.value) }))} className="field" /></label>
              <label>Seed<input type="number" value={randomConfig.seed} onChange={(e) => setRandomConfig((s) => ({ ...s, seed: Number(e.target.value) }))} className="field" /></label>
            </div>
            {generationProgress > 0 && (
              <div className="mt-3 text-sm">
                <p>{generationStatus}</p>
                <div className="mt-1 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-blue-500" style={{ width: `${generationProgress}%` }} /></div>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setShowRandomDialog(false)}>Cancel</button>
              <button className="btn-primary" onClick={runRandomGeneration}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div className="modal-wrap">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold">Export</h2>
            <p className="mt-1 text-sm text-slate-400">provinces.png will always use at least 8 pixels per cell. Estimated provinces file: ~{estimatedExportMB} MB</p>
            <label className="mt-3 block text-sm">Pixels per cell (8-16)
              <input type="range" min={8} max={16} value={exportSettings.pixelsPerCell} onChange={(e) => setExportSettings((s) => ({ ...s, pixelsPerCell: Number(e.target.value) }))} className="field" />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {([
                "exportProvincesPng",
                "exportTerrainPng",
                "exportPoliticalPng",
                "exportDefinitionCsv",
                "exportStatesCsv",
                "exportCountriesCsv",
                "exportAdjacenciesCsv",
                "exportProjectJson",
              ] as const).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={exportSettings[key]} onChange={(e) => setExportSettings((s) => ({ ...s, [key]: e.target.checked }))} />
                  {key}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setShowExportDialog(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await runExport({ ...exportSettings, pixelsPerCell: Math.max(8, exportSettings.pixelsPerCell), antiAlias: false });
                  setShowExportDialog(false);
                }}
              >
                Export Files
              </button>
            </div>
          </div>
        </div>
      )}

      {showOpenAutoSave && (
        <div className="modal-wrap">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold">Restore Last Session?</h2>
            <p className="mt-2 text-sm text-slate-400">Autosave data was found in this browser.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setShowOpenAutoSave(false)}>Ignore</button>
              <button
                className="btn-primary"
                onClick={() => {
                  const raw = restoreFromAutoSave();
                  if (!raw) return;
                  try {
                    loadProjectData(JSON.parse(raw) as ProjectData);
                  } catch {
                    toast.error("Autosave is corrupted");
                  }
                  setShowOpenAutoSave(false);
                }}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
