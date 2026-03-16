const PREFIXES = [
  "Val",
  "Kro",
  "Ast",
  "Bel",
  "Cor",
  "Dor",
  "El",
  "Fal",
  "Gor",
  "Hal",
  "Kal",
  "Lor",
  "Mar",
  "Nor",
  "Ost",
  "Rav",
  "Sol",
  "Tar",
  "Var",
  "Wes",
  "Zen",
];

const MIDDLES = ["do", "na", "ra", "le", "va", "si", "ta", "ne", "or", "in", "al", "ur"];

const SUFFIXES = [
  "ria",
  "heim",
  "ford",
  "burg",
  "land",
  "vale",
  "shire",
  "mark",
  "berg",
  "haven",
  "port",
  "moor",
  "polis",
  "oria",
  "istan",
];

const SEA_NAMES = [
  "North Sea",
  "South Ocean",
  "Bay of Storms",
  "Western Deep",
  "Coral Straits",
  "Frozen Sea",
  "Silver Sound",
];

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

export function generateProvinceName(seed: number, sea: boolean): string {
  const random = createSeededRandom(seed);
  if (sea) {
    return pick(SEA_NAMES, random);
  }
  return `${pick(PREFIXES, random)}${pick(MIDDLES, random)}${pick(SUFFIXES, random)}`;
}

export function generateStateName(base: string): string {
  const endings = [" State", " Region", " Province", " Territory"];
  const index = Math.abs(base.length) % endings.length;
  return `${base}${endings[index]}`;
}

export function generateCountryName(seed: number): { name: string; tag: string; adjective: string } {
  const random = createSeededRandom(seed + 3000);
  const base = `${pick(PREFIXES, random)}${pick(SUFFIXES, random)}`;
  const letters = base.replace(/[^A-Za-z]/g, "").toUpperCase();
  const tag = (letters.slice(0, 3) || "CNT").padEnd(3, "X");
  return {
    name: base,
    tag,
    adjective: `${base}an`,
  };
}