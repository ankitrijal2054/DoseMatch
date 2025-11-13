import type {
  NdcRecord,
  RecommendationOption,
  Recommendation,
  CanonicalUnit,
  PackComposition,
  MatchType,
} from "../types";

interface PackOptions {
  maxPacks?: number;
}

/**
 * Score a recommendation option based on match quality, status, and efficiency
 * Higher score = better recommendation
 */
function scoreOption(
  option: RecommendationOption,
  targetUnits: number
): number {
  let score = 0;

  // Active status: +1000 (major boost)
  if (option.status === "ACTIVE") score += 1000;

  // Match type priority
  if (option.matchType === "EXACT") score += 500;
  else if (option.matchType === "MULTI_PACK") score += 300;

  // Minimize overfill (penalize excess)
  // -2 per percentage point of overfill
  score -= option.overfillPercent * 2;

  // Check if all packs use the same NDC (pharmacy workflow preference!)
  const uniqueNdcs = new Set(option.packsUsed.map((p) => p.ndc));
  const isSameNdc = uniqueNdcs.size === 1;

  if (isSameNdc && option.packsUsed.length > 1) {
    // Bonus for same-NDC multi-pack (simpler workflow)
    // +100 bonus makes it strongly preferred over mixed NDCs
    score += 100;
  } else {
    // Penalize mixed-NDC combinations more heavily
    // Multiple different NDCs = more complex dispensing
    score -= option.packsUsed.length * 20;
  }

  // Minimize total number of packs
  score -= option.packsUsed.length * 5;

  // Bonus for single pack solutions
  if (option.packsUsed.length === 1) score += 50;

  return score;
}

/**
 * Find if there's an exact single-pack match for target quantity
 */
function findExactMatch(
  targetUnits: number,
  ndcs: NdcRecord[]
): RecommendationOption | null {
  for (const ndc of ndcs) {
    if (ndc.packageSize === targetUnits) {
      return {
        ndc: ndc.ndc11,
        packageSize: ndc.packageSize,
        unit: ndc.unit,
        status: ndc.status,
        packsUsed: [{ ndc: ndc.ndc11, count: 1 }],
        matchType: "EXACT",
        overfillPercent: 0,
        underfillPercent: 0,
        totalDispensed: ndc.packageSize,
        badges:
          ndc.status === "ACTIVE"
            ? ["Exact Match"]
            : ["Exact Match", "Inactive"],
        why:
          ndc.status === "ACTIVE"
            ? `Perfect match: 1 pack of ${ndc.packageSize} ${ndc.unit}`
            : `Exact quantity match, but NDC is inactive`,
        score: 0,
      };
    }
  }
  return null;
}

/**
 * Find best same-NDC multi-pack combination (2-3 packs of the SAME NDC)
 * NEVER mixes different NDCs - always uses same NDC for all packs
 */
function findMultiPackCombination(
  targetUnits: number,
  ndcs: NdcRecord[],
  maxPacks: number
): RecommendationOption | null {
  const activeNdcs = ndcs.filter((n) => n.status === "ACTIVE");

  if (activeNdcs.length === 0) return null;

  const candidates: RecommendationOption[] = [];
  const maxOverfillRatio = 1.20; // Allow up to 20% overfill for same-NDC simplicity

  // Try each NDC with different pack counts (2 or 3 packs of SAME NDC only)
  for (const ndc of activeNdcs) {
    for (let packCount = 2; packCount <= maxPacks; packCount++) {
      const total = ndc.packageSize * packCount;

      // Skip if underfill
      if (total < targetUnits) {
        continue;
      }

      // Skip if excessive overfill
      if (total > targetUnits * maxOverfillRatio) {
        break; // No point trying higher counts
      }

      const overfill = ((total - targetUnits) / targetUnits) * 100;

      candidates.push({
        ndc: ndc.ndc11,
        packageSize: ndc.packageSize,
        unit: ndc.unit,
        status: "ACTIVE",
        packsUsed: [{ ndc: ndc.ndc11, count: packCount }],
        matchType: "MULTI_PACK",
        overfillPercent: overfill,
        underfillPercent: 0,
        totalDispensed: total,
        badges: packCount > 1 ? [`${packCount} Packs`] : ["Multi-Pack"],
        why: `${packCount}× packs of ${ndc.packageSize} ${ndc.unit} = ${total} ${ndc.unit}`,
        score: 0,
      });

      // If we found a near-perfect match (<5% overfill), we can stop here
      if (overfill < 5) {
        break;
      }
    }
  }

  if (candidates.length === 0) return null;

  // Score and pick best (same-NDC bonus is already in scoreOption)
  candidates.forEach((c) => (c.score = scoreOption(c, targetUnits)));
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0];
}

/**
 * Find the single pack that's closest to target (may over/underfill)
 * Used as fallback when exact/multi-pack not available
 */
function findNearestMatch(
  targetUnits: number,
  ndcs: NdcRecord[]
): RecommendationOption {
  // Find closest single pack (prefer slight overfill)
  let best = ndcs[0];
  let minDiff = Math.abs(best.packageSize - targetUnits);

  for (const ndc of ndcs) {
    const diff = Math.abs(ndc.packageSize - targetUnits);
    // Prefer ACTIVE over INACTIVE even if not as close
    if (ndc.status === "ACTIVE" && best.status === "INACTIVE") {
      best = ndc;
      minDiff = diff;
    } else if (ndc.status === best.status && diff < minDiff) {
      best = ndc;
      minDiff = diff;
    }
  }

  const overfill = Math.max(
    0,
    ((best.packageSize - targetUnits) / targetUnits) * 100
  );
  const underfill = Math.max(
    0,
    ((targetUnits - best.packageSize) / targetUnits) * 100
  );
  const matchType: MatchType = overfill > 0 ? "OVERFILL" : "UNDERFILL";

  const badges: string[] = [];
  if (best.status === "INACTIVE") badges.push("Inactive");
  if (overfill > 10) badges.push(`+${overfill.toFixed(0)}% Overfill`);
  if (underfill > 0) badges.push(`-${underfill.toFixed(0)}% Short`);

  return {
    ndc: best.ndc11,
    packageSize: best.packageSize,
    unit: best.unit,
    status: best.status,
    packsUsed: [{ ndc: best.ndc11, count: 1 }],
    matchType,
    overfillPercent: overfill,
    underfillPercent: underfill,
    totalDispensed: best.packageSize,
    badges,
    why:
      overfill > 0
        ? `Nearest available: ${best.packageSize} ${
            best.unit
          } (${overfill.toFixed(1)}% overfill)`
        : `Partial fill: ${best.packageSize} ${best.unit} (${underfill.toFixed(
            1
          )}% short)`,
    score: 0,
  };
}

/**
 * Main orchestrator: Try exact → multi-pack → nearest strategies
 * Returns recommended option + alternatives ranked by score
 */
export function recommendPacks(
  targetUnits: number,
  unit: CanonicalUnit,
  ndcs: NdcRecord[],
  options: PackOptions = {}
): Recommendation {
  const maxPacks = options.maxPacks || 3;

  console.log(
    `[Pack Selection] Target: ${targetUnits} ${unit}, Available NDCs: ${ndcs.length}`
  );

  // Filter by matching unit
  const matchingUnit = ndcs.filter((n) => n.unit === unit);

  if (matchingUnit.length === 0) {
    throw new Error(`No NDCs found matching unit: ${unit}`);
  }

  // Strategy 1: Exact match
  const exact = findExactMatch(targetUnits, matchingUnit);
  if (exact) {
    console.log("[Pack Selection] Found exact match");
    exact.score = scoreOption(exact, targetUnits);
    return {
      recommended: exact,
      alternatives: [],
    };
  }

  // Strategy 2: Multi-pack combination
  const multiPack = findMultiPackCombination(
    targetUnits,
    matchingUnit,
    maxPacks
  );

  // Strategy 3: Nearest single pack
  const nearest = findNearestMatch(targetUnits, matchingUnit);

  // Collect alternatives
  const alternatives: RecommendationOption[] = [];

  if (multiPack) {
    multiPack.score = scoreOption(multiPack, targetUnits);
    alternatives.push(multiPack);
  }

  nearest.score = scoreOption(nearest, targetUnits);
  alternatives.push(nearest);

  // Pick best as recommended
  alternatives.sort((a, b) => b.score - a.score);
  const recommended = alternatives.shift()!;

  console.log(
    `[Pack Selection] Recommended: ${recommended.matchType} (score: ${recommended.score})`
  );

  return {
    recommended,
    alternatives: alternatives.slice(0, 3), // Top 3 alternatives
  };
}
