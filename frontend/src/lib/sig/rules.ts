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
