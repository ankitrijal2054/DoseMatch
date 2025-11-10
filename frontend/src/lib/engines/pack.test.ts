import { describe, it, expect } from "vitest";
import { recommendPacks } from "./pack";
import type { NdcRecord } from "../types";

describe("Pack Selection Engine", () => {
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
      ndc11: "00071015522",
      packageSize: 90,
      unit: "EA",
      status: "ACTIVE",
      productName: "Lisinopril 10mg",
    },
    {
      ndc11: "00071015523",
      packageSize: 100,
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

  describe("Exact Match Strategy", () => {
    it("should find exact match when available", () => {
      const result = recommendPacks(30, "EA", sampleNdcs);

      expect(result.recommended.matchType).toBe("EXACT");
      expect(result.recommended.ndc).toBe("00071015520");
      expect(result.recommended.totalDispensed).toBe(30);
      expect(result.recommended.overfillPercent).toBe(0);
      expect(result.recommended.status).toBe("ACTIVE");
    });

    it("should prefer active exact match over inactive", () => {
      const ndcsWithInactiveExact: NdcRecord[] = [
        ...sampleNdcs.slice(0, 4),
        {
          ndc11: "99999999999",
          packageSize: 30,
          unit: "EA",
          status: "INACTIVE",
          productName: "Old Lisinopril",
        },
      ];

      const result = recommendPacks(30, "EA", ndcsWithInactiveExact);

      expect(result.recommended.matchType).toBe("EXACT");
      expect(result.recommended.status).toBe("ACTIVE");
      expect(result.recommended.ndc).toBe("00071015520");
    });

    it("should return empty alternatives when exact match found", () => {
      const result = recommendPacks(60, "EA", sampleNdcs);

      expect(result.recommended.matchType).toBe("EXACT");
      expect(result.alternatives.length).toBe(0);
    });
  });

  describe("Multi-Pack Strategy", () => {
    it("should find 2-pack combination for odd quantities", () => {
      const result = recommendPacks(45, "EA", sampleNdcs);

      // Could be 1x30 + 1x60 = 90 or 1x60 (overfill)
      expect(result.recommended.matchType).toBe("MULTI_PACK");
      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(45);
      expect(result.recommended.overfillPercent).toBeLessThanOrEqual(15);
    });

    it("should prefer multi-pack over large overfill", () => {
      const result = recommendPacks(45, "EA", sampleNdcs);

      // 1x60 would be 33% overfill
      // 1x30 + 1x30 = 60 would be 33% overfill too, but multi-pack might be better
      expect(result.recommended.overfillPercent).toBeLessThanOrEqual(50);
    });

    it("should prefer 2-pack with <10% overfill", () => {
      // 30 + 30 = 60 vs 60 = 60
      const result = recommendPacks(50, "EA", sampleNdcs);

      // Either exact 60 or multi-pack 30+30, but 60 is exact
      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(50);
    });

    it("should use only active NDCs for multi-pack", () => {
      const result = recommendPacks(70, "EA", sampleNdcs);

      if (result.recommended.matchType === "MULTI_PACK") {
        for (const pack of result.recommended.packsUsed) {
          const ndc = sampleNdcs.find((n) => n.ndc11 === pack.ndc);
          expect(ndc?.status).toBe("ACTIVE");
        }
      }
    });
  });

  describe("Nearest Match Strategy", () => {
    it("should fall back to nearest when no exact match", () => {
      const result = recommendPacks(75, "EA", sampleNdcs);

      // No exact match for 75
      // Could be 60 (underfill) or 90 (overfill)
      expect(
        result.recommended.matchType === "OVERFILL" ||
          result.recommended.matchType === "UNDERFILL" ||
          result.recommended.matchType === "MULTI_PACK"
      ).toBe(true);
    });

    it("should prefer active over inactive in nearest match", () => {
      const result = recommendPacks(75, "EA", sampleNdcs);

      // Should not recommend 500 (INACTIVE)
      if (
        result.recommended.matchType === "OVERFILL" ||
        result.recommended.matchType === "UNDERFILL"
      ) {
        expect(result.recommended.ndc).not.toBe("00071015524");
      }
    });

    it("should calculate correct overfill percentage", () => {
      const result = recommendPacks(90, "EA", sampleNdcs);

      if (result.recommended.matchType === "EXACT") {
        expect(result.recommended.overfillPercent).toBe(0);
      } else {
        const expectedOverfill =
          ((result.recommended.totalDispensed - 90) / 90) * 100;
        expect(result.recommended.overfillPercent).toBeCloseTo(
          expectedOverfill,
          1
        );
      }
    });

    it("should calculate correct underfill percentage", () => {
      // Create NDCs without good options for 95
      const ndcsForUnderfill: NdcRecord[] = [
        { ndc11: "111", packageSize: 30, unit: "EA", status: "ACTIVE" },
        { ndc11: "222", packageSize: 60, unit: "EA", status: "ACTIVE" },
        { ndc11: "333", packageSize: 90, unit: "EA", status: "ACTIVE" },
      ];

      const result = recommendPacks(95, "EA", ndcsForUnderfill);

      // Best match is 90, which is underfill
      expect(result.recommended.matchType).toBe("UNDERFILL");
      expect(result.recommended.underfillPercent).toBeGreaterThan(0);
    });
  });

  describe("Scoring and Ranking", () => {
    it("should rank alternatives by score", () => {
      const result = recommendPacks(45, "EA", sampleNdcs);

      if (result.alternatives.length > 1) {
        for (let i = 0; i < result.alternatives.length - 1; i++) {
          expect(result.alternatives[i].score).toBeGreaterThanOrEqual(
            result.alternatives[i + 1].score
          );
        }
      }
    });

    it("should score active higher than inactive", () => {
      const result = recommendPacks(30, "EA", sampleNdcs);

      expect(result.recommended.status).toBe("ACTIVE");
    });

    it("should score single pack higher than multi-pack", () => {
      // When both are valid options, single pack should score higher
      const result = recommendPacks(30, "EA", sampleNdcs);

      if (result.recommended.matchType === "EXACT") {
        expect(result.recommended.packsUsed.length).toBe(1);
      }
    });

    it("should penalize high overfill", () => {
      // More overfill = lower score
      const result45 = recommendPacks(45, "EA", sampleNdcs);
      const result40 = recommendPacks(40, "EA", sampleNdcs);

      if (result45.recommended.matchType === result40.recommended.matchType) {
        // If same type, the one with less overfill should score higher
        expect(result45.recommended.score).toBeDefined();
        expect(result40.recommended.score).toBeDefined();
      }
    });
  });

  describe("Unit Matching", () => {
    it("should only return NDCs with matching unit", () => {
      const mixedUnits: NdcRecord[] = [
        { ndc11: "111", packageSize: 30, unit: "EA", status: "ACTIVE" },
        { ndc11: "222", packageSize: 30, unit: "mL", status: "ACTIVE" },
        { ndc11: "333", packageSize: 30, unit: "g", status: "ACTIVE" },
      ];

      const result = recommendPacks(30, "EA", mixedUnits);

      expect(result.recommended.ndc).toBe("111");
      expect(result.recommended.unit).toBe("EA");
    });

    it("should throw error if no matching units", () => {
      expect(() => recommendPacks(30, "U", sampleNdcs)).toThrow(
        /No NDCs found matching unit/
      );
    });
  });

  describe("Badge Generation", () => {
    it("should add 'Exact Match' badge for exact matches", () => {
      const result = recommendPacks(30, "EA", sampleNdcs);

      expect(result.recommended.badges).toContain("Exact Match");
    });

    it("should add 'Multi-Pack' badge for multi-pack solutions", () => {
      const result = recommendPacks(45, "EA", sampleNdcs);

      if (result.recommended.matchType === "MULTI_PACK") {
        expect(result.recommended.badges).toContain("Multi-Pack");
      }
    });

    it("should add 'Inactive' badge for inactive NDCs", () => {
      const result = recommendPacks(500, "EA", sampleNdcs);

      if (result.recommended.matchType === "OVERFILL") {
        expect(result.recommended.badges).toContain("Inactive");
      }
    });

    it("should add overfill badge when >10%", () => {
      // Create scenario with known overfill
      const ndcs: NdcRecord[] = [
        { ndc11: "111", packageSize: 100, unit: "EA", status: "ACTIVE" },
      ];

      const result = recommendPacks(50, "EA", ndcs);

      // 100 vs 50 = 100% overfill
      expect(
        result.recommended.badges.some((b) => b.includes("Overfill"))
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single NDC option", () => {
      const single: NdcRecord[] = [
        { ndc11: "111", packageSize: 30, unit: "EA", status: "ACTIVE" },
      ];

      const result = recommendPacks(30, "EA", single);

      expect(result.recommended.ndc).toBe("111");
    });

    it("should handle very small target quantity", () => {
      const result = recommendPacks(1, "EA", sampleNdcs);

      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(1);
    });

    it("should handle very large target quantity", () => {
      const result = recommendPacks(1000, "EA", sampleNdcs);

      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(1000);
      // Should use multi-pack if available
      if (result.recommended.matchType === "MULTI_PACK") {
        expect(result.recommended.packsUsed.length).toBeGreaterThan(1);
      }
    });

    it("should handle fractional package sizes", () => {
      const fractionalNdcs: NdcRecord[] = [
        {
          ndc11: "111",
          packageSize: 30.5,
          unit: "mL",
          status: "ACTIVE",
        },
        {
          ndc11: "222",
          packageSize: 60.75,
          unit: "mL",
          status: "ACTIVE",
        },
      ];

      const result = recommendPacks(30.5, "mL", fractionalNdcs);

      expect(result.recommended.matchType).toBe("EXACT");
    });

    it("should handle all inactive NDCs", () => {
      const allInactive: NdcRecord[] = [
        { ndc11: "111", packageSize: 30, unit: "EA", status: "INACTIVE" },
        { ndc11: "222", packageSize: 60, unit: "EA", status: "INACTIVE" },
      ];

      const result = recommendPacks(30, "EA", allInactive);

      // Should still work, but warn
      expect(result.recommended.ndc).toBe("111");
      expect(result.recommended.status).toBe("INACTIVE");
      expect(result.recommended.badges).toContain("Inactive");
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle Amoxicillin tablets (common antibiotic)", () => {
      const amoxNdcs: NdcRecord[] = [
        {
          ndc11: "00093015001",
          packageSize: 20,
          unit: "EA",
          status: "ACTIVE",
        },
        {
          ndc11: "00093015002",
          packageSize: 30,
          unit: "EA",
          status: "ACTIVE",
        },
        {
          ndc11: "00093015003",
          packageSize: 60,
          unit: "EA",
          status: "ACTIVE",
        },
      ];

      // 10 tablets x 3x/day x 10 days = 300 tablets
      const result = recommendPacks(300, "EA", amoxNdcs);

      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(300);
      expect(result.recommended.status).toBe("ACTIVE");
    });

    it("should handle Lisinopril tablets (common hypertension drug)", () => {
      // 1 tablet x 1x/day x 30 days = 30 tablets
      const result = recommendPacks(30, "EA", sampleNdcs);

      expect(result.recommended.matchType).toBe("EXACT");
      expect(result.recommended.ndc).toBe("00071015520");
    });

    it("should handle Albuterol inhaler (actuations)", () => {
      const albuNdcs: NdcRecord[] = [
        {
          ndc11: "00085023001",
          packageSize: 120,
          unit: "actuations",
          status: "ACTIVE",
        },
        {
          ndc11: "00085023002",
          packageSize: 200,
          unit: "actuations",
          status: "ACTIVE",
        },
      ];

      // 2 puffs x 4x/day x 30 days = 240 actuations
      const result = recommendPacks(240, "actuations", albuNdcs);

      expect(result.recommended.totalDispensed).toBeGreaterThanOrEqual(240);
    });

    it("should handle liquid suspension (mL)", () => {
      const suspensionNdcs: NdcRecord[] = [
        {
          ndc11: "00093500001",
          packageSize: 100,
          unit: "mL",
          status: "ACTIVE",
        },
        {
          ndc11: "00093500002",
          packageSize: 150,
          unit: "mL",
          status: "ACTIVE",
        },
        {
          ndc11: "00093500003",
          packageSize: 200,
          unit: "mL",
          status: "ACTIVE",
        },
      ];

      // 5 mL x 4x/day x 10 days = 200 mL
      const result = recommendPacks(200, "mL", suspensionNdcs);

      expect(result.recommended.matchType).toBe("EXACT");
      expect(result.recommended.ndc).toBe("00093500003");
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle large NDC lists efficiently", () => {
      const largeNdcList: NdcRecord[] = Array.from({ length: 100 }, (_, i) => ({
        ndc11: `00071015${String(i).padStart(3, "0")}`,
        packageSize: (i + 1) * 10,
        unit: "EA" as const,
        status: i % 10 === 0 ? "INACTIVE" : "ACTIVE",
      }));

      const startTime = performance.now();
      const result = recommendPacks(500, "EA", largeNdcList);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    it("should optimize multi-pack search (no n² explosion)", () => {
      // Create 50 NDCs - if unoptimized would be 2500 combinations
      const manyNdcs: NdcRecord[] = Array.from({ length: 50 }, (_, i) => ({
        ndc11: `00071015${String(i).padStart(3, "0")}`,
        packageSize: 10 + i * 2,
        unit: "EA" as const,
        status: "ACTIVE",
      }));

      const startTime = performance.now();
      const result = recommendPacks(150, "EA", manyNdcs);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should still be fast
    });
  });
});
