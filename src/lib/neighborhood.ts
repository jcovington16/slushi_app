const suffixes: Record<string, string> = {
  st: "street",
  street: "street",
  ave: "avenue",
  av: "avenue",
  avenue: "avenue",
  rd: "road",
  road: "road",
  dr: "drive",
  drive: "drive",
  ln: "lane",
  lane: "lane",
  ct: "court",
  court: "court",
  cir: "circle",
  circle: "circle",
  blvd: "boulevard",
  boulevard: "boulevard",
  pkwy: "parkway",
  parkway: "parkway",
  way: "way",
  pl: "place",
  place: "place"
};

export const neighborhoodOnlyMessage =
  "Sorry, Slushi Squad is only delivering in our neighborhood right now.";

export function normalizeStreetName(streetName: string) {
  return streetName
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => suffixes[part] ?? part)
    .join(" ");
}

export function isAllowedStreet(streetName: string, allowedStreetNames: string[]) {
  const normalized = normalizeStreetName(streetName);
  return allowedStreetNames
    .map(normalizeStreetName)
    .some((allowed) => allowed === normalized);
}

export function parseAllowedStreets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}
