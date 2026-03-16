import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Adjacency } from "@/types";

interface AdjacencyStore {
  adjacencies: Adjacency[];
  setAdjacencies: (items: Adjacency[]) => void;
}

export const useAdjacencyStore = create<AdjacencyStore>()(
  immer((set) => ({
    adjacencies: [],
    setAdjacencies: (items) => set((state) => void (state.adjacencies = items)),
  })),
);