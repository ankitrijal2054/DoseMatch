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
    // Determine if input is NDC or drug name
    const isNdc = /^\d{11}$/.test(input.replace(/-/g, ""));

    let rxcui: string;

    if (isNdc) {
      // NDC to RxCUI
      const ndcResponse = await retryRequest(() =>
        axios.get(`${config.rxnorm.baseUrl}/ndcstatus.json`, {
          params: { ndc: input },
          timeout: TIMEOUT,
        })
      );
      rxcui = ndcResponse.data.ndcStatus?.rxcui;
    } else {
      // Drug name to RxCUI (approximate match)
      const searchResponse = await retryRequest(() =>
        axios.get(`${config.rxnorm.baseUrl}/approximateTerm.json`, {
          params: { term: input, maxEntries: 1 },
          timeout: TIMEOUT,
        })
      );
      const candidates = searchResponse.data.approximateGroup?.candidate;
      rxcui = candidates?.[0]?.rxcui;
    }

    if (!rxcui) {
      throw new Error("No RxCUI found");
    }

    // Get drug details (SCD/SBD)
    const detailsResponse = await retryRequest(() =>
      axios.get(`${config.rxnorm.baseUrl}/rxcui/${rxcui}/property.json`, {
        params: { propName: "all" },
        timeout: TIMEOUT,
      })
    );

    const props = detailsResponse.data.propConceptGroup?.propConcept || [];
    const doseForm = props.find((p: any) => p.propName === "DF")?.propValue;
    const strength = props.find(
      (p: any) => p.propName === "STRENGTH"
    )?.propValue;

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
  } catch (error) {
    console.error("[RxNorm] Error:", error);
    throw new Error(`RxNorm lookup failed: ${error}`);
  }
}
