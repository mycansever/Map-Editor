import type { Adjacency, Country, MapData, Province, State } from "@/types";

export interface DiagnosticIssue {
  id: string;
  severity: "error" | "warning" | "info";
  title: string;
  detail: string;
}

export interface ProjectDiagnostics {
  issues: DiagnosticIssue[];
  counts: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export function analyzeProjectData(
  map: MapData,
  provinces: Province[],
  states: State[],
  countries: Country[],
  adjacencies: Adjacency[],
): ProjectDiagnostics {
  const issues: DiagnosticIssue[] = [];
  const provinceIds = new Set(provinces.map((province) => province.id));
  const stateByProvince = new Map<number, State>();
  const countryByTag = new Map(countries.map((country) => [country.tag, country]));

  states.forEach((state) => {
    state.provinces.forEach((provinceId) => {
      if (!stateByProvince.has(provinceId)) stateByProvince.set(provinceId, state);
    });
  });

  const pushIssue = (issue: DiagnosticIssue) => {
    issues.push(issue);
  };

  provinces.forEach((province) => {
    if (province.cellCount === 0) {
      pushIssue({
        id: `province-empty-${province.id}`,
        severity: "warning",
        title: "Province has no cells",
        detail: `${province.name} (#${province.id}) is defined but not painted on the map.`,
      });
    }

    if (!stateByProvince.has(province.id)) {
      pushIssue({
        id: `province-state-${province.id}`,
        severity: "warning",
        title: "Province is not assigned to a state",
        detail: `${province.name} (#${province.id}) is missing a state assignment.`,
      });
    }
  });

  states.forEach((state) => {
    if (!state.owner) {
      pushIssue({
        id: `state-owner-${state.id}`,
        severity: "warning",
        title: "State has no country owner",
        detail: `${state.name} (#${state.id}) does not have an owner country.`,
      });
    }

    state.provinces.forEach((provinceId) => {
      if (!provinceIds.has(provinceId)) {
        pushIssue({
          id: `state-missing-province-${state.id}-${provinceId}`,
          severity: "error",
          title: "State references a missing province",
          detail: `${state.name} (#${state.id}) references province #${provinceId}, but that province does not exist.`,
        });
      }
    });
  });

  countries.forEach((country) => {
    if (!provinceIds.has(country.capitalProvince)) {
      pushIssue({
        id: `country-capital-${country.tag}`,
        severity: "error",
        title: "Country capital province is invalid",
        detail: `${country.name} (${country.tag}) points to missing capital province #${country.capitalProvince}.`,
      });
    }

    country.states.forEach((stateId) => {
      const linkedState = states.find((state) => state.id === stateId);
      if (!linkedState) {
        pushIssue({
          id: `country-state-${country.tag}-${stateId}`,
          severity: "error",
          title: "Country references a missing state",
          detail: `${country.name} (${country.tag}) references state #${stateId}, but that state does not exist.`,
        });
      }
    });
  });

  map.cells.forEach((provinceId, index) => {
    if (!provinceIds.has(provinceId)) {
      pushIssue({
        id: `cell-missing-${index}-${provinceId}`,
        severity: "error",
        title: "Map cell references a missing province",
        detail: `Map cell #${index} uses province id #${provinceId}, but that province is not defined.`,
      });
    }
  });

  const adjacencyKeys = new Set<string>();
  adjacencies.forEach((adjacency, index) => {
    const key = `${Math.min(adjacency.from, adjacency.to)}-${Math.max(adjacency.from, adjacency.to)}`;
    if (adjacencyKeys.has(key)) {
      pushIssue({
        id: `adjacency-duplicate-${index}-${key}`,
        severity: "warning",
        title: "Duplicate adjacency",
        detail: `Adjacency ${adjacency.from} ↔ ${adjacency.to} is duplicated in the project data.`,
      });
    }
    adjacencyKeys.add(key);

    if (!provinceIds.has(adjacency.from) || !provinceIds.has(adjacency.to)) {
      pushIssue({
        id: `adjacency-missing-${index}`,
        severity: "error",
        title: "Adjacency references a missing province",
        detail: `Adjacency ${adjacency.from} ↔ ${adjacency.to} includes a province that is not defined.`,
      });
    }
  });

  states.forEach((state) => {
    if (state.owner && !countryByTag.has(state.owner)) {
      pushIssue({
        id: `state-country-${state.id}`,
        severity: "error",
        title: "State owner country is missing",
        detail: `${state.name} (#${state.id}) points to owner ${state.owner}, but that country does not exist.`,
      });
    }
  });

  const counts = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length,
  };

  return { issues, counts };
}
