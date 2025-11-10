import { describe, it, expect, vi, beforeEach } from "vitest";
import { processRecommendation } from "./controller";
import type { DrugInput, NdcRecord } from "./types";

// Mock the adapters, engines, and sig parser
vi.mock("./adapters/rxnorm", () => ({
  normalizeDrug: vi.fn(),
}));

vi.mock("./adapters/fda", () => ({
  ndcsByRxCui: vi.fn(),
}));

vi.mock("./sig", () => ({
  parseSig: vi.fn(),
}));

vi.mock("./engines/quantity", () => ({
  computeTotalUnits: vi.fn(),
}));

vi.mock("./engines/pack", () => ({
  recommendPacks: vi.fn(),
}));

vi.mock("./engines/warnings", () => ({
  generateWarnings: vi.fn(),
}));

import * as rxnormAdapter from "./adapters/rxnorm";
import * as fdaAdapter from "./adapters/fda";
import * as sigParser from "./sig";
import * as quantityEngine from "./engines/quantity";
import * as packEngine from "./engines/pack";
import * as warningsEngine from "./engines/warnings";

describe("Main Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processRecommendation", () => {
    it("should orchestrate a complete recommendation flow successfully", async () => {
      // Setup mock data
      const mockInput: DrugInput = {
        drugQuery: "Amoxicillin",
        sigText: "Take 500mg twice daily",
        daysSupply: 10,
      };

      const mockNormalizedSig = {
        amountPerDose: 500,
        unit: "mg" as const,
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 0.95,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "6871",
        doseForm: "CAPSULE",
        strength: "500 MG",
      };

      const mockNdcs: NdcRecord[] = [
        {
          ndc11: "49035041000",
          packageSize: 500,
          unit: "EA",
          status: "ACTIVE",
          labeler: "Sandoz",
          productName: "Amoxicillin Capsule",
        },
        {
          ndc11: "49035041100",
          packageSize: 100,
          unit: "EA",
          status: "ACTIVE",
          labeler: "Sandoz",
          productName: "Amoxicillin Capsule",
        },
      ];

      const mockTargetQuantity = 20; // 500mg * 2x/day * 10 days = 10,000mg = 20 capsules

      const mockRecommendation = {
        recommended: {
          ndc: "49035041100",
          packageSize: 100,
          unit: "EA",
          status: "ACTIVE",
          packsUsed: [{ ndc: "49035041100", count: 1 }],
          matchType: "EXACT" as const,
          overfillPercent: 0,
          underfillPercent: 0,
          totalDispensed: 100,
          why: "Exact match - 1 pack of 100 provides exactly 100 units",
          score: 1550,
        },
        alternatives: [],
      };

      const mockWarnings = [];

      // Setup mocks
      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue(mockNdcs);
      vi.mocked(quantityEngine.computeTotalUnits).mockReturnValue(
        mockTargetQuantity
      );
      vi.mocked(packEngine.recommendPacks).mockReturnValue(mockRecommendation);
      vi.mocked(warningsEngine.generateWarnings).mockReturnValue(mockWarnings);

      // Execute
      const result = await processRecommendation(mockInput);

      // Verify the result structure
      expect(result).toHaveProperty("input");
      expect(result).toHaveProperty("normalizedSig");
      expect(result).toHaveProperty("rxnorm");
      expect(result).toHaveProperty("targetQuantity");
      expect(result).toHaveProperty("recommendation");
      expect(result).toHaveProperty("warnings");
      expect(result).toHaveProperty("performanceMetrics");

      // Verify input is preserved
      expect(result.input).toEqual(mockInput);

      // Verify normalized SIG
      expect(result.normalizedSig).toEqual(mockNormalizedSig);

      // Verify RxNorm result
      expect(result.rxnorm).toEqual(mockRxnormResult);

      // Verify recommendation
      expect(result.recommendation).toEqual(mockRecommendation);

      // Verify warnings
      expect(result.warnings).toEqual(mockWarnings);

      // Verify performance metrics are tracked
      expect(result.performanceMetrics?.totalMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics?.sigParsingMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics?.rxnormMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics?.fdaMs).toBeGreaterThanOrEqual(0);

      // Verify all steps were called
      expect(sigParser.parseSig).toHaveBeenCalledWith(
        mockInput.sigText,
        mockInput.daysSupply
      );
      expect(rxnormAdapter.normalizeDrug).toHaveBeenCalledWith(
        mockInput.drugQuery
      );
      expect(fdaAdapter.ndcsByRxCui).toHaveBeenCalledWith(
        mockRxnormResult.rxcui
      );
      expect(packEngine.recommendPacks).toHaveBeenCalled();
      expect(warningsEngine.generateWarnings).toHaveBeenCalledWith(
        mockRecommendation,
        mockNdcs
      );
    });

    it("should handle NDC11 input instead of drug query", async () => {
      const mockInput: DrugInput = {
        ndc11: "49035041000",
        sigText: "Take 500mg once daily",
        daysSupply: 30,
      };

      const mockNormalizedSig = {
        amountPerDose: 500,
        unit: "mg" as const,
        frequencyPerDay: 1,
        daysSupply: 30,
        confidence: 0.9,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "6871",
        doseForm: "CAPSULE",
        strength: "500 MG",
      };

      const mockNdcs: NdcRecord[] = [
        {
          ndc11: "49035041000",
          packageSize: 500,
          unit: "EA",
          status: "ACTIVE",
          labeler: "Sandoz",
        },
      ];

      const mockTargetQuantity = 30;

      const mockRecommendation = {
        recommended: {
          ndc: "49035041000",
          packageSize: 500,
          unit: "EA",
          status: "ACTIVE",
          packsUsed: [{ ndc: "49035041000", count: 1 }],
          matchType: "NEAREST" as const,
          overfillPercent: 93,
          underfillPercent: 0,
          totalDispensed: 500,
          why: "Nearest match - 1 pack provides close to target",
          score: 1450,
        },
        alternatives: [],
      };

      const mockWarnings = [
        {
          code: "HIGH_OVERFILL",
          message: "⚠️ High overfill detected (93%)",
          severity: "warning" as const,
        },
      ];

      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue(mockNdcs);
      vi.mocked(quantityEngine.computeTotalUnits).mockReturnValue(
        mockTargetQuantity
      );
      vi.mocked(packEngine.recommendPacks).mockReturnValue(mockRecommendation);
      vi.mocked(warningsEngine.generateWarnings).mockReturnValue(mockWarnings);

      const result = await processRecommendation(mockInput);

      // Verify NDC11 was used for normalization
      expect(rxnormAdapter.normalizeDrug).toHaveBeenCalledWith(mockInput.ndc11);

      // Verify warnings included
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should throw error when no drug query or NDC11 provided", async () => {
      const mockInput: DrugInput = {
        sigText: "Take once daily",
        daysSupply: 10,
      };

      vi.mocked(sigParser.parseSig).mockResolvedValue({
        amountPerDose: 1,
        unit: "EA" as const,
        frequencyPerDay: 1,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules" as const,
      });

      await expect(processRecommendation(mockInput)).rejects.toThrow(
        "Either drugQuery or ndc11 must be provided"
      );
    });

    it("should throw error when RxNorm returns no NDCs", async () => {
      const mockInput: DrugInput = {
        drugQuery: "NonexistentDrug",
        sigText: "Take once daily",
        daysSupply: 10,
      };

      const mockNormalizedSig = {
        amountPerDose: 1,
        unit: "EA" as const,
        frequencyPerDay: 1,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "999999",
      };

      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue([]);

      await expect(processRecommendation(mockInput)).rejects.toThrow(
        "No NDC packages found"
      );
    });

    it("should properly propagate errors with structured format", async () => {
      const mockInput: DrugInput = {
        drugQuery: "Amoxicillin",
        sigText: "Take 500mg twice daily",
        daysSupply: 10,
      };

      const mockError = new Error("RxNorm API timeout");

      vi.mocked(sigParser.parseSig).mockResolvedValue({
        amountPerDose: 500,
        unit: "mg" as const,
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 0.95,
        parsedBy: "rules" as const,
      });
      vi.mocked(rxnormAdapter.normalizeDrug).mockRejectedValue(mockError);

      try {
        await processRecommendation(mockInput);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("PROCESSING_ERROR");
        expect(error.message).toContain("RxNorm API timeout");
      }
    });

    it("should include performance metrics for benchmark optimization", async () => {
      const mockInput: DrugInput = {
        drugQuery: "Lisinopril",
        sigText: "Take 10mg once daily",
        daysSupply: 90,
      };

      const mockNormalizedSig = {
        amountPerDose: 10,
        unit: "mg" as const,
        frequencyPerDay: 1,
        daysSupply: 90,
        confidence: 1,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "29046",
        doseForm: "TABLET",
        strength: "10 MG",
      };

      const mockNdcs: NdcRecord[] = [
        {
          ndc11: "00093767701",
          packageSize: 90,
          unit: "EA",
          status: "ACTIVE",
          labeler: "Sandoz",
        },
      ];

      const mockTargetQuantity = 90;

      const mockRecommendation = {
        recommended: {
          ndc: "00093767701",
          packageSize: 90,
          unit: "EA",
          status: "ACTIVE",
          packsUsed: [{ ndc: "00093767701", count: 1 }],
          matchType: "EXACT" as const,
          overfillPercent: 0,
          underfillPercent: 0,
          totalDispensed: 90,
          why: "Exact match",
          score: 1550,
        },
        alternatives: [],
      };

      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue(mockNdcs);
      vi.mocked(quantityEngine.computeTotalUnits).mockReturnValue(
        mockTargetQuantity
      );
      vi.mocked(packEngine.recommendPacks).mockReturnValue(mockRecommendation);
      vi.mocked(warningsEngine.generateWarnings).mockReturnValue([]);

      const result = await processRecommendation(mockInput);

      // Verify all metrics are present and non-negative
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.totalMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics!.sigParsingMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics!.rxnormMs).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics!.fdaMs).toBeGreaterThanOrEqual(0);
    });

    it("should handle Lisinopril real-world scenario", async () => {
      const mockInput: DrugInput = {
        drugQuery: "Lisinopril",
        sigText: "10mg once daily",
        daysSupply: 30,
      };

      const mockNormalizedSig = {
        amountPerDose: 10,
        unit: "mg" as const,
        frequencyPerDay: 1,
        daysSupply: 30,
        confidence: 0.98,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "29046",
        doseForm: "TABLET",
        strength: "10 MG",
        synonyms: ["Lisinopril", "Prinivil", "Zestril"],
      };

      const mockNdcs: NdcRecord[] = [
        {
          ndc11: "00093767701",
          packageSize: 30,
          unit: "EA",
          status: "ACTIVE",
        },
        {
          ndc11: "54868610501",
          packageSize: 90,
          unit: "EA",
          status: "ACTIVE",
        },
        {
          ndc11: "24208018601",
          packageSize: 100,
          unit: "EA",
          status: "INACTIVE",
        },
      ];

      const mockTargetQuantity = 30;

      const mockRecommendation = {
        recommended: {
          ndc: "00093767701",
          packageSize: 30,
          unit: "EA",
          status: "ACTIVE",
          packsUsed: [{ ndc: "00093767701", count: 1 }],
          matchType: "EXACT" as const,
          overfillPercent: 0,
          underfillPercent: 0,
          totalDispensed: 30,
          why: "Exact match - 30 tablets for 30-day supply",
          score: 1550,
          badges: ["EXACT_MATCH"],
        },
        alternatives: [
          {
            ndc: "54868610501",
            packageSize: 90,
            unit: "EA",
            status: "ACTIVE",
            packsUsed: [{ ndc: "54868610501", count: 1 }],
            matchType: "OVERFILL" as const,
            overfillPercent: 200,
            underfillPercent: 0,
            totalDispensed: 90,
            why: "Alternative - 90-count overfill",
            score: 1156,
            badges: ["OVERFILL"],
          },
        ],
      };

      const mockWarnings = [
        {
          code: "INACTIVE_NDCS_PRESENT",
          message: "ℹ️ 1 inactive NDC(s) found in database",
          severity: "info" as const,
        },
      ];

      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue(mockNdcs);
      vi.mocked(quantityEngine.computeTotalUnits).mockReturnValue(
        mockTargetQuantity
      );
      vi.mocked(packEngine.recommendPacks).mockReturnValue(mockRecommendation);
      vi.mocked(warningsEngine.generateWarnings).mockReturnValue(mockWarnings);

      const result = await processRecommendation(mockInput);

      expect(result.recommendation.recommended.matchType).toBe("EXACT");
      expect(result.recommendation.recommended.overfillPercent).toBe(0);
      expect(result.recommendation.alternatives.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should handle Albuterol MDI scenario with multi-pack recommendation", async () => {
      const mockInput: DrugInput = {
        drugQuery: "Albuterol",
        sigText: "2 actuations four times daily",
        daysSupply: 14,
      };

      const mockNormalizedSig = {
        amountPerDose: 2,
        unit: "actuations" as const,
        frequencyPerDay: 4,
        daysSupply: 14,
        confidence: 0.92,
        parsedBy: "rules" as const,
      };

      const mockRxnormResult = {
        rxcui: "5093",
        doseForm: "METERED DOSE INHALER",
        strength: "90 MCG/ACTUATION",
      };

      const mockNdcs: NdcRecord[] = [
        {
          ndc11: "00591005120",
          packageSize: 200,
          unit: "actuations",
          status: "ACTIVE",
        },
        {
          ndc11: "00591005200",
          packageSize: 120,
          unit: "actuations",
          status: "ACTIVE",
        },
      ];

      const mockTargetQuantity = 112; // 2 * 4 * 14 = 112 actuations

      const mockRecommendation = {
        recommended: {
          ndc: "00591005120",
          packageSize: 200,
          unit: "actuations",
          status: "ACTIVE",
          packsUsed: [{ ndc: "00591005120", count: 1 }],
          matchType: "NEAREST" as const,
          overfillPercent: 78.6,
          underfillPercent: 0,
          totalDispensed: 200,
          why: "Nearest match - standard size",
          score: 1400,
        },
        alternatives: [],
      };

      const mockWarnings = [];

      vi.mocked(sigParser.parseSig).mockResolvedValue(mockNormalizedSig);
      vi.mocked(rxnormAdapter.normalizeDrug).mockResolvedValue(
        mockRxnormResult
      );
      vi.mocked(fdaAdapter.ndcsByRxCui).mockResolvedValue(mockNdcs);
      vi.mocked(quantityEngine.computeTotalUnits).mockReturnValue(
        mockTargetQuantity
      );
      vi.mocked(packEngine.recommendPacks).mockReturnValue(mockRecommendation);
      vi.mocked(warningsEngine.generateWarnings).mockReturnValue(mockWarnings);

      const result = await processRecommendation(mockInput);

      expect(result.normalizedSig.unit).toBe("actuations");
      // Verify recommendation was created successfully
      expect(result.recommendation.recommended.ndc).toBe("00591005120");
      expect(result.recommendation.recommended.totalDispensed).toBe(200);
    });
  });
});
