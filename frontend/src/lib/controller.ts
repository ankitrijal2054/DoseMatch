import { normalizeDrug } from "./adapters/rxnorm";
import { ndcsByRxCui } from "./adapters/fda";
import { parseSig } from "./sig";
import { computeTotalUnits } from "./engines/quantity";
import { recommendPacks } from "./engines/pack";
import { generateWarnings } from "./engines/warnings";
import type { DrugInput, ResultPayload, DirectNdcCheck } from "./types";
import axios from "axios";
import { config } from "./config";

/**
 * Detects if the input string is an NDC code
 * NDC format: 10-11 digits, optionally with hyphens (XXXXX-XXXX-XX or XXXXX-XXX-XX)
 */
function isNdcFormat(input: string): boolean {
  const cleaned = input.replace(/[-\s]/g, "");
  return /^\d{10,11}$/.test(cleaned);
}

/**
 * Checks the status of a specific NDC using RxNorm API
 */
async function checkNdcStatus(ndc: string): Promise<DirectNdcCheck> {
  try {
    // Format NDC for RxNorm (add hyphens if needed)
    const clean = ndc.replace(/[-\s]/g, "");
    let formattedNdc = ndc;
    
    if (clean.length === 11) {
      formattedNdc = `${clean.substring(0, 5)}-${clean.substring(5, 9)}-${clean.substring(9, 11)}`;
    } else if (clean.length === 10) {
      formattedNdc = `${clean.substring(0, 5)}-${clean.substring(5, 8)}-${clean.substring(8, 10)}`;
    }

    console.log(`[Controller] Checking status of directly provided NDC: ${formattedNdc}`);
    
    const response = await axios.get(
      `${config.rxnorm.baseUrl}/ndcstatus.json`,
      {
        params: { ndc: formattedNdc },
        timeout: 3000,
      }
    );

    const status = response.data.ndcStatus?.status;
    
    return {
      ndc: formattedNdc,
      status: status || "UNKNOWN",
      isInactive: status === "INACTIVE" || status === "OBSOLETE" || status === "DEPRECATED",
    };
  } catch (error) {
    console.warn(`[Controller] Failed to check NDC status:`, error);
    return {
      ndc,
      status: "UNKNOWN",
      isInactive: false,
    };
  }
}

/**
 * Main orchestration function that processes a drug recommendation request
 * Coordinates the following steps:
 * 1. Parse SIG (prescription instructions)
 * 2. Normalize drug name to RxCUI
 * 3. Fetch NDC packages for that drug
 * 4. Compute target quantity from SIG
 * 5. Recommend optimal pack(s)
 * 6. Generate warnings
 */
export async function processRecommendation(
  input: DrugInput
): Promise<ResultPayload> {
  console.log("[Controller] Starting recommendation process");
  const startTime = Date.now();

  const metrics = {
    totalMs: 0,
    rxnormMs: 0,
    fdaMs: 0,
    sigParsingMs: 0,
    cacheHits: 0,
  };

  try {
    // Step 0: Check if user provided an NDC directly
    let directNdcCheck: DirectNdcCheck | undefined;
    if (input.drugQuery && isNdcFormat(input.drugQuery)) {
      console.log("[Controller] Step 0: User provided NDC directly, checking status...");
      directNdcCheck = await checkNdcStatus(input.drugQuery);
      console.log(`[Controller] Direct NDC check result:`, directNdcCheck);
    }

    // Step 1: Parse SIG (prescription instructions)
    console.log("[Controller] Step 1: Parsing SIG...");
    const sigStart = Date.now();
    const normalizedSig = await parseSig(input.sigText, input.daysSupply);
    metrics.sigParsingMs = Date.now() - sigStart;
    console.log(
      `[Controller] SIG parsed in ${metrics.sigParsingMs}ms`,
      normalizedSig
    );

    // Step 2: Normalize drug to RxCUI
    console.log("[Controller] Step 2: Normalizing drug name...");
    const rxStart = Date.now();
    // Use NDC11 if provided, otherwise use drug query name
    const drugQuery = input.ndc11 || input.drugQuery;
    if (!drugQuery) {
      throw new Error("Either drugQuery or ndc11 must be provided");
    }
    const rxnorm = await normalizeDrug(drugQuery);
    metrics.rxnormMs = Date.now() - rxStart;
    console.log(
      `[Controller] Drug normalized to RxCUI ${rxnorm.rxcui} in ${metrics.rxnormMs}ms`
    );

    // Step 3: Fetch NDCs
    console.log("[Controller] Step 3: Fetching NDC packages...");
    const fdaStart = Date.now();
    const ndcs = await ndcsByRxCui(rxnorm.rxcui, drugQuery);
    metrics.fdaMs = Date.now() - fdaStart;
    console.log(`[Controller] Found ${ndcs.length} NDCs in ${metrics.fdaMs}ms`);

    if (ndcs.length === 0) {
      throw new Error(
        `No NDC packages found for drug "${drugQuery}" (RxCUI: ${rxnorm.rxcui})`
      );
    }

    // Step 4: Compute target quantity
    console.log("[Controller] Step 4: Computing target quantity...");
    const totalUnits = computeTotalUnits(normalizedSig);
    console.log(
      `[Controller] Target quantity: ${totalUnits} ${normalizedSig.unit}`
    );

    // Step 5: Recommend packs
    console.log("[Controller] Step 5: Recommending packs...");
    const recommendation = recommendPacks(
      totalUnits,
      normalizedSig.unit,
      ndcs,
      { maxPacks: 3 }
    );
    console.log(
      `[Controller] Recommendation: ${recommendation.recommended.ndc} (${recommendation.recommended.matchType})`
    );

    // Step 6: Generate warnings
    console.log("[Controller] Step 6: Generating warnings...");
    const warnings = generateWarnings(recommendation, ndcs);
    console.log(`[Controller] Generated ${warnings.length} warning(s)`);

    metrics.totalMs = Date.now() - startTime;

    console.log(
      `[Controller] ✅ Completed successfully in ${metrics.totalMs}ms`
    );

    return {
      input,
      normalizedSig,
      rxnorm,
      targetQuantity: {
        unit: normalizedSig.unit,
        totalUnits,
      },
      recommendation,
      warnings,
      directNdcCheck,
      performanceMetrics: metrics,
    };
  } catch (error: any) {
    console.error("[Controller] ❌ Error:", error);

    // Handle specific error types with user-friendly messages
    if (error.code === "RXCUI_NOT_FOUND") {
      throw {
        code: "RXCUI_NOT_FOUND",
        message: error.message,
        isNdc: error.isNdc,
        input: error.input,
        userFriendly: true,
      };
    }

    if (error.code === "RXNORM_API_ERROR") {
      throw {
        code: "RXNORM_API_ERROR",
        message: error.message,
        userFriendly: true,
      };
    }

    // Return structured error for generic cases
    throw {
      code: "PROCESSING_ERROR",
      message: error.message || "Failed to process recommendation",
      details: error,
    };
  }
}
