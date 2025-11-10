import axios from "axios";
import { config } from "../config";
import { cache } from "../cache";
import { normalizeUnit } from "../units";
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

export async function ndcsByRxCui(rxcui: string): Promise<NdcRecord[]> {
  const cacheKey = `NDC:${rxcui}`;
  const cached = cache.get<NdcRecord[]>(cacheKey);
  if (cached) {
    console.log(`[FDA] Cache hit: ${rxcui}`);
    return cached;
  }

  console.log(`[FDA] Fetching NDCs for RxCUI: ${rxcui}`);
  const startTime = Date.now();

  try {
    // Search FDA NDC Directory by product code (derived from RxCUI)
    const response = await retryRequest(() =>
      axios.get(config.fda.baseUrl, {
        params: {
          search: `openfda.rxcui:"${rxcui}"`,
          limit: 100,
        },
        timeout: TIMEOUT,
      })
    );

    const results = response.data.results || [];
    const records: NdcRecord[] = [];

    for (const item of results) {
      const packaging = item.packaging || [];

      for (const pkg of packaging) {
        const ndc11 = pkg.package_ndc?.replace(/-/g, "");
        if (!ndc11 || ndc11.length !== 11) continue;

        // Parse package size (e.g., "100 TABLET" -> 100, EA)
        const description = pkg.description?.toUpperCase() || "";
        const sizeMatch = description.match(/^(\d+\.?\d*)\s+([A-Z]+)/);

        if (!sizeMatch) continue;

        const packageSize = parseFloat(sizeMatch[1]);
        const unitRaw = sizeMatch[2];
        const unit = normalizeUnit(unitRaw);

        // Determine status
        const status =
          item.marketing_status === "active" ? "ACTIVE" : "INACTIVE";

        records.push({
          ndc11,
          packageSize,
          unit,
          status: status as any,
          labeler: item.labeler_name,
          productName: item.brand_name || item.generic_name,
        });
      }
    }

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
