import {
  AdjacencyType,
  BrushShape,
  GovernmentType,
  IdeologyType,
  ProvinceType,
  ResourceType,
  StateCategory,
  TerrainType,
  ViewMode,
} from "./enums";

export type { AdjacencyType, BrushShape, GovernmentType, IdeologyType, ProvinceType, ResourceType, StateCategory, TerrainType, ViewMode };

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MapData {
  width: number;
  height: number;
  cells: Uint32Array;
}

export interface ProvinceResource {
  type: ResourceType;
  amount: number;
}

export interface Province {
  id: number;
  name: string;
  color: RGB;
  type: ProvinceType;
  terrain: TerrainType;
  continent: number;
  coastal: boolean;
  isIsland: boolean;
  manpower: number;
  population: number;
  growthRate: number;
  development: number;
  taxBase: number;
  productionEfficiency: number;
  victoryPoints: number;
  infrastructure: number;
  navalBase: number;
  airBase: number;
  fortLevel: number;
  supplyHub: boolean;
  antiAir: number;
  radar: number;
  resources: ProvinceResource[];
  cellCount: number;
  centroid: Coordinate;
  boundingBox: BoundingBox;
  neighbors: number[];
}

export interface State {
  id: number;
  name: string;
  color: RGB;
  owner: string | null;
  controller: string | null;
  cores: string[];
  claims: string[];
  category: StateCategory;
  provinces: number[];
  capital: number;
  manpower: number;
  buildingSlots: number;
  civilianFactories: number;
  militaryFactories: number;
  dockyards: number;
  refineries: number;
  silos: number;
  rocketSites: number;
  nuclearReactor: number;
  resources: Record<string, number>;
}

export interface Country {
  tag: string;
  name: string;
  adjective: string;
  capitalProvince: number;
  government: GovernmentType;
  ideology: IdeologyType;
  culture: string;
  religion: string;
  color: RGB;
  secondaryColor: RGB;
  stability: number;
  warSupport: number;
  politicalPower: number;
  partyPopularity: Record<string, number>;
  manpowerPool: number;
  armyExperience: number;
  navyExperience: number;
  airExperience: number;
  faction: string | null;
  allies: string[];
  enemies: string[];
  puppets: string[];
  overlord: string | null;
  states: number[];
  flagBase64: string | null;
}

export interface Adjacency {
  from: number;
  to: number;
  type: AdjacencyType;
  through: number;
  comment: string;
}

export interface BrushSettings {
  size: number;
  shape: BrushShape;
}

export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
  viewMode: ViewMode;
}

export interface ExportSettings {
  pixelsPerCell: number;
  antiAlias: boolean;
  borderOverlay: boolean;
  labelOverlay: boolean;
  exportProvincesPng: boolean;
  exportTerrainPng: boolean;
  exportPoliticalPng: boolean;
  exportDefinitionCsv: boolean;
  exportStatesCsv: boolean;
  exportCountriesCsv: boolean;
  exportAdjacenciesCsv: boolean;
  exportProjectJson: boolean;
}

export interface HistoryChange {
  index: number;
  oldValue: number;
  newValue: number;
}

export interface HistoryDiff {
  id: string;
  timestamp: number;
  actionName: string;
  cellChanges: HistoryChange[];
}

export interface ProjectData {
  version: string;
  name: string;
  author: string;
  description: string;
  createdAt: string;
  lastModified: string;
  map: {
    width: number;
    height: number;
    cells: number[];
  };
  provinces: Province[];
  states: State[];
  countries: Country[];
  adjacencies: Adjacency[];
  settings: {
    seaLevel: number;
    defaultTerrain: TerrainType;
    exportScale: number;
    gridColor: string;
    backgroundColor: string;
  };
}