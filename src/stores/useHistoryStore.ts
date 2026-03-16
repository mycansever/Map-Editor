import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { HistoryDiff } from "@/types";
import { MAX_HISTORY } from "@/utils/constants";

interface HistoryStore {
  undoStack: HistoryDiff[];
  redoStack: HistoryDiff[];
  pushAction: (diff: HistoryDiff) => void;
  undo: () => HistoryDiff | null;
  redo: () => HistoryDiff | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    undoStack: [],
    redoStack: [],
    pushAction: (diff) => {
      if (diff.cellChanges.length === 0) return;
      set((state) => {
        state.undoStack.push(diff);
        if (state.undoStack.length > MAX_HISTORY) {
          state.undoStack.shift();
        }
        state.redoStack = [];
      });
    },
    undo: () => {
      const stack = get().undoStack;
      if (stack.length === 0) return null;
      const item = stack[stack.length - 1] ?? null;
      set((state) => {
        if (item) {
          state.undoStack.pop();
          state.redoStack.push(item);
        }
      });
      return item;
    },
    redo: () => {
      const stack = get().redoStack;
      if (stack.length === 0) return null;
      const item = stack[stack.length - 1] ?? null;
      set((state) => {
        if (item) {
          state.redoStack.pop();
          state.undoStack.push(item);
        }
      });
      return item;
    },
    clear: () =>
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      }),
  })),
);