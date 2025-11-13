import axios from "axios";
import { config } from "../config";
import { cache } from "../cache";
import { normalizeUnit } from "../units";
import { getRxCuiCandidates } from "./rxnorm";
import type { NdcRecord } from "../types";

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

export async function ndcsByRxCui(
  rxcui: string,
  drugName?: string
): Promise<NdcRecord[]> {
  const cacheKey = `NDC:${rxcui}`;
  const cached = cache.get<NdcRecord[]>(cacheKey);
  if (cached) {
    console.log(`[FDA] Cache hit: ${rxcui}`);
    return cached;
  }

  console.log(`[FDA] Fetching NDCs for RxCUI: ${rxcui}`);
  const startTime = Date.now();

  try {
    // Search FDA NDC Directory by RxCUI
    let response;
    let results = [];
    let tryFallback = false;

    try {
      response = await retryRequest(() =>
        axios.get(config.fda.baseUrl, {
          params: {
            search: `openfda.rxcui:${rxcui}`,
            limit: 100,
          },
          timeout: TIMEOUT,
        })
      );
      results = response.data.results || [];
      console.log(
        `[FDA] Got ${results.length} results from API for RxCUI ${rxcui}`
      );
    } catch (err: any) {
      // If we get an error, try fallback
      console.log(
        `[FDA] Primary RxCUI ${rxcui} failed, will try fallback candidates`
      );
      tryFallback = true;
    }

    // If no results or error, try fallback with other RxCUI candidates
    if ((results.length === 0 || tryFallback) && drugName) {
      console.log(`[FDA] Attempting fallback candidates for "${drugName}"...`);
      const candidates = await getRxCuiCandidates(drugName);
      for (const candidate of candidates) {
        if (candidate === rxcui) continue; // Skip already tried
        console.log(`[FDA] Trying fallback RxCUI: ${candidate}`);
        try {
          const fallbackResponse = await retryRequest(() =>
            axios.get(config.fda.baseUrl, {
              params: {
                search: `openfda.rxcui:${candidate}`,
                limit: 100,
              },
              timeout: TIMEOUT,
            })
          );
          const fallbackResults = fallbackResponse.data.results || [];
          if (fallbackResults.length > 0) {
            console.log(
              `[FDA] SUCCESS! Found ${fallbackResults.length} results with fallback RxCUI ${candidate}`
            );
            results = fallbackResults;
            break;
          }
        } catch (err) {
          console.log(
            `[FDA] Fallback RxCUI ${candidate} also failed, trying next...`
          );
          continue;
        }
      }
    }

    // Step 1: Collect all NDC package info first (no API calls yet)
    interface PendingNdc {
      ndc11: string;
      packageSize: number;
      unit: string;
      labeler?: string;
      productName?: string;
    }
    
    const pendingNdcs: PendingNdc[] = [];
    
    for (const item of results) {
      const packaging = item.packaging || [];
      
      for (const pkg of packaging) {
        const ndc11 = pkg.package_ndc?.replace(/-/g, "");
        if (!ndc11 || (ndc11.length !== 11 && ndc11.length !== 10)) {
          continue;
        }

        const description = pkg.description?.toUpperCase() || "";
        const sizeMatch = description.match(/^(\d+\.?\d*)\s+([A-Z]+)/);
        if (!sizeMatch) {
          continue;
        }

        const packageSize = parseFloat(sizeMatch[1]);
        const unitRaw = sizeMatch[2];
        const unit = normalizeUnit(unitRaw);

        pendingNdcs.push({
          ndc11,
          packageSize,
          unit,
          labeler: item.labeler_name,
          productName: item.brand_name || item.generic_name,
        });
      }
    }

    console.log(
      `[FDA] Collected ${pendingNdcs.length} NDC packages, checking statuses in parallel...`
    );

    // Step 2: Limit to first 40 NDCs to prevent excessive API calls
    // (pack selection will only use ~20 anyway)
    const ndcsToCheck = pendingNdcs.slice(0, 40);
    if (pendingNdcs.length > 40) {
      console.log(
        `[FDA] Limiting status checks to first 40 NDCs (had ${pendingNdcs.length})`
      );
    }

    // Step 3: Check all NDC statuses in PARALLEL with Promise.all()
    const statusCheckStart = Date.now();
    
    const statusChecks = ndcsToCheck.map(async (ndc) => {
      try {
        // Format NDC for RxNorm
        let formattedNdc = ndc.ndc11;
        if (ndc.ndc11.length === 11) {
          formattedNdc = `${ndc.ndc11.substring(0, 5)}-${ndc.ndc11.substring(
            5,
            9
          )}-${ndc.ndc11.substring(9, 11)}`;
        } else if (ndc.ndc11.length === 10) {
          formattedNdc = `${ndc.ndc11.substring(0, 5)}-${ndc.ndc11.substring(
            5,
            8
          )}-${ndc.ndc11.substring(8, 10)}`;
        }

        const statusResponse = await axios.get(
          `${config.rxnorm.baseUrl}/ndcstatus.json`,
          {
            params: { ndc: formattedNdc },
            timeout: 2000, // Reduced from 3000ms
          }
        );

        const ndcStatus = statusResponse.data.ndcStatus?.status;
        
        if (ndcStatus === "ACTIVE") {
          return { ...ndc, status: "ACTIVE" as const };
        } else if (ndcStatus) {
          // Inactive - return null to filter out
          console.log(`[FDA] NDC ${ndc.ndc11} is ${ndcStatus} - skipping`);
          return null;
        } else {
          return { ...ndc, status: "UNKNOWN" as const };
        }
      } catch (err) {
        // If status check fails, mark as UNKNOWN and include it
        console.warn(`[FDA] Status check failed for NDC ${ndc.ndc11}, marking as UNKNOWN`);
        return { ...ndc, status: "UNKNOWN" as const };
      }
    });

    // Wait for all status checks to complete in parallel
    const checkedNdcs = await Promise.all(statusChecks);
    
    console.log(
      `[FDA] Status checks completed in ${Date.now() - statusCheckStart}ms`
    );

    // Step 4: Filter out nulls (inactive NDCs) and build final records
    const records: NdcRecord[] = checkedNdcs
      .filter((ndc): ndc is NonNullable<typeof ndc> => ndc !== null)
      .map((ndc) => ({
        ndc11: ndc.ndc11,
        packageSize: ndc.packageSize,
        unit: ndc.unit,
        status: ndc.status,
        labeler: ndc.labeler,
        productName: ndc.productName,
      }));

    // Sort: ACTIVE first, then by package size ascending
    records.sort((a, b) => {
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
      return a.packageSize - b.packageSize;
    });

    cache.set(cacheKey, records);
    console.log(
      `[FDA] Found ${records.length} NDCs in ${Date.now() - startTime}ms`
    );

    return records;
  } catch (error) {
    console.error("[FDA] Error:", error);
    // Return empty array with warning instead of throwing
    return [];
  }
}
