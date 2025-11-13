import { describe, it, expect } from "vitest";
import { computeTotalUnits, computeTotalUnitsWithDefault } from "./quantity";
import type { NormalizedSig } from "../types";

describe("Quantity Calculator", () => {
  describe("computeTotalUnits", () => {
    it("should calculate simple tablet dosing: 1 tablet, 2x/day, 10 days = 20 tablets", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(20);
    });

    it("should calculate liquid dosing: 5 mL, 3x/day, 7 days = 105 mL", () => {
      const sig: NormalizedSig = {
        amountPerDose: 5,
        unit: "mL",
        frequencyPerDay: 3,
        daysSupply: 7,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(105);
    });

    it("should calculate weight-based dosing: 500 mg, 2x/day, 14 days = 14,000 mg", () => {
      const sig: NormalizedSig = {
        amountPerDose: 500,
        unit: "g",
        frequencyPerDay: 2,
        daysSupply: 14,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(14000);
    });

    it("should handle fractional doses: 0.5 tablet, 2x/day, 10 days = 10 tablets", () => {
      const sig: NormalizedSig = {
        amountPerDose: 0.5,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(10);
    });

    it("should round up correctly: 1.5 tablets, 1x/day, 10 days = 15 tablets", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1.5,
        unit: "EA",
        frequencyPerDay: 1,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(15);
    });

    it("should round up with fractional result: 10 mg, 3x/day, 5 days = 150 mg", () => {
      const sig: NormalizedSig = {
        amountPerDose: 10,
        unit: "g",
        frequencyPerDay: 3,
        daysSupply: 5,
        confidence: 1,
        parsedBy: "llm",
      };
      expect(computeTotalUnits(sig)).toBe(150);
    });

    it("should handle high frequency: 1 mL, 6x/day, 10 days = 60 mL", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "mL",
        frequencyPerDay: 6,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(60);
    });

    it("should handle single dose per day: 1 tablet, 1x/day, 30 days = 30 tablets", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 1,
        daysSupply: 30,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(30);
    });

    it("should handle insulin units: 10 U, 2x/day, 28 days = 560 U", () => {
      const sig: NormalizedSig = {
        amountPerDose: 10,
        unit: "U",
        frequencyPerDay: 2,
        daysSupply: 28,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(560);
    });

    it("should handle inhalers: 2 actuations, 2x/day, 30 days = 120 actuations", () => {
      const sig: NormalizedSig = {
        amountPerDose: 2,
        unit: "actuations",
        frequencyPerDay: 2,
        daysSupply: 30,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(120);
    });

    it("should throw error for negative amountPerDose", () => {
      const sig: NormalizedSig = {
        amountPerDose: -1,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(() => computeTotalUnits(sig)).toThrow("Invalid amountPerDose");
    });

    it("should throw error for zero frequencyPerDay", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 0,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(() => computeTotalUnits(sig)).toThrow("Invalid frequencyPerDay");
    });

    it("should throw error for negative daysSupply", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: -5,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(() => computeTotalUnits(sig)).toThrow("Invalid daysSupply");
    });

    it("should throw error if result exceeds safety limit (1M units)", () => {
      const sig: NormalizedSig = {
        amountPerDose: 100000,
        unit: "EA",
        frequencyPerDay: 24,
        daysSupply: 500,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(() => computeTotalUnits(sig)).toThrow("exceeds safety limit");
    });
  });

  describe("computeTotalUnitsWithDefault", () => {
    it("should return calculated value on success", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnitsWithDefault(sig)).toBe(20);
    });

    it("should return 0 on error (negative dose)", () => {
      const sig: NormalizedSig = {
        amountPerDose: -1,
        unit: "EA",
        frequencyPerDay: 2,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnitsWithDefault(sig)).toBe(0);
    });

    it("should return 0 on error (zero frequency)", () => {
      const sig: NormalizedSig = {
        amountPerDose: 1,
        unit: "EA",
        frequencyPerDay: 0,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnitsWithDefault(sig)).toBe(0);
    });

    it("should return 0 on error (exceeds safety limit)", () => {
      const sig: NormalizedSig = {
        amountPerDose: 100000,
        unit: "EA",
        frequencyPerDay: 24,
        daysSupply: 500,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnitsWithDefault(sig)).toBe(0);
    });
  });

  describe("Real-world pharmacy scenarios", () => {
    it("Amoxicillin: 500 mg, 3x/day, 10 days = 15,000 mg", () => {
      const sig: NormalizedSig = {
        amountPerDose: 500,
        unit: "g",
        frequencyPerDay: 3,
        daysSupply: 10,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(15000);
    });

    it("Lisinopril: 10 mg, 1x/day, 30 days = 300 mg", () => {
      const sig: NormalizedSig = {
        amountPerDose: 10,
        unit: "g",
        frequencyPerDay: 1,
        daysSupply: 30,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(300);
    });

    it("Cough syrup: 5 mL, 4x/day, 7 days = 140 mL", () => {
      const sig: NormalizedSig = {
        amountPerDose: 5,
        unit: "mL",
        frequencyPerDay: 4,
        daysSupply: 7,
        confidence: 1,
        parsedBy: "rules",
      };
      expect(computeTotalUnits(sig)).toBe(140);
    });

    it("Insulin: 20 U twice daily, 28 days = 1,120 U", () => {
      const sig: NormalizedSig = {
        amountPerDose: 20,
        unit: "U",
        frequencyPerDay: 2,
        daysSupply: 28,
        confidence: 1,
        parsedBy: "llm",
      };
      expect(computeTotalUnits(sig)).toBe(1120);
    });
  });
});
