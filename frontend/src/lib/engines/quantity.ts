import type { NormalizedSig } from "../types";

/**
 * Calculates total quantity needed based on dosing instructions
 *
 * Formula: totalUnits = ceil(amountPerDose × frequencyPerDay × daysSupply)
 *
 * Examples:
 * - 500mg, 2x/day, 10 days → ceil(500 × 2 × 10) = 10,000 mg
 * - 1 tablet, 3x/day, 7 days → ceil(1 × 3 × 7) = 21 tablets
 * - 5 mL, 4x/day, 14 days → ceil(5 × 4 × 14) = 280 mL
 *
 * @param normalizedSig - Parsed prescription with dose, frequency, and days supply
 * @returns Total quantity needed (rounded up to nearest unit)
 * @throws Error if input values are invalid
 */
export function computeTotalUnits(normalizedSig: NormalizedSig): number {
  const { amountPerDose, frequencyPerDay, daysSupply } = normalizedSig;

  // Validate inputs
  if (amountPerDose <= 0) {
    throw new Error(
      `Invalid amountPerDose: ${amountPerDose}. Must be positive.`
    );
  }
  if (frequencyPerDay <= 0) {
    throw new Error(
      `Invalid frequencyPerDay: ${frequencyPerDay}. Must be positive.`
    );
  }
  if (daysSupply <= 0) {
    throw new Error(`Invalid daysSupply: ${daysSupply}. Must be positive.`);
  }

  // Calculate total units needed
  const totalUnits = Math.ceil(amountPerDose * frequencyPerDay * daysSupply);

  // Sanity check: ensure result is reasonable (max 1 million units as safety limit)
  if (totalUnits > 1_000_000) {
    throw new Error(
      `Calculated quantity (${totalUnits}) exceeds safety limit of 1,000,000 units. ` +
        `Check input values: dose=${amountPerDose}, freq=${frequencyPerDay}, days=${daysSupply}`
    );
  }

  return totalUnits;
}

/**
 * Alternative: computeTotalUnitsWithDefault
 * Returns total units with fallback to 0 if calculation fails
 *
 * @param normalizedSig - Parsed prescription
 * @returns Total quantity needed, or 0 if calculation fails
 */
export function computeTotalUnitsWithDefault(
  normalizedSig: NormalizedSig
): number {
  try {
    return computeTotalUnits(normalizedSig);
  } catch {
    return 0;
  }
}
