import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Country } from "@/types";
import { GovernmentType, IdeologyType } from "@/types/enums";
import { generateUniqueColor } from "@/algorithms/colorGenerator";

interface CountryStore {
  countries: Map<string, Country>;
  addCountry: (tag?: string, name?: string) => Country;
  updateCountry: (tag: string, updates: Partial<Country>) => void;
  setCountries: (countries: Country[]) => void;
}

export const useCountryStore = create<CountryStore>()(
  immer((set, get) => ({
    countries: new Map<string, Country>(),
    addCountry: (tag, name) => {
      const currentSize = get().countries.size + 1;
      const safeTag = tag ?? `C${String(currentSize).padStart(2, "0")}X`;
      const c: Country = {
        tag: safeTag,
        name: name ?? `Country ${currentSize}`,
        adjective: "National",
        capitalProvince: 1,
        government: GovernmentType.Democracy,
        ideology: IdeologyType.Democratic,
        culture: "Common",
        religion: "Secular",
        color: generateUniqueColor(currentSize + 2000, []),
        secondaryColor: generateUniqueColor(currentSize + 2100, []),
        stability: 50,
        warSupport: 50,
        politicalPower: 100,
        partyPopularity: { democratic: 60, neutral: 20, communist: 10, fascist: 10 },
        manpowerPool: 50000,
        armyExperience: 0,
        navyExperience: 0,
        airExperience: 0,
        faction: null,
        allies: [],
        enemies: [],
        puppets: [],
        overlord: null,
        states: [],
        flagBase64: null,
      };
      set((state) => {
        state.countries.set(c.tag, c);
      });
      return c;
    },
    updateCountry: (tag, updates) => {
      set((state) => {
        const existing = state.countries.get(tag);
        if (!existing) return;
        state.countries.set(tag, { ...existing, ...updates });
      });
    },
    setCountries: (countries) => {
      set((state) => {
        state.countries = new Map(countries.map((c) => [c.tag, c]));
      });
    },
  })),
);