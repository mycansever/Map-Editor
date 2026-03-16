import { useEffect } from "react";
import { useToolStore } from "@/stores/useToolStore";
import { ToolType, ViewMode } from "@/types/enums";
import { useHistoryStore } from "@/stores/useHistoryStore";

interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onNew: () => void;
  onOpen: () => void;
  onExport: () => void;
  onAddBookmark: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const setTool = useToolStore((s) => s.setTool);
  const setViewMode = useViewStoreSelector((state) => state.setViewMode);
  const increaseBrush = useToolStore((s) => s.increaseBrushSize);
  const decreaseBrush = useToolStore((s) => s.decreaseBrushSize);
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();

      if (event.ctrlKey || event.metaKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            if (canRedo) handlers.onRedo();
          } else if (canUndo) {
            handlers.onUndo();
          }
          return;
        }
        if (key === "y") {
          event.preventDefault();
          if (canRedo) handlers.onRedo();
          return;
        }
        if (key === "s") {
          event.preventDefault();
          handlers.onSave();
          return;
        }
        if (key === "n") {
          event.preventDefault();
          handlers.onNew();
          return;
        }
        if (key === "o") {
          event.preventDefault();
          handlers.onOpen();
          return;
        }
        if (key === "b") {
          event.preventDefault();
          handlers.onAddBookmark();
          return;
        }
        if (key === "e" && event.shiftKey) {
          event.preventDefault();
          handlers.onExport();
        }
      }

      const toolMap: Record<string, ToolType> = {
        v: ToolType.Select,
        b: ToolType.Paint,
        e: ToolType.Erase,
        g: ToolType.Fill,
        i: ToolType.Eyedropper,
        t: ToolType.TerrainPaint,
        s: ToolType.StatePaint,
        c: ToolType.CountryPaint,
        m: ToolType.RectangleSelect,
      };
      if (toolMap[key]) {
        setTool(toolMap[key]);
      }
      if (event.key === "[") decreaseBrush();
      if (event.key === "]") increaseBrush();
      if (event.key === "F1") setViewMode(ViewMode.Province);
      if (event.key === "F2") setViewMode(ViewMode.Political);
      if (event.key === "F3") setViewMode(ViewMode.Terrain);
      if (event.key === "F4") setViewMode(ViewMode.State);
      if (event.key === "F5") setViewMode(ViewMode.Population);
      if (event.key === "F6") setViewMode(ViewMode.Development);
      if (event.key === "F7") setViewMode(ViewMode.Resource);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRedo, canUndo, decreaseBrush, handlers, increaseBrush, setTool, setViewMode]);
}

import { useViewStore } from "@/stores/useViewStore";

function useViewStoreSelector<T>(selector: (state: ReturnType<typeof useViewStore.getState>) => T): T {
  return useViewStore(selector);
}