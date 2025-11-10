import type { Warning, Recommendation, NdcRecord } from "../types";

/**
 * Generate warnings based on recommendation and NDC data
 * Checks for:
 * - Inactive NDCs
 * - High overfill
 * - Underfill
 * - No exact match
 */
export function generateWarnings(
  recommendation: Recommendation,
  allNdcs: NdcRecord[]
): Warning[] {
  const warnings: Warning[] = [];

  // Check for inactive NDCs in recommended pack
  if (recommendation.recommended.status === "INACTIVE") {
    warnings.push({
      code: "INACTIVE_NDC_RECOMMENDED",
      message: `⚠️ Recommended NDC ${recommendation.recommended.ndc} is marked INACTIVE. Verify product availability before dispensing.`,
      severity: "warning",
    });
  }

  // Check if any alternatives are inactive
  const inactiveCount = allNdcs.filter((n) => n.status === "INACTIVE").length;
  if (inactiveCount > 0 && recommendation.recommended.status === "ACTIVE") {
    warnings.push({
      code: "INACTIVE_NDCS_PRESENT",
      message: `ℹ️ ${inactiveCount} inactive NDC(s) found in database. Showing active alternatives when available.`,
      severity: "info",
    });
  }

  // Check for no exact match
  if (recommendation.recommended.matchType !== "EXACT") {
    warnings.push({
      code: "NO_EXACT_MATCH",
      message: `ℹ️ No exact package size match found. Recommendation uses ${recommendation.recommended.matchType.toLowerCase()} strategy.`,
      severity: "info",
    });
  }

  // Check for significant overfill (>20%)
  if (recommendation.recommended.overfillPercent > 20) {
    warnings.push({
      code: "HIGH_OVERFILL",
      message: `⚠️ Recommended package results in ${recommendation.recommended.overfillPercent.toFixed(
        1
      )}% overfill (${recommendation.recommended.totalDispensed} units vs. ${
        recommendation.recommended.totalDispensed -
        (recommendation.recommended.totalDispensed *
          recommendation.recommended.overfillPercent) /
          100
      } target). Consider splitting prescription if appropriate.`,
      severity: "warning",
    });
  }

  // Check for underfill (patient may need refill sooner)
  if (recommendation.recommended.underfillPercent > 0) {
    warnings.push({
      code: "PARTIAL_FILL",
      message: `⚠️ Recommended package is ${recommendation.recommended.underfillPercent.toFixed(
        1
      )}% short of target quantity (${
        recommendation.recommended.totalDispensed
      } units vs. ${
        recommendation.recommended.totalDispensed +
        (recommendation.recommended.totalDispensed *
          recommendation.recommended.underfillPercent) /
          100
      } target). Patient may need refill sooner.`,
      severity: "warning",
    });
  }

  return warnings;
}
