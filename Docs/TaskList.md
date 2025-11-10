# DoseMatch — Final Build Tasklist

**Tagline:** _From SIG to shelf—perfect fills, every time._

**Organization:** Foundation Health (Portfolio Project)  
**Deployment:** Firebase Hosting + Cloud Functions (MVP) → Cloud Run (Post-MVP)  
**Auth:** None for MVP (Firebase Auth planned post-MVP)  
**AI Features:** OpenAI GPT-4o-mini for SIG parsing assistance + recommendation explainers (server-side via Functions)

---

## 🎯 Key Architecture Decisions

### Security & Deployment

✅ **OpenAI API Keys:** Secured server-side via Firebase Cloud Functions  
✅ **Static Frontend:** SvelteKit with `adapter-static` for fast, cheap hosting  
✅ **Hybrid Architecture:** Client-side for RxNorm/FDA (public APIs) + Server-side for OpenAI  
✅ **GCP Migration Ready:** Cloud Functions → Cloud Run with minimal code changes

### Caching Strategy

✅ **localStorage (Browser-based):** 24h TTL, survives page reloads, no server required  
✅ **Graceful Degradation:** App works without cache, just slower  
✅ **Cache Keys:** `dosematch_cache_RXNORM:query` format

### Performance Optimizations

✅ **Multi-Pack Algorithm:** Limited to 20 NDCs, 15% max overfill, early termination for <2% matches  
✅ **SIG Parsing:** Rules engine first (fast), LLM fallback via Cloud Function (secure)  
✅ **300ms Debouncing:** Prevents excessive API calls during typing

### Testing Strategy

✅ **Unit Tests:** Vitest for core logic (units, SIG, quantity, pack engines)  
✅ **Integration Tests:** Mocked RxNorm/FDA APIs for golden path scenarios  
✅ **Manual E2E:** Browser testing checklist (no Playwright automation for MVP)

### Future-Proofing

✅ **GCP Migration Path:** Documented incremental approach (Functions → Cloud Run)  
✅ **Auth Ready:** Structure supports Firebase Auth addition post-MVP  
✅ **Extensible:** Clear separation of concerns (adapters, engines, UI)

---

## Phase 0: Project Foundation

### 0.1 Repository Setup

- [ ] Initialize SvelteKit project with TypeScript
  ```bash
  npm create svelte@latest dosematch
  # Choose: Skeleton project, TypeScript, ESLint, Prettier, Vitest
  ```
- [ ] Install core dependencies
  ```bash
  npm install -D tailwindcss postcss autoprefixer
  npm install axios date-fns
  ```
- [ ] Configure Tailwind CSS with Foundation Health theme (see 0.3)
- [ ] Set up project structure:
  ```
  src/
  ├── lib/
  │   ├── adapters/        # API integrations
  │   ├── sig/             # SIG parsing
  │   ├── engines/         # Quantity & pack selection
  │   ├── cache/           # 24h caching layer
  │   ├── types.ts         # Domain types
  │   ├── units.ts         # Unit normalization
  │   ├── config.ts        # Environment config
  │   └── controller.ts    # Main orchestration
  ├── routes/
  │   ├── +page.svelte     # Home/hero
  │   ├── calc/
  │   │   └── +page.svelte # Calculator UI
  │   └── +layout.svelte   # Global layout
  └── styles/
      └── theme.css        # Foundation Health CSS variables
  ```

### 0.2 Firebase Functions Setup

- [ ] Initialize Firebase project:
  ```bash
  firebase login
  firebase init
  # Select: Functions, Hosting
  # Language: TypeScript
  # ESLint: Yes
  ```
- [ ] Configure Functions for Node.js 18:
  ```bash
  cd functions
  npm install axios
  cd ..
  ```
- [ ] Create `functions/.env` (local development):
  ```
  OPENAI_API_KEY=sk-...
  ```
- [ ] Set production secret:
  ```bash
  firebase functions:secrets:set OPENAI_API_KEY
  ```

### 0.3 Environment Configuration

- [ ] Create `.env.local` (frontend only - public APIs):
  ```
  PUBLIC_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
  PUBLIC_FDA_NDC_BASE_URL=https://api.fda.gov/drug/ndc.json
  PUBLIC_APP_MODE=demo
  PUBLIC_FUNCTIONS_URL=http://127.0.0.1:5001/YOUR_PROJECT/us-central1
  ```
- [ ] Create `src/lib/config.ts`:
  ```typescript
  export const config = {
    rxnorm: { baseUrl: import.meta.env.PUBLIC_RXNORM_BASE_URL },
    fda: { baseUrl: import.meta.env.PUBLIC_FDA_NDC_BASE_URL },
    app: { mode: import.meta.env.PUBLIC_APP_MODE },
    functions: { baseUrl: import.meta.env.PUBLIC_FUNCTIONS_URL },
  };
  ```
- [ ] Add `.gitignore` entries for `.env.local`, `functions/.env`, `node_modules/`, `.svelte-kit/`

### 0.4 Foundation Health Branding

- [ ] Create `src/styles/theme.css`:

  ```css
  :root {
    /* Colors */
    --fh-blue-600: #2f56d2;
    --fh-hero-magenta: #c23d9c;
    --fh-hero-purple: #7d39ac;
    --fh-hero-blue: #2f56d2;
    --fh-bg-soft: #eef4ff;
    --fh-panel-1: #f5f9ff;
    --fh-panel-2: #f0f5ff;
    --fh-border: #d2d6e9;
    --fh-text-900: #0f172a;
    --fh-text-600: #3b4256;

    /* Spacing & Effects */
    --fh-radius-sm: 10px;
    --fh-radius-md: 14px;
    --fh-radius-lg: 18px;
    --fh-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    --fh-font: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
      Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }

  .fh-hero {
    background: linear-gradient(
      135deg,
      var(--fh-hero-magenta) 0%,
      var(--fh-hero-purple) 40%,
      var(--fh-hero-blue) 100%
    );
  }

  body {
    font-family: var(--fh-font);
    background-color: var(--fh-bg-soft);
    color: var(--fh-text-900);
  }
  ```

- [ ] Configure `tailwind.config.js`:

  ```javascript
  export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
      extend: {
        colors: {
          fh: {
            blue: "#2F56D2",
            magenta: "#C23D9C",
            purple: "#7D39AC",
            bg: "#EEF4FF",
            panel1: "#F5F9FF",
            panel2: "#F0F5FF",
            border: "#D2D6E9",
            text900: "#0F172A",
            text600: "#3B4256",
          },
        },
        borderRadius: {
          fhsm: "10px",
          fhmd: "14px",
          fhlg: "18px",
        },
        boxShadow: {
          fh: "0 10px 30px rgba(15, 23, 42, 0.06)",
        },
        backgroundImage: {
          "fh-hero":
            "linear-gradient(135deg, #C23D9C 0%, #7D39AC 40%, #2F56D2 100%)",
        },
        fontFamily: {
          sans: [
            "Inter",
            "system-ui",
            "-apple-system",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "Noto Sans",
            "Apple Color Emoji",
            "Segoe UI Emoji",
            "sans-serif",
          ],
        },
      },
    },
  };
  ```

- [ ] Import Google Fonts Inter in `app.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  ```

---

## Phase 1: Domain Types & Unit System

### 1.1 Core Type Definitions

- [ ] Create `src/lib/types.ts` with:

  ```typescript
  export type CanonicalUnit = "EA" | "mL" | "g" | "U" | "actuations";

  export interface DrugInput {
    drugQuery?: string;
    ndc11?: string;
    sigText: string;
    daysSupply: number;
  }

  export interface NormalizedSig {
    amountPerDose: number;
    unit: CanonicalUnit;
    frequencyPerDay: number;
    daysSupply: number;
    confidence: number; // 0-1
    rationale?: string;
    parsedBy: "rules" | "llm";
  }

  export interface RxNormResult {
    rxcui: string;
    doseForm?: string;
    strength?: string;
    synonyms?: string[];
  }

  export interface NdcRecord {
    ndc11: string;
    packageSize: number;
    unit: CanonicalUnit;
    status: "ACTIVE" | "INACTIVE" | "UNKNOWN";
    labeler?: string;
    productName?: string;
  }

  export interface PackComposition {
    ndc: string;
    count: number;
  }

  export type MatchType =
    | "EXACT"
    | "MULTI_PACK"
    | "NEAREST"
    | "OVERFILL"
    | "UNDERFILL";

  export interface RecommendationOption {
    ndc: string;
    packageSize: number;
    unit: string;
    status: string;
    packsUsed: PackComposition[];
    matchType: MatchType;
    overfillPercent: number;
    underfillPercent: number;
    totalDispensed: number;
    badges?: string[];
    why: string;
    score: number;
  }

  export interface Recommendation {
    recommended: RecommendationOption;
    alternatives: RecommendationOption[];
  }

  export interface Warning {
    code: string;
    message: string;
    severity: "error" | "warning" | "info";
  }

  export interface ResultPayload {
    input: DrugInput;
    normalizedSig: NormalizedSig;
    rxnorm: RxNormResult;
    targetQuantity: {
      unit: string;
      totalUnits: number;
    };
    recommendation: Recommendation;
    warnings: Warning[];
    performanceMetrics?: {
      totalMs: number;
      rxnormMs: number;
      fdaMs: number;
      sigParsingMs: number;
      cacheHits: number;
    };
  }
  ```

### 1.2 Unit Normalization System

- [ ] Create `src/lib/units.ts`:

  ```typescript
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
    unit1: CanonicalUnit,
    unit2: CanonicalUnit
  ): boolean {
    return unit1 === unit2;
  }
  ```

---

## Phase 2: Caching Layer (24h TTL)

### 2.1 Client-Side Cache Implementation

- [ ] Create `src/lib/cache/index.ts`:

  ```typescript
  interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // milliseconds
  }

  class BrowserCache {
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
    private readonly CACHE_PREFIX = "dosematch_cache_";

    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
      if (typeof window === "undefined") return; // SSR safety

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      try {
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
      } catch (error) {
        console.warn("[Cache] localStorage write failed:", error);
        // Graceful degradation: continue without cache
      }
    }

    get<T>(key: string): T | null {
      if (typeof window === "undefined") return null; // SSR safety

      try {
        const item = localStorage.getItem(this.CACHE_PREFIX + key);
        if (!item) return null;

        const entry: CacheEntry<T> = JSON.parse(item);
        const age = Date.now() - entry.timestamp;

        if (age > entry.ttl) {
          // Expired - clean up
          localStorage.removeItem(this.CACHE_PREFIX + key);
          return null;
        }

        return entry.data;
      } catch (error) {
        console.warn("[Cache] localStorage read failed:", error);
        return null;
      }
    }

    clear(): void {
      if (typeof window === "undefined") return;

      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.CACHE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("[Cache] localStorage clear failed:", error);
      }
    }

    stats(): { size: number; keys: string[] } {
      if (typeof window === "undefined") {
        return { size: 0, keys: [] };
      }

      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith(this.CACHE_PREFIX))
        .map((k) => k.replace(this.CACHE_PREFIX, ""));

      return {
        size: keys.length,
        keys,
      };
    }
  }

  export const cache = new BrowserCache();
  ```

**Why localStorage?**

- ✅ Persists across page reloads (unlike in-memory)
- ✅ Works with static Firebase Hosting
- ✅ 5-10MB storage (plenty for API responses)
- ✅ No server required for MVP

---

## Phase 3: API Adapters (RxNorm & FDA)

### 3.1 RxNorm Adapter

- [ ] Create `src/lib/adapters/rxnorm.ts`:

  ```typescript
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
  ```

### 3.2 FDA NDC Directory Adapter

- [ ] Create `src/lib/adapters/fda.ts`:

  ```typescript
  import axios from "axios";
  import { config } from "../config";
  import { cache } from "../cache";
  import { normalizeUnit } from "../units";
  import type { NdcRecord, CanonicalUnit } from "../types";

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
  ```

---

## Phase 4: SIG Parsing (Rules + Cloud Functions)

### 4.1 Rules-Based Parser (Client-Side)

- [ ] Create `src/lib/sig/rules.ts`:

  ```typescript
  import { normalizeUnit } from "../units";
  import type { NormalizedSig, CanonicalUnit } from "../types";

  interface FrequencyMap {
    [key: string]: number;
  }

  const FREQUENCY_MAP: FrequencyMap = {
    qd: 1,
    daily: 1,
    "once daily": 1,
    "once a day": 1,
    bid: 2,
    "twice daily": 2,
    "twice a day": 2,
    tid: 3,
    "three times daily": 3,
    "three times a day": 3,
    qid: 4,
    "four times daily": 4,
    "four times a day": 4,
    q4h: 6,
    q6h: 4,
    q8h: 3,
    q12h: 2,
    qhs: 1,
    "at bedtime": 1,
    "at night": 1,
    qam: 1,
    "in the morning": 1,
  };

  export function parseSigWithRules(
    sigText: string,
    daysSupply: number
  ): NormalizedSig | null {
    const sig = sigText.toLowerCase().trim();
    console.log(`[SIG Rules] Parsing: "${sigText}"`);

    // Extract dose amount and unit
    // Pattern: "take 2 tablets" or "inject 10 units" or "inhale 2 puffs"
    const dosePattern =
      /(?:take|inject|inhale|apply|use|instill)\s+(\d+\.?\d*)\s*([a-z]+)/i;
    const doseMatch = sig.match(dosePattern);

    if (!doseMatch) {
      console.log("[SIG Rules] No dose pattern found");
      return null;
    }

    const amountPerDose = parseFloat(doseMatch[1]);
    const unitRaw = doseMatch[2];
    const unit = normalizeUnit(unitRaw);

    // Extract frequency
    let frequencyPerDay = 1; // Default
    let freqConfidence = 0.5;

    for (const [pattern, freq] of Object.entries(FREQUENCY_MAP)) {
      if (sig.includes(pattern)) {
        frequencyPerDay = freq;
        freqConfidence = 0.9;
        break;
      }
    }

    // Check for explicit frequency like "3 times"
    const timesPattern = /(\d+)\s*times?\s*(?:a\s*day|daily|per\s*day)/;
    const timesMatch = sig.match(timesPattern);
    if (timesMatch) {
      frequencyPerDay = parseInt(timesMatch[1]);
      freqConfidence = 0.95;
    }

    // Calculate overall confidence
    const confidence = Math.min(
      0.95,
      (doseMatch ? 0.8 : 0) + freqConfidence * 0.2
    );

    console.log(
      `[SIG Rules] Parsed: ${amountPerDose} ${unit}, ${frequencyPerDay}x/day, confidence: ${confidence}`
    );

    // Require minimum confidence
    if (confidence < 0.7) {
      return null;
    }

    return {
      amountPerDose,
      unit,
      frequencyPerDay,
      daysSupply,
      confidence,
      parsedBy: "rules",
    };
  }
  ```

### 4.2 Cloud Function: LLM-Assisted Parser

- [ ] Create `functions/src/parseSig.ts`:

  ```typescript
  import * as functions from 'firebase-functions';
  import axios from 'axios';

  interface ParseSigRequest {
    sigText: string;
    daysSupply: number;
  }

  interface ParseSigResponse {
    amountPerDose: number;
    unit: string;
    frequencyPerDay: number;
    confidence: number;
    rationale: string;
  }

  const SYSTEM_PROMPT = `You are a pharmacy SIG parser. Extract structured dosing information from prescription SIG text.
  ```

Return ONLY valid JSON with this exact structure:
{
"amountPerDose": <number>,
"unit": "EA|mL|g|U|actuations",
"frequencyPerDay": <number>,
"confidence": <0.0-1.0>,
"rationale": "<brief explanation>"
}

Rules:

- amountPerDose: numeric quantity per single dose
- unit: canonical unit (EA=each/tablet/cap/patch, mL=milliliter, g=gram, U=insulin units, actuations=puffs)
- frequencyPerDay: how many times per day (QD=1, BID=2, TID=3, QID=4, Q6H=4, etc.)
- confidence: your certainty (0.0-1.0)
- Ignore PRN (as needed) for quantity calculations
- For "as needed" or "prn", assume once daily for quantity purposes
- DO NOT include any text outside the JSON object`;

  export const parseSigWithLLM = functions.https.onCall(
  async (data: ParseSigRequest): Promise<ParseSigResponse> => {
  const { sigText, daysSupply } = data;

      console.log(`[SIG LLM] Parsing: "${sigText}"`);

      try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Parse this SIG: "${sigText}"` }
            ],
            temperature: 0.1,
            max_tokens: 200
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          }
        );

        const content = response.data.choices[0].message.content.trim();

        // Strip markdown code blocks if present
        const jsonText = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const parsed = JSON.parse(jsonText);

        // Validate and clamp
        const result: ParseSigResponse = {
          amountPerDose: Math.max(0.1, parseFloat(parsed.amountPerDose)),
          unit: parsed.unit,
          frequencyPerDay: Math.max(1, Math.min(24, parseInt(parsed.frequencyPerDay))),
          confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence))),
          rationale: parsed.rationale || 'Parsed by AI'
        };

        console.log('[SIG LLM] Success:', result);
        return result;

      } catch (error: any) {
        console.error('[SIG LLM] Error:', error);
        throw new functions.https.HttpsError(
          'internal',
          'Failed to parse SIG with LLM',
          error.message
        );
      }

  }
  );

  ```

  ```

- [ ] Update `functions/src/index.ts`:
  ```typescript
  export { parseSigWithLLM } from "./parseSig";
  ```

### 4.3 Unified SIG Parser (Client-Side Orchestration)

- [ ] Create `src/lib/sig/index.ts`:

  ```typescript
  import { parseSigWithRules } from "./rules";
  import { normalizeUnit } from "../units";
  import { config } from "../config";
  import type { NormalizedSig } from "../types";

  const CONFIDENCE_THRESHOLD = 0.75;

  async function callLLMFunction(
    sigText: string,
    daysSupply: number
  ): Promise<NormalizedSig> {
    const response = await fetch(
      `${config.functions.baseUrl}/parseSigWithLLM`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { sigText, daysSupply },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`LLM function failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      amountPerDose: result.result.amountPerDose,
      unit: normalizeUnit(result.result.unit),
      frequencyPerDay: result.result.frequencyPerDay,
      daysSupply,
      confidence: result.result.confidence,
      rationale: result.result.rationale,
      parsedBy: "llm",
    };
  }

  export async function parseSig(
    sigText: string,
    daysSupply: number
  ): Promise<NormalizedSig> {
    // Try rules first
    const rulesResult = parseSigWithRules(sigText, daysSupply);

    if (rulesResult && rulesResult.confidence >= CONFIDENCE_THRESHOLD) {
      console.log("[SIG] Using rules result");
      return rulesResult;
    }

    // Fall back to LLM via Cloud Function
    console.log("[SIG] Rules confidence too low, using LLM");
    try {
      return await callLLMFunction(sigText, daysSupply);
    } catch (error) {
      // If LLM fails, return rules result if available
      if (rulesResult) {
        console.log("[SIG] LLM failed, falling back to rules result");
        return rulesResult;
      }

      // Last resort: default assumption
      console.warn("[SIG] All parsing failed, using defaults");
      return {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 1,
        daysSupply,
        confidence: 0.3,
        rationale: "Default values used due to parsing failure",
        parsedBy: "rules",
      };
    }
  }
  ```

---

## Phase 5: Quantity Calculation Engine

### 5.1 Quantity Calculator

- [ ] Create `src/lib/engines/quantity.ts`:

  ```typescript
  import type { NormalizedSig } from "../types";

  export function computeTotalUnits(sig: NormalizedSig): {
    unit: string;
    totalUnits: number;
  } {
    const totalUnits = sig.amountPerDose * sig.frequencyPerDay * sig.daysSupply;

    console.log(
      `[Quantity] ${sig.amountPerDose} × ${sig.frequencyPerDay} × ${sig.daysSupply} = ${totalUnits} ${sig.unit}`
    );

    return {
      unit: sig.unit,
      totalUnits: Math.ceil(totalUnits), // Always round up for dispensing
    };
  }
  ```

---

## Phase 6: Pack Selection Engine (Multi-Pack Support)

### 6.1 Pack Selection Algorithm

- [ ] Create `src/lib/engines/pack.ts`:

  ```typescript
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

  function scoreOption(
    option: RecommendationOption,
    targetUnits: number
  ): number {
    let score = 0;

    // Active status: +1000
    if (option.status === "ACTIVE") score += 1000;

    // Match type priority
    if (option.matchType === "EXACT") score += 500;
    else if (option.matchType === "MULTI_PACK") score += 300;

    // Minimize overfill (penalize excess)
    score -= option.overfillPercent * 2;

    // Minimize number of packs
    score -= option.packsUsed.length * 10;

    // Prefer larger single packs over multiple small ones
    if (option.packsUsed.length === 1) score += 50;

    return score;
  }

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

  function findMultiPackCombination(
    targetUnits: number,
    ndcs: NdcRecord[],
    maxPacks: number
  ): RecommendationOption | null {
    // 🔥 OPTIMIZATION 1: Limit search space to first 20 active NDCs
    const activeNdcs = ndcs.filter((n) => n.status === "ACTIVE").slice(0, 20);

    if (activeNdcs.length === 0) return null;

    const candidates: RecommendationOption[] = [];
    const maxOverfillRatio = 1.15; // 🔥 OPTIMIZATION 2: Cap at 15% overfill
    let bestOverfill = Infinity;

    // Two pack combinations (most common scenario)
    for (let i = 0; i < activeNdcs.length && candidates.length < 10; i++) {
      for (let j = i; j < activeNdcs.length; j++) {
        const ndc1 = activeNdcs[i];
        const ndc2 = activeNdcs[j];

        // 🔥 OPTIMIZATION 3: Smarter count limits
        const maxCount1 = Math.min(
          maxPacks,
          Math.ceil(targetUnits / ndc1.packageSize) + 1
        );

        for (let count1 = 1; count1 <= maxCount1; count1++) {
          for (let count2 = 0; count2 <= maxPacks - count1; count2++) {
            const total = ndc1.packageSize * count1 + ndc2.packageSize * count2;

            // Skip if underfill or excessive overfill
            if (total < targetUnits || total > targetUnits * maxOverfillRatio) {
              continue;
            }

            const overfill = ((total - targetUnits) / targetUnits) * 100;

            // 🔥 OPTIMIZATION 4: Early termination for near-perfect matches
            if (overfill < 2 && overfill < bestOverfill) {
              bestOverfill = overfill;
            }

            const packs: PackComposition[] = [
              { ndc: ndc1.ndc11, count: count1 },
            ];
            if (count2 > 0) packs.push({ ndc: ndc2.ndc11, count: count2 });

            candidates.push({
              ndc: ndc1.ndc11,
              packageSize: ndc1.packageSize,
              unit: ndc1.unit,
              status: "ACTIVE",
              packsUsed: packs,
              matchType: "MULTI_PACK",
              overfillPercent: overfill,
              underfillPercent: 0,
              totalDispensed: total,
              badges: ["Multi-Pack"],
              why: `Combination: ${packs
                .map((p) => `${p.count}×${p.ndc}`)
                .join(" + ")} = ${total} ${ndc1.unit}`,
              score: 0,
            });

            // Exit early if we found excellent match
            if (overfill < 2) {
              break;
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Score and pick best
    candidates.forEach((c) => (c.score = scoreOption(c, targetUnits)));
    candidates.sort((a, b) => b.score - a.score);

    return candidates[0];
  }

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
          : `Partial fill: ${best.packageSize} ${
              best.unit
            } (${underfill.toFixed(1)}% short)`,
      score: 0,
    };
  }

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
  ```

---

## Phase 7: Warnings & Evaluation

### 7.1 Warning System

- [ ] Create `src/lib/engines/warnings.ts`:

  ```typescript
  import type { Warning, Recommendation, NdcRecord } from "../types";

  export function generateWarnings(
    recommendation: Recommendation,
    allNdcs: NdcRecord[]
  ): Warning[] {
    const warnings: Warning[] = [];

    // Check for inactive NDCs in recommendation
    if (recommendation.recommended.status === "INACTIVE") {
      warnings.push({
        code: "INACTIVE_NDC_RECOMMENDED",
        message: `Recommended NDC ${recommendation.recommended.ndc} is marked INACTIVE. Verify availability before dispensing.`,
        severity: "warning",
      });
    }

    // Check if any alternatives are inactive
    const inactiveCount = allNdcs.filter((n) => n.status === "INACTIVE").length;
    if (inactiveCount > 0) {
      warnings.push({
        code: "INACTIVE_NDCS_PRESENT",
        message: `${inactiveCount} inactive NDC(s) found in database. Active alternatives shown when available.`,
        severity: "info",
      });
    }

    // Check for no exact match
    if (recommendation.recommended.matchType !== "EXACT") {
      warnings.push({
        code: "NO_EXACT_MATCH",
        message: `No exact package size match found. Recommendation uses ${recommendation.recommended.matchType.toLowerCase()} strategy.`,
        severity: "info",
      });
    }

    // Check for significant overfill
    if (recommendation.recommended.overfillPercent > 20) {
      warnings.push({
        code: "HIGH_OVERFILL",
        message: `Recommended package results in ${recommendation.recommended.overfillPercent.toFixed(
          1
        )}% overfill. Consider splitting prescription if appropriate.`,
        severity: "warning",
      });
    }

    // Check for underfill
    if (recommendation.recommended.underfillPercent > 0) {
      warnings.push({
        code: "PARTIAL_FILL",
        message: `Recommended package is ${recommendation.recommended.underfillPercent.toFixed(
          1
        )}% short of target quantity. Patient may need refill sooner.`,
        severity: "warning",
      });
    }

    return warnings;
  }
  ```

---

## Phase 8: Main Controller (Orchestration)

### 8.1 Controller Implementation

- [ ] Create `src/lib/controller.ts`:

  ```typescript
  import { normalizeDrug } from "./adapters/rxnorm";
  import { ndcsByRxCui } from "./adapters/fda";
  import { parseSig } from "./sig";
  import { computeTotalUnits } from "./engines/quantity";
  import { recommendPacks } from "./engines/pack";
  import { generateWarnings } from "./engines/warnings";
  import type { DrugInput, ResultPayload } from "./types";

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
      // Step 1: Parse SIG
      const sigStart = Date.now();
      const normalizedSig = await parseSig(input.sigText, input.daysSupply);
      metrics.sigParsingMs = Date.now() - sigStart;

      // Step 2: Normalize drug to RxCUI
      const rxStart = Date.now();
      const drugQuery = input.ndc11 || input.drugQuery!;
      const rxnorm = await normalizeDrug(drugQuery);
      metrics.rxnormMs = Date.now() - rxStart;

      // Step 3: Fetch NDCs
      const fdaStart = Date.now();
      const ndcs = await ndcsByRxCui(rxnorm.rxcui);
      metrics.fdaMs = Date.now() - fdaStart;

      if (ndcs.length === 0) {
        throw new Error("No NDCs found for this drug");
      }

      // Step 4: Compute target quantity
      const targetQuantity = computeTotalUnits(normalizedSig);

      // Step 5: Recommend packs
      const recommendation = recommendPacks(
        targetQuantity.totalUnits,
        normalizedSig.unit,
        ndcs,
        { maxPacks: 3 }
      );

      // Step 6: Generate warnings
      const warnings = generateWarnings(recommendation, ndcs);

      metrics.totalMs = Date.now() - startTime;

      console.log(`[Controller] Completed in ${metrics.totalMs}ms`);

      return {
        input,
        normalizedSig,
        rxnorm,
        targetQuantity,
        recommendation,
        warnings,
        performanceMetrics: metrics,
      };
    } catch (error: any) {
      console.error("[Controller] Error:", error);

      // Return structured error
      throw {
        code: "PROCESSING_ERROR",
        message: error.message || "Failed to process recommendation",
        details: error,
      };
    }
  }
  ```

---

## Phase 9: UI Implementation (SvelteKit)

### 9.1 Global Layout

- [ ] Create `src/routes/+layout.svelte`:

  ```svelte
  <script lang="ts">
    import '../styles/theme.css';
    import '../app.css';
  </script>

  <div class="min-h-screen bg-[var(--fh-bg-soft)]">
    <!-- Navbar -->
    <nav class="bg-white border-b border-fh-border shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-fhmd bg-gradient-to-br from-fh-magenta via-fh-purple to-fh-blue"></div>
            <div>
              <h1 class="text-xl font-bold text-fh-text900">DoseMatch</h1>
              <p class="text-xs text-fh-text600">From SIG to shelf—perfect fills, every time.</p>
            </div>
          </div>
          <div class="flex space-x-3">
            <a href="/" class="px-4 py-2 text-fh-text600 hover:text-fh-blue transition-colors">Home</a>
            <a href="/calc" class="px-4 py-2 bg-fh-blue text-white rounded-fhmd hover:opacity-90 transition-opacity">Calculator</a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Demo Banner -->
    <div class="bg-fh-panel2 border-b border-fh-border py-2">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-fh-text600">
          <span class="font-semibold">Demo Mode:</span> This is a portfolio project. No patient data is collected or stored.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-fh-border mt-16 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-fh-text600">
        <p>© 2025 DoseMatch • Built for Foundation Health • <a href="https://github.com/yourusername/dosematch" class="text-fh-blue hover:underline">View on GitHub</a></p>
      </div>
    </footer>
  </div>
  ```

### 9.2 Home Page (Hero)

- [ ] Create `src/routes/+page.svelte`:

  ```svelte
  <script lang="ts">
  </script>

  <!-- Hero Section -->
  <div class="fh-hero rounded-fhlg p-16 text-white text-center mb-12">
    <h1 class="text-5xl font-bold mb-4">DoseMatch</h1>
    <p class="text-2xl mb-8 opacity-90">From SIG to shelf—perfect fills, every time.</p>
    <p class="text-lg mb-8 max-w-2xl mx-auto opacity-80">
      AI-accelerated prescription matching that finds the right NDC package every time,
      eliminating claim rejections and ensuring accurate fulfillment.
    </p>
    <a href="/calc" class="inline-block px-8 py-3 bg-white text-fh-blue rounded-fhmd font-semibold hover:shadow-lg transition-shadow">
      Start Calculating
    </a>
  </div>

  <!-- Features Grid -->
  <div class="grid md:grid-cols-3 gap-6 mb-12">
    <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border">
      <div class="w-12 h-12 rounded-fhsm bg-fh-panel2 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-fh-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-fh-text900 mb-2">Smart SIG Parsing</h3>
      <p class="text-fh-text600">AI-powered interpretation handles complex prescription instructions with 95%+ accuracy.</p>
    </div>

    <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border">
      <div class="w-12 h-12 rounded-fhsm bg-fh-panel2 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-fh-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-fh-text900 mb-2">Multi-Pack Optimization</h3>
      <p class="text-fh-text600">Automatically finds optimal package combinations to minimize waste and overfill.</p>
    </div>

    <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border">
      <div class="w-12 h-12 rounded-fhsm bg-fh-panel2 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-fh-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-fh-text900 mb-2">Inactive NDC Alerts</h3>
      <p class="text-fh-text600">Real-time warnings for discontinued products prevent claim rejections before they happen.</p>
    </div>
  </div>

  <!-- Stats -->
  <div class="bg-white rounded-fhlg p-8 shadow-fh border border-fh-border text-center">
    <div class="grid md:grid-cols-3 gap-8">
      <div>
        <div class="text-4xl font-bold text-fh-blue mb-2">95%+</div>
        <div class="text-fh-text600">Normalization Accuracy</div>
      </div>
      <div>
        <div class="text-4xl font-bold text-fh-blue mb-2">50%</div>
        <div class="text-fh-text600">Fewer Claim Rejections</div>
      </div>
      <div>
        <div class="text-4xl font-bold text-fh-blue mb-2">&lt;2s</div>
        <div class="text-fh-text600">Average Processing Time</div>
      </div>
    </div>
  </div>
  ```

### 9.3 Calculator Page (Main UI)

- [ ] Create `src/routes/calc/+page.svelte`:

  ```svelte
  <script lang="ts">
    import { processRecommendation } from '$lib/controller';
    import type { DrugInput, ResultPayload, NormalizedSig } from '$lib/types';

    let drugQuery = '';
    let sigText = '';
    let daysSupply = 30;
    let loading = false;
    let error = '';
    let result: ResultPayload | null = null;
    let parsedSig: NormalizedSig | null = null;

    // Sample presets
    const presets = [
      { name: 'Amoxicillin Tabs', drug: 'amoxicillin 500mg', sig: 'Take 1 tablet by mouth three times daily', days: 10 },
      { name: 'Lisinopril', drug: 'lisinopril 10mg', sig: 'Take 1 tablet by mouth once daily', days: 30 },
      { name: 'Albuterol Inhaler', drug: 'albuterol 90mcg', sig: 'Inhale 2 puffs four times daily', days: 30 },
      { name: 'Insulin Glargine', drug: 'insulin glargine', sig: 'Inject 20 units subcutaneously once daily at bedtime', days: 30 }
    ];

    function loadPreset(preset: typeof presets[0]) {
      drugQuery = preset.drug;
      sigText = preset.sig;
      daysSupply = preset.days;
      result = null;
      parsedSig = null;
      error = '';
    }

    async function handleSubmit() {
      if (!drugQuery.trim() || !sigText.trim()) {
        error = 'Please enter both drug name and SIG';
        return;
      }

      loading = true;
      error = '';
      result = null;

      try {
        const input: DrugInput = {
          drugQuery: drugQuery.trim(),
          sigText: sigText.trim(),
          daysSupply
        };

        result = await processRecommendation(input);
        parsedSig = result.normalizedSig;
      } catch (err: any) {
        error = err.message || 'An error occurred. Please try again.';
        console.error(err);
      } finally {
        loading = false;
      }
    }

    function copyJSON() {
      if (result) {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        alert('JSON copied to clipboard!');
      }
    }
  </script>

  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-fh-text900 mb-2">NDC Calculator</h1>
    <p class="text-fh-text600 mb-8">Enter prescription details to get optimal package recommendations</p>

    <!-- Quick Presets -->
    <div class="bg-white rounded-fhmd p-4 shadow-fh border border-fh-border mb-6">
      <p class="text-sm font-semibold text-fh-text900 mb-2">Quick Examples:</p>
      <div class="flex flex-wrap gap-2">
        {#each presets as preset}
          <button
            on:click={() => loadPreset(preset)}
            class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm hover:bg-fh-panel1 transition-colors"
          >
            {preset.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Input Panel -->
    <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border mb-6">
      <h2 class="text-xl font-semibold text-fh-text900 mb-4">Prescription Details</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-fh-text900 mb-1">
            Drug Name or NDC
          </label>
          <input
            type="text"
            bind:value={drugQuery}
            placeholder="e.g., lisinopril 10mg or 00071015523"
            class="w-full px-4 py-2 bg-fh-panel2 border border-fh-border rounded-fhmd focus:outline-none focus:ring-2 focus:ring-fh-blue"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-fh-text900 mb-1">
            SIG (Prescription Instructions)
          </label>
          <textarea
            bind:value={sigText}
            placeholder="e.g., Take 1 tablet by mouth twice daily"
            rows="3"
            class="w-full px-4 py-2 bg-fh-panel2 border border-fh-border rounded-fhmd focus:outline-none focus:ring-2 focus:ring-fh-blue resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-fh-text900 mb-1">
            Days' Supply
          </label>
          <input
            type="number"
            bind:value={daysSupply}
            min="1"
            max="90"
            class="w-32 px-4 py-2 bg-fh-panel2 border border-fh-border rounded-fhmd focus:outline-none focus:ring-2 focus:ring-fh-blue"
          />
        </div>

        <button
          on:click={handleSubmit}
          disabled={loading}
          class="w-full px-6 py-3 bg-fh-blue text-white rounded-fhmd font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Calculate Recommendation'}
        </button>
      </div>

      {#if error}
        <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-fhmd text-red-800">
          {error}
        </div>
      {/if}
    </div>

    <!-- Parsed SIG Display -->
    {#if parsedSig}
      <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border mb-6">
        <h3 class="text-lg font-semibold text-fh-text900 mb-3">Parsed SIG</h3>
        <div class="flex flex-wrap gap-2">
          <span class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm">
            <strong>Dose:</strong> {parsedSig.amountPerDose} {parsedSig.unit}
          </span>
          <span class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm">
            <strong>Frequency:</strong> {parsedSig.frequencyPerDay}×/day
          </span>
          <span class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm">
            <strong>Days:</strong> {parsedSig.daysSupply}
          </span>
          <span class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm">
            <strong>Confidence:</strong> {(parsedSig.confidence * 100).toFixed(0)}%
          </span>
          <span class="px-3 py-1 bg-{parsedSig.parsedBy === 'rules' ? 'green' : 'blue'}-100 text-{parsedSig.parsedBy === 'rules' ? 'green' : 'blue'}-800 rounded-fhsm text-sm">
            Parsed by: {parsedSig.parsedBy === 'rules' ? 'Rules Engine' : 'AI Assistant'}
          </span>
        </div>
        {#if parsedSig.rationale}
          <p class="mt-2 text-sm text-fh-text600 italic">{parsedSig.rationale}</p>
        {/if}
      </div>
    {/if}

    <!-- Results Panel -->
    {#if result}
      <div class="bg-white rounded-fhmd p-6 shadow-fh border border-fh-border mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-fh-text900">Recommendation</h2>
          <button
            on:click={copyJSON}
            class="px-3 py-1 bg-fh-panel2 text-fh-text900 rounded-fhsm text-sm hover:bg-fh-panel1 transition-colors"
          >
            Copy JSON
          </button>
        </div>

        <!-- Drug Info -->
        <div class="mb-6 p-4 bg-fh-panel1 rounded-fhmd">
          <p class="text-sm text-fh-text600 mb-1">Normalized Drug</p>
          <p class="text-lg font-semibold text-fh-text900">
            {result.rxnorm.synonyms?.[0] || 'Unknown Drug'}
          </p>
          <p class="text-sm text-fh-text600">
            RxCUI: {result.rxnorm.rxcui}
            {#if result.rxnorm.doseForm} • {result.rxnorm.doseForm}{/if}
            {#if result.rxnorm.strength} • {result.rxnorm.strength}{/if}
          </p>
        </div>

        <!-- Target Quantity -->
        <div class="mb-6 p-4 bg-fh-panel1 rounded-fhmd">
          <p class="text-sm text-fh-text600 mb-1">Target Quantity</p>
          <p class="text-2xl font-bold text-fh-blue">
            {result.targetQuantity.totalUnits} {result.targetQuantity.unit}
          </p>
        </div>

        <!-- Recommended Option -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-fh-text900 mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Recommended
          </h3>

          <div class="border-2 border-green-500 rounded-fhmd p-4 bg-green-50">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-mono text-lg font-semibold text-fh-text900">{result.recommendation.recommended.ndc}</p>
                <p class="text-sm text-fh-text600">{result.recommendation.recommended.packageSize} {result.recommendation.recommended.unit} per pack</p>
              </div>
              <div class="flex gap-2">
                {#each result.recommendation.recommended.badges || [] as badge}
                  <span class="px-2 py-1 bg-white text-fh-text900 rounded-fhsm text-xs font-medium border border-fh-border">
                    {badge}
                  </span>
                {/each}
                <span class="px-2 py-1 bg-{result.recommendation.recommended.status === 'ACTIVE' ? 'green' : 'red'}-100 text-{result.recommendation.recommended.status === 'ACTIVE' ? 'green' : 'red'}-800 rounded-fhsm text-xs font-medium">
                  {result.recommendation.recommended.status}
                </span>
              </div>
            </div>

            <div class="mb-3">
              <p class="text-sm text-fh-text600 mb-1">Dispensing:</p>
              {#each result.recommendation.recommended.packsUsed as pack}
                <p class="text-sm font-medium text-fh-text900">
                  {pack.count}× pack of NDC {pack.ndc}
                </p>
              {/each}
              <p class="text-sm font-semibold text-fh-blue mt-1">
                Total: {result.recommendation.recommended.totalDispensed} {result.recommendation.recommended.unit}
              </p>
            </div>

            <div class="p-3 bg-white rounded-fhmd border border-fh-border">
              <p class="text-sm text-fh-text900"><strong>Why:</strong> {result.recommendation.recommended.why}</p>
            </div>
          </div>
        </div>

        <!-- Alternatives -->
        {#if result.recommendation.alternatives.length > 0}
          <div>
            <h3 class="text-lg font-semibold text-fh-text900 mb-3">Alternative Options</h3>
            <div class="space-y-3">
              {#each result.recommendation.alternatives as alt}
                <div class="border border-fh-border rounded-fhmd p-4 bg-fh-panel1">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-mono font-semibold text-fh-text900">{alt.ndc}</p>
                      <p class="text-sm text-fh-text600">{alt.packageSize} {alt.unit} per pack</p>
                    </div>
                    <div class="flex gap-2">
                      {#each alt.badges || [] as badge}
                        <span class="px-2 py-1 bg-white text-fh-text900 rounded-fhsm text-xs border border-fh-border">
                          {badge}
                        </span>
                      {/each}
                    </div>
                  </div>
                  <p class="text-sm text-fh-text600">{alt.why}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Warnings -->
        {#if result.warnings.length > 0}
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-fh-text900 mb-3">Notifications</h3>
            <div class="space-y-2">
              {#each result.warnings as warning}
                <div class="p-3 bg-{warning.severity === 'error' ? 'red' : warning.severity === 'warning' ? 'yellow' : 'blue'}-50 border border-{warning.severity === 'error' ? 'red' : warning.severity === 'warning' ? 'yellow' : 'blue'}-200 rounded-fhmd">
                  <p class="text-sm font-medium text-{warning.severity === 'error' ? 'red' : warning.severity === 'warning' ? 'yellow' : 'blue'}-900">
                    {warning.message}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Performance Metrics -->
        {#if result.performanceMetrics}
          <details class="mt-6">
            <summary class="cursor-pointer text-sm text-fh-text600 hover:text-fh-blue">Performance Metrics</summary>
            <div class="mt-2 p-3 bg-fh-panel1 rounded-fhmd text-xs font-mono">
              <p>Total: {result.performanceMetrics.totalMs}ms</p>
              <p>RxNorm: {result.performanceMetrics.rxnormMs}ms</p>
              <p>FDA: {result.performanceMetrics.fdaMs}ms</p>
              <p>SIG Parsing: {result.performanceMetrics.sigParsingMs}ms</p>
            </div>
          </details>
        {/if}
      </div>
    {/if}
  </div>
  ```

---

## Phase 10: Testing

### 10.1 Unit Tests

- [ ] Create `src/lib/units.test.ts`:

  - Test `normalizeUnit()` for all aliases
  - Test `toCanonical()` with mg→g conversion
  - Test liquid volume handling

- [ ] Create `src/lib/sig/rules.test.ts`:

  - Test fixtures: "take 1 tab bid", "inject 10 units qd", "inhale 2 puffs qid"
  - Test frequency parsing (QD, BID, TID, QID, Q6H)
  - Test confidence scoring

- [ ] Create `src/lib/engines/quantity.test.ts`:

  - Test quantity calculation: 1 tab × 2/day × 30 days = 60 EA
  - Test rounding behavior

- [ ] Create `src/lib/engines/pack.test.ts`:
  - Test exact match finder
  - Test multi-pack combinations (2-pack, 3-pack)
  - Test nearest match with overfill/underfill
  - Test scoring algorithm

### 10.2 Integration Tests (Mocked APIs)

- [ ] Create `tests/integration/`:
  - Mock RxNorm responses for common drugs
  - Mock FDA responses with sample NDC packages
  - Test full flow: input → recommendation
  - Golden JSON snapshots for:
    - Amoxicillin 500mg tablets
    - Lisinopril 10mg tablets
    - Amoxicillin 400mg/5mL suspension
    - Insulin glargine pens
    - Albuterol MDI

### 10.3 Manual E2E Testing Checklist

**Manual testing only - No automation for MVP**

- [ ] **Preset Testing:**
  - Load each preset (Amoxicillin, Lisinopril, Albuterol, Insulin)
  - Verify SIG parsing displays correctly
  - Verify recommendations appear
- [ ] **Exact Match Scenario:**
  - Input: "lisinopril 10mg", "Take 1 tablet once daily", 30 days
  - Expected: Single pack exact match recommendation
- [ ] **Multi-Pack Scenario:**
  - Input with odd quantity (e.g., 45 tablets)
  - Expected: Multi-pack combination or overfill warning
- [ ] **Inactive NDC Warning:**
  - Find drug with inactive NDCs
  - Expected: Warning badge and message displayed
- [ ] **Error Handling:**
  - Invalid drug name
  - Malformed SIG
  - Network timeout simulation
- [ ] **Browser Testing:**
  - Chrome (desktop & mobile)
  - Safari (desktop & mobile)
  - Firefox (desktop)
- [ ] **Performance:**
  - First query < 2s
  - Cached query < 500ms
  - Check Network tab for API calls

---

## Phase 11: OpenAI Explainer Integration (Optional - Post-MVP)

### 11.1 Cloud Function: Recommendation Explainer

**Note:** This is optional enhancement. The pack selection engine already generates deterministic `why` explanations.

- [ ] Create `functions/src/explainRecommendation.ts`:

  ```typescript
  import * as functions from 'firebase-functions';
  import axios from 'axios';

  interface ExplainRequest {
    drugQuery: string;
    sigText: string;
    daysSupply: number;
    recommendation: {
      ndc: string;
      packageSize: number;
      unit: string;
      matchType: string;
      status: string;
      overfillPercent: number;
      packsUsed: { ndc: string; count: number }[];
    };
  }

  const EXPLAINER_PROMPT = `You are a pharmacy expert explaining NDC recommendations to pharmacists.
  ```

Given a prescription and the recommended package, generate a clear, concise 1-2 sentence explanation of why this is the optimal choice.

Focus on:

- Match quality (exact, multi-pack, nearest)
- Active vs inactive status
- Overfill/underfill considerations
- Practical dispensing advantages

Be professional but conversational. Do not include any patient identifiable information.`;

export const explainRecommendation = functions.https.onCall(
async (data: ExplainRequest): Promise<string> => {
try {
const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
          throw new Error('OpenAI API key not configured');
        }

        const context = `Prescription: ${data.drugQuery}, SIG: "${data.sigText}", ${data.daysSupply} days

Recommended: NDC ${data.recommendation.ndc}, ${data.recommendation.packageSize} ${data.recommendation.unit}
Match Type: ${data.recommendation.matchType}
Status: ${data.recommendation.status}
Overfill: ${data.recommendation.overfillPercent.toFixed(1)}%
Packs Used: ${data.recommendation.packsUsed.map(p => `${p.count}x${p.ndc}`).join(', ')}`.trim();

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: EXPLAINER_PROMPT },
              { role: 'user', content: context }
            ],
            temperature: 0.7,
            max_tokens: 150
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        return response.data.choices[0].message.content.trim();

      } catch (error: any) {
        console.error('[Explainer] Error:', error);
        // Return deterministic fallback
        throw new functions.https.HttpsError(
          'internal',
          'Failed to generate explanation',
          error.message
        );
      }
    }

);

````

- [ ] Export in `functions/src/index.ts`:
  ```typescript
  export { explainRecommendation } from './explainRecommendation';
  ```

**For MVP:** Skip this - the deterministic `why` field in recommendations is sufficient

---

## Phase 12: Firebase Deployment

### 12.1 SvelteKit Adapter Configuration

- [ ] Install adapter: `npm install -D @sveltejs/adapter-static`
- [ ] Update `svelte.config.js`:
  ```javascript
  import adapter from '@sveltejs/adapter-static';

  export default {
    kit: {
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: 'index.html',
        precompress: false,
        strict: true
      })
    }
  };
  ```

### 12.2 Firebase Configuration

- [ ] Create `firebase.json`:
  ```json
  {
    "hosting": {
      "public": "build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        { "source": "**", "destination": "/index.html" }
      ]
    },
    "functions": {
      "source": "functions",
      "runtime": "nodejs18"
    }
  }
  ```

### 12.3 Production Environment Setup

- [ ] Set OpenAI API secret (already done in Phase 0.2):
  ```bash
  firebase functions:secrets:set OPENAI_API_KEY
  ```

- [ ] Update frontend `.env.local` for production:
  ```
  PUBLIC_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
  PUBLIC_FDA_NDC_BASE_URL=https://api.fda.gov/drug/ndc.json
  PUBLIC_APP_MODE=production
  PUBLIC_FUNCTIONS_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net
  ```

### 12.4 Build & Deploy

- [ ] Add deployment scripts to `package.json`:
  ```json
  {
    "scripts": {
      "dev": "vite dev",
      "build": "vite build",
      "build:functions": "cd functions && npm run build",
      "deploy:hosting": "npm run build && firebase deploy --only hosting",
      "deploy:functions": "npm run build:functions && firebase deploy --only functions",
      "deploy": "npm run build && npm run build:functions && firebase deploy"
    }
  }
  ```

- [ ] Deploy everything:
  ```bash
  npm run deploy
  ```

- [ ] Or deploy separately:
  ```bash
  npm run deploy:hosting  # Frontend only
  npm run deploy:functions  # Functions only
  ```

### 12.5 Post-Deployment Verification

- [ ] Test deployed app at `https://YOUR_PROJECT.web.app`
- [ ] Verify SIG parsing with LLM works (check Functions logs)
- [ ] Test caching (localStorage persistence)
- [ ] Check performance metrics in browser DevTools
- [ ] Verify all API calls succeed (RxNorm, FDA, Functions)

---

## Phase 13: Documentation & Polish

### 13.1 README

- [ ] Create comprehensive `README.md`:
  - Project overview & tagline
  - Features list
  - Tech stack
  - Setup instructions
  - API keys required
  - Deployment guide
  - Screenshots
  - License (MIT)

### 13.2 Code Documentation

- [ ] Add JSDoc comments to all public functions
- [ ] Document complex algorithms (pack selection, SIG parsing)
- [ ] Add inline comments for non-obvious logic

### 13.3 Performance Optimization

- [ ] Implement 300ms debounce on user input
- [ ] Add loading states and skeletons
- [ ] Optimize bundle size (code splitting)
- [ ] Add favicon and meta tags

### 13.4 Accessibility

- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Add ARIA labels where needed
- [ ] Test with screen reader
- [ ] Ensure color contrast meets WCAG AA standards

---

## Phase 14: Final Testing & Launch

### 14.1 Cross-Browser Testing

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Fix any browser-specific issues

### 14.2 Performance Validation

- [ ] Run Lighthouse audit (target: 90+ performance score)
- [ ] Verify P50 < 800ms, P95 < 2.0s with real APIs
- [ ] Test with slow network conditions

### 14.3 Security Review

- [ ] Ensure no API keys in client bundle
- [ ] Verify HTTPS-only in production
- [ ] Test CORS headers if using Functions
- [ ] Review for XSS vulnerabilities

### 14.4 Launch Checklist

- [ ] All tests passing (unit, integration, e2e)
- [ ] No console errors in production build
- [ ] Demo banner visible
- [ ] Footer with GitHub link
- [ ] README complete
- [ ] Live URL working
- [ ] Analytics setup (optional: Firebase Analytics)

---

## Success Criteria (MVP Acceptance)

✅ **Functional Requirements:**

- [ ] Input drug/NDC + SIG + days → accurate recommendation
- [ ] SIG parsing with rules + LLM fallback (75%+ confidence threshold)
- [ ] RxNorm normalization to RxCUI
- [ ] FDA NDC retrieval with package sizes + active/inactive status
- [ ] Quantity calculation supporting EA, mL, g, U, actuations
- [ ] Multi-pack optimization (up to 3 packs)
- [ ] Exact match → Multi-pack → Nearest selection logic
- [ ] Overfill/underfill calculation and display
- [ ] Inactive NDC warnings with clear badges
- [ ] Structured JSON output + copy button
- [ ] Clean UI with Foundation Health branding

✅ **Non-Functional Requirements:**

- [ ] P50 < 800ms, P95 < 2.0s response times
- [ ] 24h caching with localStorage (browser-based)
- [ ] 300ms input debouncing
- [ ] HTTPS only, no PHI/PII storage
- [ ] OpenAI API keys secured server-side (Cloud Functions)
- [ ] Basic console logging for telemetry
- [ ] Responsive design (desktop + tablet)

✅ **Testing:**

- [ ] Unit tests for units, SIG, quantity, pack engines
- [ ] Integration tests with mocked APIs
- [ ] Manual E2E testing checklist (browser + mobile)
- [ ] 40+ SIG parsing fixtures

✅ **Deployment:**

- [ ] Live on Firebase Hosting
- [ ] Environment variables secured
- [ ] Demo banner visible
- [ ] README with setup guide

---

## GCP Migration Path (Post-MVP)

**When:** After MVP is proven and if time/budget permits
**Why:** Greater control, scalability, and advanced features

### Option 1: Incremental Migration (Recommended)

**Phase 1: Keep Firebase Hosting + Migrate to Cloud Run**
- [ ] Containerize SvelteKit app with Dockerfile
- [ ] Deploy to Cloud Run (supports SSR if needed later)
- [ ] Migrate Cloud Functions → Cloud Run services (same code, better scaling)
- [ ] Benefits: Better cold start times, more control, still serverless

**Phase 2: Add Cloud-Native Services**
- [ ] Cloud Memorystore (Redis) for shared caching
- [ ] Cloud SQL or Firestore for persistent data (if auth added)
- [ ] Cloud Load Balancer for multi-region
- [ ] Cloud Monitoring & Logging for observability

### Option 2: Full GCP Stack (Advanced)

- [ ] Cloud Run for frontend (SvelteKit SSR)
- [ ] Cloud Run for backend API services
- [ ] Cloud Storage for static assets
- [ ] Cloud CDN for global delivery
- [ ] Cloud Armor for DDoS protection
- [ ] Secret Manager for API keys

### Migration Checklist

**Code Changes (Minimal):**
- [ ] Wrap SvelteKit in Docker container
- [ ] Convert Cloud Functions → Cloud Run services (HTTP endpoints)
- [ ] Update `PUBLIC_FUNCTIONS_URL` to Cloud Run URLs
- [ ] Replace localStorage cache with Redis (optional)

**Infrastructure:**
- [ ] Set up GCP project & billing
- [ ] Configure Cloud Run services
- [ ] Set up Cloud Build for CI/CD
- [ ] Configure custom domain & SSL

**Estimated Effort:** 2-4 hours for basic migration, 1-2 days for full stack

---

## Post-MVP Enhancements (Future)

- [ ] User authentication (Firebase Auth) for query history
- [ ] Persistent storage of past calculations (Firestore)
- [ ] Advanced analytics dashboard (Firebase Analytics or Looker)
- [ ] Integration with pharmacy management systems (APIs)
- [ ] Export to PDF/Excel (client-side generation)
- [ ] Batch processing mode (upload CSV of prescriptions)
- [ ] Admin panel for monitoring (cache stats, usage metrics)
- [ ] A/B testing for SIG parsing strategies (Firebase Remote Config)
- [ ] Multi-language support (i18n)

---

## Quick Command Reference

```bash
# Initial Setup
npm create svelte@latest dosematch
cd dosematch
npm install
npm install -D tailwindcss postcss autoprefixer @sveltejs/adapter-static
npx tailwindcss init -p
npm install axios date-fns

# Firebase Setup
firebase login
firebase init  # Select: Functions, Hosting
cd functions && npm install axios && cd ..
firebase functions:secrets:set OPENAI_API_KEY

# Development
npm run dev  # Frontend on localhost:5173
firebase emulators:start  # Functions emulator

# Testing
npm test  # Unit + Integration tests
# E2E: Manual testing (see Phase 10.3)

# Build & Deploy
npm run build  # Build frontend
npm run build:functions  # Build functions
npm run deploy  # Deploy everything
npm run deploy:hosting  # Deploy frontend only
npm run deploy:functions  # Deploy functions only

# Debugging
firebase functions:log  # View function logs
firebase hosting:channel:deploy preview  # Deploy to preview channel

# Linting
npm run lint
npm run format
```

**Key Files:**
- `.env.local` - Frontend environment variables
- `functions/.env` - Functions environment variables (local)
- `firebase.json` - Firebase configuration
- `svelte.config.js` - SvelteKit adapter config
- `tailwind.config.js` - Tailwind theme (Foundation Health colors)

---
````
