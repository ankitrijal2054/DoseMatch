import axios from "axios";
import { config } from "../config";
import { cache } from "../cache";
import type { RxNormResult } from "../types";

const TIMEOUT = 5000;
const MAX_RETRIES = 2;

async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1))
      );
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
}

export async function normalizeDrug(input: string): Promise<RxNormResult> {
  const cacheKey = `RXNORM:${input}`;
  const cached = cache.get<RxNormResult>(cacheKey);
  if (cached) {
    console.log(`[RxNorm] Cache hit: ${input}`);
    return cached;
  }

  console.log(`[RxNorm] Fetching: ${input}`);
  const startTime = Date.now();

  try {
    // Determine if input is NDC or drug name (NDC can be 10 or 11 digits)
    const cleanInput = input.replace(/-/g, "");
    const isNdc = /^\d{10,11}$/.test(cleanInput);

    let rxcui: string;

    if (isNdc) {
      // NDC to RxCUI
      // Format NDC to standard format: NNNNN-NNN-NN (5-3-2)
      const cleanNdc = input.replace(/-/g, "");
      let formattedNdc = cleanNdc;

      if (cleanNdc.length === 10) {
        // 10-digit: assume format is NNNNNNNNNNN, need to add dashes
        formattedNdc = `${cleanNdc.substring(0, 5)}-${cleanNdc.substring(
          5,
          8
        )}-${cleanNdc.substring(8, 10)}`;
      } else if (cleanNdc.length === 11) {
        // 11-digit: format as NNNNN-NNNN-NN (5-4-2)
        formattedNdc = `${cleanNdc.substring(0, 5)}-${cleanNdc.substring(
          5,
          9
        )}-${cleanNdc.substring(9, 11)}`;
      }

      console.log(
        `[RxNorm] Looking up NDC: ${input} (formatted: ${formattedNdc})`
      );
      const ndcResponse = await retryRequest(() =>
        axios.get(`${config.rxnorm.baseUrl}/ndcstatus.json`, {
          params: { ndc: formattedNdc },
          timeout: TIMEOUT,
        })
      );
      console.log(
        `[RxNorm] ndcstatus response keys:`,
        Object.keys(ndcResponse.data)
      );
      rxcui = ndcResponse.data.ndcStatus?.rxcui;
      console.log(`[RxNorm] Found RxCUI from NDC: ${rxcui}`);
    } else {
      // Drug name to RxCUI (approximate match) - get multiple candidates
      const searchResponse = await retryRequest(() =>
        axios.get(`${config.rxnorm.baseUrl}/approximateTerm.json`, {
          params: { term: input, maxEntries: 10 },
          timeout: TIMEOUT,
        })
      );
      console.log(`[RxNorm] approximateTerm response:`, searchResponse.data);
      const candidates = searchResponse.data.approximateGroup?.candidate;
      const allCandidateRxcuis = candidates?.map((c: any) => c.rxcui) || [];
      console.log(
        `[RxNorm] Found candidates: ${allCandidateRxcuis.join(", ")}`
      );
      rxcui = allCandidateRxcuis[0];
    }

    if (!rxcui) {
      const errorMsg = isNdc 
        ? `NDC "${input}" not found in RxNorm. The NDC may be invalid, inactive, or not yet registered.`
        : `Drug "${input}" not found in RxNorm. Please check the spelling or try a different name.`;
      const error: any = new Error(errorMsg);
      error.code = "RXCUI_NOT_FOUND";
      error.input = input;
      error.isNdc = isNdc;
      throw error;
    }

    // Get drug details (SCD/SBD)
    let detailsResponse = await retryRequest(() =>
      axios.get(`${config.rxnorm.baseUrl}/rxcui/${rxcui}/properties.json`, {
        timeout: TIMEOUT,
      })
    );

    // Extract dose form and strength from the drug name
    // Example: "amlodipine 5 MG Oral Tablet" -> doseForm = "Oral Tablet"
    const drugName = detailsResponse.data.properties?.name || "";
    
    // Extract dose form (last 1-2 words, common patterns: "Oral Tablet", "Injectable Solution", "Topical Cream")
    const doseFormMatch = drugName.match(/\b(Oral|Injectable|Topical|Inhalation|Nasal|Ophthalmic|Otic|Rectal|Sublingual|Transdermal|Vaginal|Buccal)\s+(Tablet|Capsule|Solution|Suspension|Cream|Ointment|Gel|Lotion|Powder|Spray|Patch|Film|Pellet|Suppository|Drops|Inhaler|Aerosol|Emulsion)\b/i);
    const doseForm = doseFormMatch ? doseFormMatch[0] : null;
    
    // Extract strength (numbers followed by unit)
    const strengthMatch = drugName.match(/\d+(\.\d+)?\s*(MG|G|ML|MCG|MEQ|UNIT|%)/i);
    const strength = strengthMatch ? strengthMatch[0] : null;

    // Get synonyms
    const synonymsResponse = await retryRequest(() =>
      axios.get(`${config.rxnorm.baseUrl}/rxcui/${rxcui}/allrelated.json`, {
        timeout: TIMEOUT,
      })
    );

    const synonyms =
      synonymsResponse.data.allRelatedGroup?.conceptGroup
        ?.flatMap((g: any) => g.conceptProperties || [])
        ?.map((c: any) => c.name)
        ?.slice(0, 5) || [];

    const result: RxNormResult = {
      rxcui,
      doseForm,
      strength,
      synonyms,
    };

    cache.set(cacheKey, result);
    console.log(`[RxNorm] Completed in ${Date.now() - startTime}ms`);

    return result;
  } catch (error: any) {
    console.error("[RxNorm] Error:", error);
    
    // Re-throw RXCUI_NOT_FOUND errors as-is with their detailed messages
    if (error.code === "RXCUI_NOT_FOUND") {
      throw error;
    }
    
    // For other errors, wrap with generic message
    const wrappedError: any = new Error(`RxNorm API error: Unable to process "${input}". Please try again or check your input.`);
    wrappedError.code = "RXNORM_API_ERROR";
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

// Helper function to get multiple RxCUI candidates for fallback
export async function getRxCuiCandidates(input: string): Promise<string[]> {
  try {
    const searchResponse = await axios.get(
      `${config.rxnorm.baseUrl}/approximateTerm.json`,
      {
        params: { term: input, maxEntries: 10 },
        timeout: 5000,
      }
    );
    const candidates = searchResponse.data.approximateGroup?.candidate || [];
    return candidates.map((c: any) => c.rxcui).filter(Boolean);
  } catch {
    return [];
  }
}
