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
  rxcuiCandidates?: string[]; // Fallback RxCUIss to try if primary doesn't work
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

export interface DirectNdcCheck {
  ndc: string;
  status: "ACTIVE" | "INACTIVE" | "UNKNOWN";
  isInactive: boolean;
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
  directNdcCheck?: DirectNdcCheck; // If user provided an NDC directly
  performanceMetrics?: {
    totalMs: number;
    rxnormMs: number;
    fdaMs: number;
    sigParsingMs: number;
    cacheHits: number;
  };
}
