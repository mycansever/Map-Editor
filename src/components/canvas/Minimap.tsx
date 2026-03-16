import { useEffect, useRef } from "react";
import type { Country, Province, State } from "@/types";
import { ViewMode } from "@/types/enums";
import { TERRAIN_COLORS } from "@/utils/constants";

interface MinimapProps {
  width: number;
  height: number;
  cells: Uint32Array;
  provinces: Map<number, Province>;
  states: Map<number, State>;
  countries: Map<string, Country>;
  viewMode: ViewMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  mainCanvasWidth: number;
  mainCanvasHeight: number;
  onNavigate: (mapX: number, mapY: number) => void;
}

const MINIMAP_WIDTH = 220;
const MINIMAP_HEIGHT = 160;

export function Minimap(props: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#121525";
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    const provinceToState = new Map<number, number>();
    props.states.forEach((state) => state.provinces.forEach((id) => provinceToState.set(id, state.id)));

    for (let py = 0; py < MINIMAP_HEIGHT; py++) {
      for (let px = 0; px < MINIMAP_WIDTH; px++) {
        const mapX = Math.floor((px / MINIMAP_WIDTH) * props.width);
        const mapY = Math.floor((py / MINIMAP_HEIGHT) * props.height);
        const pid = props.cells[mapY * props.width + mapX] ?? 0;
        const province = props.provinces.get(pid);
        let color = province?.color ?? { r: 20, g: 20, b: 30 };
        if (province && props.viewMode === ViewMode.Terrain) {
          color = TERRAIN_COLORS[province.terrain] ?? color;
        }
        if (props.viewMode === ViewMode.Political) {
          const sid = provinceToState.get(pid);
          const countryTag = sid ? props.states.get(sid)?.owner : null;
          color = countryTag ? props.countries.get(countryTag)?.color ?? color : { r: 88, g: 88, b: 88 };
        }
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }

    const viewLeftMap = -props.offsetX / props.zoom;
    const viewTopMap = -props.offsetY / props.zoom;
    const viewWidthMap = props.mainCanvasWidth / props.zoom;
    const viewHeightMap = props.mainCanvasHeight / props.zoom;
    const vx = (viewLeftMap / props.width) * MINIMAP_WIDTH;
    const vy = (viewTopMap / props.height) * MINIMAP_HEIGHT;
    const vw = (viewWidthMap / props.width) * MINIMAP_WIDTH;
    const vh = (viewHeightMap / props.height) * MINIMAP_HEIGHT;

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
    ctx.fillRect(vx, vy, vw, vh);
    ctx.strokeRect(vx, vy, vw, vh);
  }, [props]);

  const navigateFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const px = clientX - bounds.left;
    const py = clientY - bounds.top;
    const mapX = (px / MINIMAP_WIDTH) * props.width;
    const mapY = (py / MINIMAP_HEIGHT) * props.height;
    props.onNavigate(mapX, mapY);
  };

  return (
    <canvas
      ref={canvasRef}
      width={MINIMAP_WIDTH}
      height={MINIMAP_HEIGHT}
      className="h-40 w-[220px] cursor-pointer rounded border border-slate-700/80 bg-slate-950"
      onMouseDown={(event) => navigateFromPointer(event.clientX, event.clientY)}
      onMouseMove={(event) => {
        if ((event.buttons & 1) !== 1) return;
        navigateFromPointer(event.clientX, event.clientY);
      }}
    />
  );
}