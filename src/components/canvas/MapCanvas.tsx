import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapStore } from "@/stores/useMapStore";
import { useProvinceStore } from "@/stores/useProvinceStore";
import { useStateStore } from "@/stores/useStateStore";
import { useCountryStore } from "@/stores/useCountryStore";
import { useToolStore } from "@/stores/useToolStore";
import { useViewStore } from "@/stores/useViewStore";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import type { HistoryChange, RGB } from "@/types";
import { BrushShape, ToolType, ViewMode } from "@/types/enums";
import { OCEAN_PROVINCE_ID, TERRAIN_COLORS } from "@/utils/constants";
import { getBrushOffsets, bresenhamLine } from "@/utils/mathUtils";
import { floodFill } from "@/algorithms/floodFill";
import { rgbToCss } from "@/utils/colorUtils";

interface MapCanvasProps {
  onMapEdited: () => void;
}

export function MapCanvas({ onMapEdited }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPaintPoint, setLastPaintPoint] = useState<{ x: number; y: number } | null>(null);
  const [strokeDiff, setStrokeDiff] = useState<HistoryChange[]>([]);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectCurrent, setRectCurrent] = useState<{ x: number; y: number } | null>(null);

  const map = useMapStore((s) => ({ width: s.width, height: s.height, cells: s.cells }));
  const applyCells = useMapStore((s) => s.setCells);
  const getCell = useMapStore((s) => s.getCell);
  const provinces = useProvinceStore((s) => s.provinces);
  const updateProvince = useProvinceStore((s) => s.updateProvince);
  const states = useStateStore((s) => s.states);
  const addProvinceToState = useStateStore((s) => s.addProvinceToState);
  const removeProvinceFromState = useStateStore((s) => s.removeProvinceFromState);
  const getStateOfProvince = useStateStore((s) => s.getStateOfProvince);
  const updateState = useStateStore((s) => s.updateState);
  const countries = useCountryStore((s) => s.countries);
  const toolState = useToolStore((s) => s);
  const view = useViewStore((s) => s);
  const setViewOffset = useViewStore((s) => s.setOffset);
  const setViewCursor = useViewStore((s) => s.setCursor);
  const wheelZoom = useViewStore((s) => s.handleWheelZoom);
  const selectProvince = useSelectionStore((s) => s.selectProvince);
  const toggleMultiProvince = useSelectionStore((s) => s.toggleMultiProvince);
  const selectedProvinceId = useSelectionStore((s) => s.selectedProvinceId);
  const pushHistory = useHistoryStore((s) => s.pushAction);

  const provinceToState = useMemo(() => {
    const rel = new Map<number, number>();
    states.forEach((st) => st.provinces.forEach((pid) => rel.set(pid, st.id)));
    return rel;
  }, [states]);

  const stateOwner = useMemo(() => {
    const owner = new Map<number, string | null>();
    states.forEach((st) => owner.set(st.id, st.owner));
    return owner;
  }, [states]);

  const screenToGrid = useCallback(
    (sx: number, sy: number) => ({ x: Math.floor((sx - view.offsetX) / view.zoom), y: Math.floor((sy - view.offsetY) / view.zoom) }),
    [view.offsetX, view.offsetY, view.zoom],
  );

  const getColorForCell = useCallback(
    (pid: number): RGB => {
      const p = provinces.get(pid);
      if (!p) return { r: 20, g: 20, b: 35 };
      if (view.viewMode === ViewMode.Province) return p.color;
      if (view.viewMode === ViewMode.Terrain) return TERRAIN_COLORS[p.terrain] ?? p.color;
      if (view.viewMode === ViewMode.State) {
        const sid = provinceToState.get(pid);
        return sid ? states.get(sid)?.color ?? p.color : { r: 60, g: 60, b: 60 };
      }
      if (view.viewMode === ViewMode.Political) {
        const sid = provinceToState.get(pid);
        const owner = sid ? stateOwner.get(sid) : null;
        return owner ? countries.get(owner)?.color ?? p.color : { r: 90, g: 90, b: 90 };
      }
      if (view.viewMode === ViewMode.Population) {
        const t = Math.min(1, p.population / 1000000);
        return { r: Math.floor(255 * t), g: Math.floor(120 * (1 - t)), b: Math.floor(255 * (1 - t)) };
      }
      if (view.viewMode === ViewMode.Development) {
        const t = Math.min(1, p.development / 30);
        return { r: Math.floor(255 * t), g: Math.floor(200 * (1 - t)), b: 80 };
      }
      const resourceTotal = p.resources.reduce((sum, r) => sum + r.amount, 0);
      const t = Math.min(1, resourceTotal / 30);
      return { r: Math.floor(50 + t * 180), g: Math.floor(180 - t * 70), b: Math.floor(70 + t * 80) };
    },
    [countries, provinceToState, provinces, stateOwner, states, view.viewMode],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const startX = Math.max(0, Math.floor(-view.offsetX / view.zoom));
    const startY = Math.max(0, Math.floor(-view.offsetY / view.zoom));
    const endX = Math.min(map.width, Math.ceil((rect.width - view.offsetX) / view.zoom));
    const endY = Math.min(map.height, Math.ceil((rect.height - view.offsetY) / view.zoom));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const pid = map.cells[y * map.width + x];
        const color = getColorForCell(pid);
        ctx.fillStyle = rgbToCss(color);
        ctx.fillRect(Math.floor(view.offsetX + x * view.zoom), Math.floor(view.offsetY + y * view.zoom), Math.ceil(view.zoom), Math.ceil(view.zoom));
      }
    }

    if (view.zoom > 3) {
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const id = map.cells[y * map.width + x];
          const right = x + 1 < map.width ? map.cells[y * map.width + x + 1] : id;
          const down = y + 1 < map.height ? map.cells[(y + 1) * map.width + x] : id;
          if (id !== right) {
            const sx = view.offsetX + (x + 1) * view.zoom;
            const sy = view.offsetY + y * view.zoom;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy + view.zoom);
          }
          if (id !== down) {
            const sx = view.offsetX + x * view.zoom;
            const sy = view.offsetY + (y + 1) * view.zoom;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + view.zoom, sy);
          }
        }
      }
      ctx.stroke();
    }

    if (view.zoom > 6) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = startX; x <= endX; x++) {
        const sx = view.offsetX + x * view.zoom;
        ctx.moveTo(sx, view.offsetY + startY * view.zoom);
        ctx.lineTo(sx, view.offsetY + endY * view.zoom);
      }
      for (let y = startY; y <= endY; y++) {
        const sy = view.offsetY + y * view.zoom;
        ctx.moveTo(view.offsetX + startX * view.zoom, sy);
        ctx.lineTo(view.offsetX + endX * view.zoom, sy);
      }
      ctx.stroke();
    }

    if (selectedProvinceId !== null) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (map.cells[y * map.width + x] !== selectedProvinceId) continue;
          ctx.fillRect(view.offsetX + x * view.zoom, view.offsetY + y * view.zoom, view.zoom, view.zoom);
        }
      }
    }

    if (toolState.activeTool !== ToolType.Select && view.cursor) {
      const grid = screenToGrid(view.cursor.x, view.cursor.y);
      const brushSize = toolState.brushSize;
      const radius = Math.floor(brushSize / 2);
      ctx.strokeStyle = toolState.activeTool === ToolType.Erase ? "rgba(255,100,100,0.8)" : "rgba(255,255,255,0.75)";
      ctx.setLineDash([5, 5]);
      if (toolState.brushShape === BrushShape.Square) {
        ctx.strokeRect(
          view.offsetX + (grid.x - radius) * view.zoom,
          view.offsetY + (grid.y - radius) * view.zoom,
          brushSize * view.zoom,
          brushSize * view.zoom,
        );
      } else {
        const cx = view.offsetX + grid.x * view.zoom + view.zoom / 2;
        const cy = view.offsetY + grid.y * view.zoom + view.zoom / 2;
        const radiusPx = radius * view.zoom + view.zoom / 2;
        if (toolState.brushShape === BrushShape.Circle) {
          ctx.beginPath();
          ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(cx, cy - radiusPx);
          ctx.lineTo(cx + radiusPx, cy);
          ctx.lineTo(cx, cy + radiusPx);
          ctx.lineTo(cx - radiusPx, cy);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    if (rectStart && rectCurrent && toolState.activeTool === ToolType.RectangleSelect) {
      const x = Math.min(rectStart.x, rectCurrent.x);
      const y = Math.min(rectStart.y, rectCurrent.y);
      const w = Math.abs(rectCurrent.x - rectStart.x);
      const h = Math.abs(rectCurrent.y - rectStart.y);
      ctx.fillStyle = "rgba(96,165,250,0.12)";
      ctx.strokeStyle = "rgba(96,165,250,0.9)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }
  }, [getColorForCell, map.cells, map.height, map.width, rectCurrent, rectStart, screenToGrid, selectedProvinceId, toolState.activeTool, toolState.brushShape, toolState.brushSize, view.cursor, view.offsetX, view.offsetY, view.viewMode, view.zoom]);

  const commitStroke = useCallback(
    (actionName: string) => {
      if (strokeDiff.length === 0) return;
      pushHistory({ id: crypto.randomUUID(), timestamp: Date.now(), actionName, cellChanges: strokeDiff });
      setStrokeDiff([]);
      onMapEdited();
    },
    [onMapEdited, pushHistory, strokeDiff],
  );

  const applyBrushAt = useCallback(
    (gx: number, gy: number, targetProvince: number) => {
      const offsets = getBrushOffsets(toolState.brushSize, toolState.brushShape);
      const diff = applyCells(offsets.map((o) => ({ x: gx + o.dx, y: gy + o.dy, provinceId: targetProvince })));
      if (diff.length > 0) {
        setStrokeDiff((prev) => [...prev, ...diff]);
      }
    },
    [applyCells, toolState.brushShape, toolState.brushSize],
  );

  const runToolAt = useCallback(
    (gx: number, gy: number, shift: boolean) => {
      if (gx < 0 || gy < 0 || gx >= map.width || gy >= map.height) return;
      const pid = getCell(gx, gy);
      if (toolState.activeTool === ToolType.Select) {
        if (shift) toggleMultiProvince(pid);
        else selectProvince(pid);
        return;
      }
      if (toolState.activeTool === ToolType.Eyedropper) {
        toolState.setActiveProvinceId(pid);
        toolState.setTool(ToolType.Paint);
        return;
      }
      if (toolState.activeTool === ToolType.Fill) {
        const fillId = toolState.activeProvinceId ?? OCEAN_PROVINCE_ID;
        const mutable = new Uint32Array(map.cells);
        const changes = floodFill(mutable, gx, gy, pid, fillId, { width: map.width, height: map.height });
        if (changes.length > 0) {
          applyCells(changes.map((c) => ({ x: c.index % map.width, y: Math.floor(c.index / map.width), provinceId: c.newValue })));
          pushHistory({ id: crypto.randomUUID(), timestamp: Date.now(), actionName: "Fill", cellChanges: changes });
          onMapEdited();
        }
        return;
      }
      if (toolState.activeTool === ToolType.TerrainPaint) {
        const offsets = getBrushOffsets(toolState.brushSize, toolState.brushShape);
        const touched = new Set<number>();
        offsets.forEach((o) => {
          const id = getCell(gx + o.dx, gy + o.dy);
          if (id > 0) touched.add(id);
        });
        touched.forEach((id) => updateProvince(id, { terrain: toolState.activeTerrainType }));
        return;
      }
      if (toolState.activeTool === ToolType.StatePaint) {
        const stateId = toolState.activeStateId;
        if (!stateId) return;
        if (shift) removeProvinceFromState(stateId, pid);
        else addProvinceToState(stateId, pid);
        return;
      }
      if (toolState.activeTool === ToolType.CountryPaint) {
        const tag = toolState.activeCountryTag;
        if (!tag) return;
        const st = getStateOfProvince(pid);
        if (!st) return;
        updateState(st.id, { owner: tag, controller: tag });
        return;
      }
      if (toolState.activeTool === ToolType.Paint || toolState.activeTool === ToolType.Erase) {
        const paintProvince = toolState.activeTool === ToolType.Erase ? OCEAN_PROVINCE_ID : toolState.activeProvinceId;
        if (!paintProvince) return;
        if (lastPaintPoint) {
          const points = bresenhamLine(lastPaintPoint.x, lastPaintPoint.y, gx, gy);
          points.forEach((point) => applyBrushAt(point.x, point.y, paintProvince));
        } else {
          applyBrushAt(gx, gy, paintProvince);
        }
        setLastPaintPoint({ x: gx, y: gy });
      }
    },
    [addProvinceToState, applyBrushAt, applyCells, getCell, getStateOfProvince, lastPaintPoint, map.cells, map.height, map.width, onMapEdited, pushHistory, removeProvinceFromState, selectProvince, toggleMultiProvince, toolState, updateProvince, updateState],
  );

  const onMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const sx = event.clientX - bounds.left;
    const sy = event.clientY - bounds.top;
    setViewCursor({ x: sx, y: sy });

    if (event.button === 1 || event.altKey || event.button === 2) {
      setIsPanning(true);
      setPanStart({ x: sx, y: sy });
      return;
    }

    if (toolState.activeTool === ToolType.RectangleSelect) {
      setRectStart({ x: sx, y: sy });
      setRectCurrent({ x: sx, y: sy });
      return;
    }

    const grid = screenToGrid(sx, sy);
    setIsPainting(true);
    runToolAt(grid.x, grid.y, event.shiftKey);
  };

  const onMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const sx = event.clientX - bounds.left;
    const sy = event.clientY - bounds.top;
    setViewCursor({ x: sx, y: sy });

    if (isPanning && panStart) {
      setViewOffset(view.offsetX + (sx - panStart.x), view.offsetY + (sy - panStart.y));
      setPanStart({ x: sx, y: sy });
      return;
    }

    if (rectStart && toolState.activeTool === ToolType.RectangleSelect) {
      setRectCurrent({ x: sx, y: sy });
      return;
    }

    if (!isPainting) return;
    if (toolState.activeTool === ToolType.Paint || toolState.activeTool === ToolType.Erase) {
      const grid = screenToGrid(sx, sy);
      runToolAt(grid.x, grid.y, event.shiftKey);
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    if (isPainting) {
      if (toolState.activeTool === ToolType.Paint) commitStroke("Paint");
      if (toolState.activeTool === ToolType.Erase) commitStroke("Erase");
      setLastPaintPoint(null);
    }
    setIsPainting(false);

    if (rectStart && rectCurrent && toolState.activeTool === ToolType.RectangleSelect) {
      const minX = Math.min(rectStart.x, rectCurrent.x);
      const minY = Math.min(rectStart.y, rectCurrent.y);
      const maxX = Math.max(rectStart.x, rectCurrent.x);
      const maxY = Math.max(rectStart.y, rectCurrent.y);
      const g1 = screenToGrid(minX, minY);
      const g2 = screenToGrid(maxX, maxY);
      const ids = new Set<number>();
      for (let y = Math.max(0, g1.y); y <= Math.min(map.height - 1, g2.y); y++) {
        for (let x = Math.max(0, g1.x); x <= Math.min(map.width - 1, g2.x); x++) {
          ids.add(getCell(x, y));
        }
      }
      const first = Array.from(ids)[0] ?? null;
      selectProvince(first);
      Array.from(ids).forEach((id) => toggleMultiProvince(id));
      setRectStart(null);
      setRectCurrent(null);
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#0f0f1a]">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={(event) => {
          event.preventDefault();
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          wheelZoom(event.deltaY, event.clientX - rect.left, event.clientY - rect.top);
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
    </div>
  );
}