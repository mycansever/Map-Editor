import type { Country, MapData, Province, State } from "@/types";
import { GovernmentType, IdeologyType, ProvinceType, StateCategory, TerrainType } from "@/types/enums";
import { OCEAN_COLOR, OCEAN_PROVINCE_ID } from "@/utils/constants";
import { generateUniqueColor } from "./colorGenerator";
import { createSeededRandom, generateCountryName, generateProvinceName, generateStateName } from "@/data/nameGenerator";

interface RandomGenInput {
  width: number;
  height: number;
  provinceCount: number;
  countryCount: number;
  seaRatio: number;
  seed: number;
}

interface SeedPoint {
  id: number;
  x: number;
  y: number;
  sea: boolean;
}

export interface RandomGenResult {
  map: MapData;
  provinces: Province[];
  states: State[];
  countries: Country[];
}

function terrainByRandom(rand: number, sea: boolean): TerrainType {
  if (sea) {
    return rand < 0.4 ? TerrainType.Ocean : TerrainType.DeepOcean;
  }
  if (rand < 0.12) return TerrainType.Desert;
  if (rand < 0.26) return TerrainType.Hills;
  if (rand < 0.42) return TerrainType.Forest;
  if (rand < 0.56) return TerrainType.Farmland;
  if (rand < 0.68) return TerrainType.Savanna;
  if (rand < 0.8) return TerrainType.Plains;
  if (rand < 0.9) return TerrainType.Marsh;
  return TerrainType.Mountain;
}

export function generateRandomMap(input: RandomGenInput): RandomGenResult {
  const random = createSeededRandom(input.seed);
  const width = Math.max(20, Math.min(500, input.width));
  const height = Math.max(20, Math.min(500, input.height));
  const provinceCount = Math.max(20, Math.min(3500, input.provinceCount));
  const cells = new Uint32Array(width * height);
  const seeds: SeedPoint[] = [{ id: OCEAN_PROVINCE_ID, x: 0, y: 0, sea: true }];
  const usedColors = [OCEAN_COLOR];

  for (let i = 0; i < provinceCount; i++) {
    const sea = random() < input.seaRatio;
    seeds.push({ id: i + 2, x: Math.floor(random() * width), y: Math.floor(random() * height), sea });
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let bestId = OCEAN_PROVINCE_ID;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 1; i < seeds.length; i++) {
        const s = seeds[i];
        const dx = x - s.x;
        const dy = y - s.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestId = s.id;
        }
      }
      cells[y * width + x] = bestId;
    }
  }

  const provinces = new Map<number, Province>();
  provinces.set(OCEAN_PROVINCE_ID, {
    id: OCEAN_PROVINCE_ID,
    name: "Ocean",
    color: OCEAN_COLOR,
    type: ProvinceType.Sea,
    terrain: TerrainType.Ocean,
    continent: 0,
    coastal: false,
    isIsland: false,
    manpower: 0,
    population: 0,
    growthRate: 0,
    development: 1,
    taxBase: 0,
    productionEfficiency: 0,
    victoryPoints: 0,
    infrastructure: 0,
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

  for (const seed of seeds.slice(1)) {
    const color = seed.sea ? OCEAN_COLOR : generateUniqueColor(seed.id, usedColors);
    if (!seed.sea) usedColors.push(color);
    const terrain = terrainByRandom(random(), seed.sea);
    const population = seed.sea ? 0 : Math.floor(50000 + random() * 420000);
    provinces.set(seed.id, {
      id: seed.id,
      name: generateProvinceName(seed.id + input.seed, seed.sea),
      color,
      type: seed.sea ? ProvinceType.Sea : ProvinceType.Land,
      terrain,
      continent: Math.floor(random() * 4),
      coastal: false,
      isIsland: false,
      manpower: Math.floor(population * 0.1),
      population,
      growthRate: Number((random() * 2.4 - 0.4).toFixed(2)),
      development: seed.sea ? 1 : Math.floor(2 + random() * 9),
      taxBase: Math.floor(random() * 50),
      productionEfficiency: Math.floor(20 + random() * 70),
      victoryPoints: seed.sea ? 0 : Math.floor(random() * 6),
      infrastructure: seed.sea ? 0 : Math.floor(random() * 6),
      navalBase: seed.sea ? 1 : Math.floor(random() * 3),
      airBase: seed.sea ? 0 : Math.floor(random() * 3),
      fortLevel: seed.sea ? 0 : Math.floor(random() * 3),
      supplyHub: random() > 0.92,
      antiAir: Math.floor(random() * 3),
      radar: Math.floor(random() * 3),
      resources: [],
      cellCount: 0,
      centroid: { x: 0, y: 0 },
      boundingBox: { minX: width, minY: height, maxX: 0, maxY: 0 },
      neighbors: [],
    });
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = cells[y * width + x];
      const province = provinces.get(id);
      if (!province) continue;
      province.cellCount += 1;
      province.centroid.x += x;
      province.centroid.y += y;
      province.boundingBox.minX = Math.min(province.boundingBox.minX, x);
      province.boundingBox.minY = Math.min(province.boundingBox.minY, y);
      province.boundingBox.maxX = Math.max(province.boundingBox.maxX, x);
      province.boundingBox.maxY = Math.max(province.boundingBox.maxY, y);
      if (province.type === ProvinceType.Land) {
        const nearSea = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height && provinces.get(cells[ny * width + nx])?.type === ProvinceType.Sea);
        province.coastal ||= nearSea;
      }
    }
  }

  const finalizedProvinces = Array.from(provinces.values()).map((p) => {
    if (p.cellCount > 0) {
      p.centroid.x /= p.cellCount;
      p.centroid.y /= p.cellCount;
    }
    return p;
  });

  const landProvinceIds = finalizedProvinces.filter((p) => p.type === ProvinceType.Land).map((p) => p.id);
  const states: State[] = [];
  const stateCount = Math.max(4, Math.floor(landProvinceIds.length / 6));
  for (let i = 0; i < stateCount; i++) {
    const group = landProvinceIds.filter((_, idx) => idx % stateCount === i);
    if (group.length === 0) continue;
    const first = provinces.get(group[0]);
    if (!first) continue;
    states.push({
      id: i + 1,
      name: generateStateName(first.name),
      color: generateUniqueColor(i + 5000, []),
      owner: null,
      controller: null,
      cores: [],
      claims: [],
      category: group.length >= 8 ? StateCategory.City : StateCategory.Rural,
      provinces: group,
      capital: group[0],
      manpower: group.reduce((sum, pid) => sum + (provinces.get(pid)?.manpower ?? 0), 0),
      buildingSlots: Math.min(25, Math.max(3, group.length + 2)),
      civilianFactories: Math.floor(random() * 3),
      militaryFactories: Math.floor(random() * 3),
      dockyards: Math.floor(random() * 2),
      refineries: 0,
      silos: 0,
      rocketSites: 0,
      nuclearReactor: 0,
      resources: {},
    });
  }

  const countries: Country[] = [];
  const count = Math.max(2, Math.min(input.countryCount, states.length));
  for (let i = 0; i < count; i++) {
    const info = generateCountryName(i + input.seed * 7);
    countries.push({
      tag: `${info.tag[0]}${info.tag[1]}${String.fromCharCode(65 + (i % 26))}`,
      name: info.name,
      adjective: info.adjective,
      capitalProvince: states[i]?.capital ?? landProvinceIds[0] ?? OCEAN_PROVINCE_ID,
      government: GovernmentType.Democracy,
      ideology: IdeologyType.Democratic,
      culture: "Common",
      religion: "Secular",
      color: generateUniqueColor(i + 9000, []),
      secondaryColor: generateUniqueColor(i + 9010, []),
      stability: 55,
      warSupport: 50,
      politicalPower: 100,
      partyPopularity: { democratic: 50, neutral: 20, communist: 15, fascist: 15 },
      manpowerPool: 100000,
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
    });
  }

  states.forEach((state, idx) => {
    const owner = countries[idx % countries.length];
    state.owner = owner.tag;
    state.controller = owner.tag;
    owner.states.push(state.id);
  });

  return {
    map: { width, height, cells },
    provinces: finalizedProvinces,
    states,
    countries,
  };
}