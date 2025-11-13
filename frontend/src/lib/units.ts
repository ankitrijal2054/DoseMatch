import type { CanonicalUnit } from "./types";

const UNIT_ALIASES: Record<string, CanonicalUnit> = {
  // Each
  tab: "EA",
  tabs: "EA",
  tablet: "EA",
  tablets: "EA",
  cap: "EA",
  caps: "EA",
  capsule: "EA",
  capsules: "EA",
  patch: "EA",
  patches: "EA",
  supp: "EA",
  suppository: "EA",
  suppositories: "EA",
  ea: "EA",
  each: "EA",

  // Volume
  ml: "mL",
  milliliter: "mL",
  milliliters: "mL",
  cc: "mL",

  // Mass
  g: "g",
  gram: "g",
  grams: "g",
  mg: "g", // Will convert with factor

  // Insulin
  u: "U",
  units: "U",
  unit: "U",
  iu: "U",

  // Inhalers
  puff: "actuations",
  puffs: "actuations",
  actuation: "actuations",
  inhalation: "actuations",
  inhalations: "actuations",
};

export function normalizeUnit(raw: string): CanonicalUnit {
  const cleaned = raw.toLowerCase().trim();
  return UNIT_ALIASES[cleaned] || "EA"; // Default to EA
}

export function toCanonical(
  amount: number,
  fromUnit: string,
  strength?: { mgPerMl?: number; mgPerG?: number }
): { amount: number; unit: CanonicalUnit } {
  const canonical = normalizeUnit(fromUnit);

  // Handle mg -> g conversion
  if (fromUnit.toLowerCase() === "mg") {
    return { amount: amount / 1000, unit: "g" };
  }

  // Handle liquid volumes with mg/mL strength
  if (canonical === "mL" && strength?.mgPerMl) {
    // Keep in mL for volume-based dosing
    return { amount, unit: "mL" };
  }

  return { amount, unit: canonical };
}

export function unitsMatch(
  unit1: string | CanonicalUnit,
  unit2: string | CanonicalUnit
): boolean {
  const normalized1 = normalizeUnit(String(unit1));
  const normalized2 = normalizeUnit(String(unit2));
  return normalized1 === normalized2;
}

export { UNIT_ALIASES };
