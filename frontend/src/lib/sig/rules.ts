import { normalizeUnit } from "../units";
import type { NormalizedSig, CanonicalUnit } from "../types";

interface FrequencyMap {
  [key: string]: number;
}

const FREQUENCY_MAP: FrequencyMap = {
  // Phrases first (longer patterns)
  "three times daily": 3,
  "three times a day": 3,
  "four times daily": 4,
  "four times a day": 4,
  "twice daily": 2,
  "twice a day": 2,
  "once daily": 1,
  "once a day": 1,
  "every 4 hours": 6,
  "every 6 hours": 4,
  "every 8 hours": 3,
  "every 12 hours": 2,
  "every 24 hours": 1,
  "at bedtime": 1,
  "at night": 1,
  "in the morning": 1,
  "each morning": 1,
  "each bedtime": 1,
  // Abbreviations (shorter patterns)
  qid: 4,
  tid: 3,
  tds: 3,
  bid: 2,
  qd: 1,
  od: 1,
  q4h: 6,
  q6h: 4,
  q8h: 3,
  q12h: 2,
  q24h: 1,
  qhs: 1,
  qam: 1,
};

interface ParsedSigDetails {
  amountPerDose: number;
  amountMax?: number;
  unit: CanonicalUnit;
  frequencyPerDay: number;
  frequencyMax?: number;
  route?: string;
  duration?: number;
  durationUnit?: string;
  indication?: string;
  isAsNeeded: boolean;
  maxDailyDose?: number;
  strength?: number;
  strengthUnit?: string;
}

/**
 * Extract dose with support for ranges (e.g., "1-2 tablets")
 * Also handles strength in dose (e.g., "500mg")
 */
function extractDose(sig: string): Partial<ParsedSigDetails> | null {
  // Pattern 1: "take 1-2 tablets" (dose range)
  const doseRangePattern =
    /(?:take|inject|inhale|apply|use|instill)\s+(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*([a-z]+)/i;
  const doseRangeMatch = sig.match(doseRangePattern);
  if (doseRangeMatch) {
    return {
      amountPerDose: parseFloat(doseRangeMatch[1]),
      amountMax: parseFloat(doseRangeMatch[2]),
      unit: normalizeUnit(doseRangeMatch[3]),
    };
  }

  // Pattern 2: "take 2 tablets" (single dose)
  const dosePattern =
    /(?:take|inject|inhale|apply|use|instill)\s+(\d+\.?\d*)\s*([a-z]+)/i;
  const doseMatch = sig.match(dosePattern);
  if (doseMatch) {
    return {
      amountPerDose: parseFloat(doseMatch[1]),
      unit: normalizeUnit(doseMatch[2]),
    };
  }

  // Pattern 3: Strength-based (e.g., "500mg twice daily")
  // Look for number + strength unit without preceding verb
  const strengthOnlyPattern = /(\d+\.?\d*)\s*(mg|mcg|g|ml|u)(?:\s+(?:tablet|capsule|cap|tab|puff|dose|unit))?/i;
  const strengthMatch = sig.match(strengthOnlyPattern);
  if (strengthMatch) {
    const strengthValue = parseFloat(strengthMatch[1]);
    const strengthUnitRaw = strengthMatch[2].toLowerCase();
    // Map strength unit to canonical unit
    let unit: CanonicalUnit = "EA";
    if (["ml"].includes(strengthUnitRaw)) unit = "mL";
    else if (["g", "mg", "mcg"].includes(strengthUnitRaw)) unit = "g";
    else if (["u"].includes(strengthUnitRaw)) unit = "U";

    return {
      amountPerDose: 1, // Assume 1 dose unit when only strength is given
      unit,
      strength: strengthValue,
      strengthUnit: strengthUnitRaw,
    };
  }

  return null;
}

/**
 * Extract frequency with support for ranges (e.g., "every 4-6 hours")
 */
function extractFrequency(sig: string): { freq: number; freqMax?: number; confidence: number } {
  let frequencyPerDay = 1;
  let frequencyMax: number | undefined;
  let confidence = 0.5;

  // Pattern 0: Known abbreviations and word frequencies (QD, BID, twice, daily, etc.) - check FIRST
  // Sort by length descending to match longer patterns first (e.g., "twice daily" before "daily")
  const sortedFrequencies = Object.entries(FREQUENCY_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [pattern, freq] of sortedFrequencies) {
    // Use word boundary matching for word patterns, simple include for abbreviations
    let matches = false;
    if (pattern.length <= 3) {
      // Short abbreviations like "qd", "bid", "q6h" - use word boundary regex
      const abbrevPattern = new RegExp(`\\b${pattern}\\b`, "i");
      matches = abbrevPattern.test(sig);
    } else {
      // Longer phrases like "twice daily" - use exact substring matching
      matches = sig.includes(pattern);
    }

    if (matches) {
      frequencyPerDay = freq;
      confidence = 0.9;
      return { freq: frequencyPerDay, confidence };
    }
  }

  // Pattern 1: "X times daily/per day/a day"
  const timesPattern = /(\d+)\s*times?\s*(?:a\s*day|daily|per\s*day)/i;
  const timesMatch = sig.match(timesPattern);
  if (timesMatch) {
    frequencyPerDay = parseInt(timesMatch[1]);
    confidence = 0.95;
    return { freq: frequencyPerDay, confidence };
  }

  // Pattern 2: Frequency range "every 4-6 hours"
  const freqRangePattern = /every\s+(\d+)-(\d+)\s*(?:hours?|hrs?)/i;
  const freqRangeMatch = sig.match(freqRangePattern);
  if (freqRangeMatch) {
    const minHours = parseInt(freqRangeMatch[1]);
    const maxHours = parseInt(freqRangeMatch[2]);
    frequencyPerDay = Math.floor(24 / maxHours); // Use max hours for minimum frequency
    frequencyMax = Math.floor(24 / minHours); // Use min hours for maximum frequency
    confidence = 0.95;
    return { freq: frequencyPerDay, freqMax: frequencyMax, confidence };
  }

  // Pattern 3: "every X hours"
  const everyPattern = /every\s+(\d+)\s*(?:hours?|hrs?|h)/i;
  const everyMatch = sig.match(everyPattern);
  if (everyMatch) {
    const hours = parseInt(everyMatch[1]);
    frequencyPerDay = Math.floor(24 / hours);
    confidence = 0.9;
    return { freq: frequencyPerDay, confidence };
  }

  return { freq: 1, confidence: 0.3 };
}

/**
 * Extract route of administration
 */
function extractRoute(sig: string): string | undefined {
  // Pattern 1: With prepositions (by mouth, via IV, in eye, etc.)
  const preppedPattern =
    /(?:by|via|in|into|through)\s+(mouth|po|topical|skin|eye|eyes|ear|ears|rectum|rectally|vaginally|sublingual|inhaled|inhalation|iv|intravenous|im|intramuscular|sc|subcutaneous)/i;
  const preppedMatch = sig.match(preppedPattern);
  if (preppedMatch) {
    return preppedMatch[1].toLowerCase();
  }

  // Pattern 2: Route words without prepositions (inhaled, PO, IV, topical, etc.)
  const routePattern = /\b(po|iv|im|sc|inhaled|inhalation|topical|sublingual|rectal|rectally|vaginal|vaginally|oral|intravenous|intramuscular|subcutaneous|transdermal)\b/i;
  const routeMatch = sig.match(routePattern);
  if (routeMatch) {
    return routeMatch[1].toLowerCase();
  }

  return undefined;
}

/**
 * Extract duration (e.g., "for 7 days", "x7d")
 */
function extractDuration(sig: string): { duration: number; unit: string } | undefined {
  // Pattern 1: "for X days/weeks/months"
  const forPattern = /for\s+(\d+)\s*(days?|weeks?|months?)/i;
  const forMatch = sig.match(forPattern);
  if (forMatch) {
    return {
      duration: parseInt(forMatch[1]),
      unit: forMatch[2].toLowerCase(),
    };
  }

  // Pattern 2: "x7d" or "x 7 days"
  const xPattern = /x\s*(\d+)\s*(?:days?|d)/i;
  const xMatch = sig.match(xPattern);
  if (xMatch) {
    return {
      duration: parseInt(xMatch[1]),
      unit: "days",
    };
  }

  return undefined;
}

/**
 * Extract indication and check for PRN (as needed)
 */
function extractIndicationAndPRN(sig: string): { indication?: string; isAsNeeded: boolean } {
  let isAsNeeded = false;

  if (sig.includes("prn") || sig.includes("as needed")) {
    isAsNeeded = true;
  }

  // Extract indication after "for" or "prn"
  const indicationPattern = /(?:for|prn)\s+([a-z\s]+?)(?:\.|$|,|as needed)/i;
  const indicationMatch = sig.match(indicationPattern);
  const indication = indicationMatch ? indicationMatch[1].trim() : undefined;

  return { indication, isAsNeeded };
}

/**
 * Calculate maximum daily dose
 */
function calculateMaxDailyDose(
  amountPerDose: number,
  frequencyPerDay: number,
  amountMax?: number,
  frequencyMax?: number
): number {
  // Use max values if they exist (for ranges)
  const maxAmount = amountMax || amountPerDose;
  const maxFreq = frequencyMax || frequencyPerDay;
  return maxAmount * maxFreq;
}

export function parseSigWithRules(
  sigText: string,
  daysSupply: number
): NormalizedSig | null {
  const sig = sigText.toLowerCase().trim();
  console.log(`[SIG Rules Enhanced] Parsing: "${sigText}"`);

  // Extract dose
  const doseData = extractDose(sig);
  if (!doseData || !doseData.unit) {
    console.log("[SIG Rules Enhanced] No dose pattern found");
    return null;
  }

  const amountPerDose = doseData.amountPerDose || 1;
  const unit = doseData.unit;

  // Extract frequency
  const freqData = extractFrequency(sig);
  const frequencyPerDay = freqData.freq;

  // Extract additional context
  const route = extractRoute(sig);
  const duration = extractDuration(sig);
  const { indication, isAsNeeded } = extractIndicationAndPRN(sig);

  // Calculate max daily dose
  const maxDailyDose = calculateMaxDailyDose(
    amountPerDose,
    frequencyPerDay,
    doseData.amountMax,
    freqData.freqMax
  );

  // Calculate confidence based on what we found
  let confidence = 0.7; // Base confidence for finding dose + frequency

  if (freqData.confidence > 0.9) confidence += 0.15;
  else if (freqData.confidence > 0.8) confidence += 0.1;

  if (route) confidence += 0.05;
  if (duration) confidence += 0.05;
  if (indication) confidence += 0.05;

  // Cap at 0.95
  confidence = Math.min(0.95, confidence);

  console.log(
    `[SIG Rules Enhanced] Parsed: ${amountPerDose}${doseData.amountMax ? "-" + doseData.amountMax : ""} ${unit}, ` +
      `${frequencyPerDay}${freqData.freqMax ? "-" + freqData.freqMax : ""}x/day, ` +
      `route: ${route || "unknown"}, duration: ${duration?.duration}${duration?.unit || ""}, ` +
      `PRN: ${isAsNeeded}, max daily: ${maxDailyDose}, confidence: ${confidence.toFixed(2)}`
  );

  // Require minimum confidence
  if (confidence < 0.7) {
    console.log("[SIG Rules Enhanced] Confidence too low, falling back to LLM");
    return null;
  }

  return {
    amountPerDose,
    unit,
    frequencyPerDay,
    daysSupply,
    confidence,
    parsedBy: "rules",
    // Extended fields for complex parsing
    amountMax: doseData.amountMax,
    frequencyMax: freqData.freqMax,
    route,
    duration: duration?.duration,
    durationUnit: duration?.unit as any,
    indication,
    isAsNeeded,
    maxDailyDose,
  } as any;
}
