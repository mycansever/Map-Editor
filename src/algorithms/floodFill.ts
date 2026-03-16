import type { HistoryChange } from "@/types";

interface FillOptions {
  width: number;
  height: number;
  maxCells?: number;
}

export function floodFill(
  cells: Uint32Array,
  startX: number,
  startY: number,
  targetId: number,
  fillId: number,
  options: FillOptions,
): HistoryChange[] {
  if (targetId === fillId) return [];
  const { width, height } = options;
  const maxCells = options.maxCells ?? 250000;
  const stack: number[] = [startY * width + startX];
  const visited = new Set<number>();
  const changes: HistoryChange[] = [];

  while (stack.length > 0 && changes.length < maxCells) {
    const index = stack.pop();
    if (index === undefined || visited.has(index)) continue;
    visited.add(index);

    if (cells[index] !== targetId) continue;
    cells[index] = fillId;
    changes.push({ index, oldValue: targetId, newValue: fillId });

    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) stack.push(index - 1);
    if (x < width - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - width);
    if (y < height - 1) stack.push(index + width);
  }
  return changes;
}