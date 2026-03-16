import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { State } from "@/types";
import { StateCategory } from "@/types/enums";
import { generateUniqueColor } from "@/algorithms/colorGenerator";

interface StateStore {
  states: Map<number, State>;
  nextId: number;
  addState: (name?: string) => State;
  updateState: (id: number, updates: Partial<State>) => void;
  addProvinceToState: (stateId: number, provinceId: number) => void;
  removeProvinceFromState: (stateId: number, provinceId: number) => void;
  getStateOfProvince: (provinceId: number) => State | undefined;
  setStates: (states: State[]) => void;
}

export const useStateStore = create<StateStore>()(
  immer((set, get) => ({
    states: new Map<number, State>(),
    nextId: 1,
    addState: (name) => {
      const id = get().nextId;
      const state: State = {
        id,
        name: name ?? `State ${id}`,
        color: generateUniqueColor(id + 1000, []),
        owner: null,
        controller: null,
        cores: [],
        claims: [],
        category: StateCategory.Rural,
        provinces: [],
        capital: 1,
        manpower: 0,
        buildingSlots: 3,
        civilianFactories: 0,
        militaryFactories: 0,
        dockyards: 0,
        refineries: 0,
        silos: 0,
        rocketSites: 0,
        nuclearReactor: 0,
        resources: {},
      };
      set((draft) => {
        draft.states.set(id, state);
        draft.nextId = id + 1;
      });
      return state;
    },
    updateState: (id, updates) => {
      set((state) => {
        const target = state.states.get(id);
        if (!target) return;
        state.states.set(id, { ...target, ...updates });
      });
    },
    addProvinceToState: (stateId, provinceId) => {
      set((state) => {
        const st = state.states.get(stateId);
        if (!st) return;
        if (!st.provinces.includes(provinceId)) st.provinces.push(provinceId);
      });
    },
    removeProvinceFromState: (stateId, provinceId) => {
      set((state) => {
        const st = state.states.get(stateId);
        if (!st) return;
        st.provinces = st.provinces.filter((id) => id !== provinceId);
      });
    },
    getStateOfProvince: (provinceId) => Array.from(get().states.values()).find((s) => s.provinces.includes(provinceId)),
    setStates: (states) => {
      set((draft) => {
        draft.states = new Map(states.map((s) => [s.id, s]));
        draft.nextId = Math.max(...states.map((s) => s.id), 0) + 1;
      });
    },
  })),
);