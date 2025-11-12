import { parseSigWithRules } from "./rules";
import { normalizeUnit } from "../units";
import { config } from "../config";
import type { NormalizedSig } from "../types";

const CONFIDENCE_THRESHOLD = 0.90;

async function callLLMFunction(
  sigText: string,
  daysSupply: number
): Promise<NormalizedSig> {
  const response = await fetch(`${config.functions.baseUrl}/parseSigWithLLM`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: { sigText, daysSupply },
    }),
  });

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
      confidence: 0.1,
      rationale: "Default fallback: no parsing succeeded",
      parsedBy: "fallback",
    };
  }
}
