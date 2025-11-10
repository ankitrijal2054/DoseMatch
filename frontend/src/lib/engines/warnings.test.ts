import { describe, it, expect } from "vitest";
import { generateWarnings } from "./warnings";
import type { Recommendation, NdcRecord, RecommendationOption } from "../types";

describe("Warning System", () => {
  // Sample NDCs for testing
  const sampleNdcs: NdcRecord[] = [
    {
      ndc11: "00071015520",
      packageSize: 30,
      unit: "EA",
      status: "ACTIVE",
      productName: "Lisinopril 10mg",
    },
    {
      ndc11: "00071015521",
      packageSize: 60,
      unit: "EA",
      status: "ACTIVE",
      productName: "Lisinopril 10mg",
    },
    {
      ndc11: "00071015524",
      packageSize: 500,
      unit: "EA",
      status: "INACTIVE",
      productName: "Lisinopril 10mg (Discontinued)",
    },
  ];

  // Helper to create a recommendation
  const createRecommendation = (
    ndc: string,
    status: "ACTIVE" | "INACTIVE" | "UNKNOWN",
    matchType: any,
    overfillPercent: number,
    underfillPercent: number,
    totalDispensed: number
  ): Recommendation => ({
    recommended: {
      ndc,
      packageSize: 30,
      unit: "EA",
      status,
      packsUsed: [{ ndc, count: 1 }],
      matchType,
      overfillPercent,
      underfillPercent,
      totalDispensed,
      why: "Test recommendation",
      score: 1000,
    },
    alternatives: [],
  });

  describe("Inactive NDC Warnings", () => {
    it("should warn if recommended NDC is inactive", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "INACTIVE",
        "NEAREST",
        5,
        0,
        31
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "INACTIVE_NDC_RECOMMENDED",
          severity: "warning",
        })
      );
    });

    it("should not warn if recommended NDC is active", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(
        warnings.find((w) => w.code === "INACTIVE_NDC_RECOMMENDED")
      ).toBeUndefined();
    });

    it("should note inactive NDCs in database when active option chosen", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "INACTIVE_NDCS_PRESENT",
          severity: "info",
        })
      );
    });

    it("should not duplicate inactive warning", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);
      const inactiveWarnings = warnings.filter(
        (w) => w.code === "INACTIVE_NDCS_PRESENT"
      );

      expect(inactiveWarnings).toHaveLength(1);
    });
  });

  describe("Exact Match Warnings", () => {
    it("should note when no exact match found", () => {
      const recommendation = createRecommendation(
        "00071015521",
        "ACTIVE",
        "MULTI_PACK",
        8,
        0,
        65
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "NO_EXACT_MATCH",
          severity: "info",
        })
      );
    });

    it("should not warn for exact match", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings.find((w) => w.code === "NO_EXACT_MATCH")).toBeUndefined();
    });

    it("should note when overfill strategy used", () => {
      const recommendation = createRecommendation(
        "00071015521",
        "ACTIVE",
        "OVERFILL",
        15,
        0,
        60
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "NO_EXACT_MATCH",
          severity: "info",
        })
      );
    });

    it("should note when underfill strategy used", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "UNDERFILL",
        0,
        10,
        27
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "NO_EXACT_MATCH",
          severity: "info",
        })
      );
    });
  });

  describe("Overfill Warnings", () => {
    it("should warn for high overfill (>20%)", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "ACTIVE",
        "OVERFILL",
        35,
        0,
        135
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "HIGH_OVERFILL",
          severity: "warning",
        })
      );
    });

    it("should not warn for moderate overfill (<=20%)", () => {
      const recommendation = createRecommendation(
        "00071015521",
        "ACTIVE",
        "OVERFILL",
        15,
        0,
        69
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings.find((w) => w.code === "HIGH_OVERFILL")).toBeUndefined();
    });

    it("should include overfill percentage in message", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "ACTIVE",
        "OVERFILL",
        25.5,
        0,
        125
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);
      const overfillWarning = warnings.find((w) => w.code === "HIGH_OVERFILL");

      expect(overfillWarning?.message).toContain("25.5%");
    });

    it("should not warn for zero overfill", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings.find((w) => w.code === "HIGH_OVERFILL")).toBeUndefined();
    });
  });

  describe("Underfill Warnings", () => {
    it("should warn for underfill", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "UNDERFILL",
        0,
        15,
        26
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "PARTIAL_FILL",
          severity: "warning",
        })
      );
    });

    it("should not warn for zero underfill", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings.find((w) => w.code === "PARTIAL_FILL")).toBeUndefined();
    });

    it("should include underfill percentage in message", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "UNDERFILL",
        0,
        10.5,
        27
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);
      const underfillWarning = warnings.find((w) => w.code === "PARTIAL_FILL");

      expect(underfillWarning?.message).toContain("10.5%");
    });
  });

  describe("Real-World Scenarios", () => {
    it("Scenario 1: Perfect exact match - no warnings", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      // Should only have info about inactive NDCs present
      const severityWarnings = warnings.filter((w) => w.severity === "warning");
      expect(severityWarnings).toHaveLength(0);
    });

    it("Scenario 2: Multi-pack with slight overfill - info warning", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "MULTI_PACK",
        8,
        0,
        65 // 65 units, target ~60, 8% overfill
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "NO_EXACT_MATCH",
          severity: "info",
        })
      );

      expect(warnings.find((w) => w.code === "HIGH_OVERFILL")).toBeUndefined();
    });

    it("Scenario 3: Inactive NDC recommended - critical warning", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "INACTIVE",
        "NEAREST",
        25,
        0,
        125
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      const criticalWarnings = warnings.filter(
        (w) => w.code === "INACTIVE_NDC_RECOMMENDED"
      );
      expect(criticalWarnings).toHaveLength(1);
    });

    it("Scenario 4: High overfill (30%+) - warning", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "ACTIVE",
        "NEAREST",
        32,
        0,
        132
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "HIGH_OVERFILL",
          severity: "warning",
        })
      );
    });

    it("Scenario 5: Underfill (10%) - warning", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "UNDERFILL",
        0,
        10,
        27
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "PARTIAL_FILL",
          severity: "warning",
        })
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty NDC list", () => {
      const recommendation = createRecommendation(
        "12345678901",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, []);

      // Should not crash, but might have some warnings
      expect(Array.isArray(warnings)).toBe(true);
    });

    it("should handle multiple warnings together", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "INACTIVE",
        "NEAREST",
        35,
        0,
        135
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      // Should have multiple warnings: inactive, high overfill, no exact match
      expect(warnings.length).toBeGreaterThan(1);
      expect(warnings.some((w) => w.code === "INACTIVE_NDC_RECOMMENDED")).toBe(
        true
      );
      expect(warnings.some((w) => w.code === "HIGH_OVERFILL")).toBe(true);
    });

    it("should not warn if underfill is exactly 0", () => {
      const recommendation = createRecommendation(
        "00071015520",
        "ACTIVE",
        "EXACT",
        0,
        0,
        30
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings.find((w) => w.code === "PARTIAL_FILL")).toBeUndefined();
    });

    it("should handle very large overfill percentage", () => {
      const recommendation = createRecommendation(
        "00071015524",
        "ACTIVE",
        "OVERFILL",
        99,
        0,
        596
      );

      const warnings = generateWarnings(recommendation, sampleNdcs);

      expect(warnings).toContainEqual(
        expect.objectContaining({
          code: "HIGH_OVERFILL",
          severity: "warning",
        })
      );
    });
  });
});
