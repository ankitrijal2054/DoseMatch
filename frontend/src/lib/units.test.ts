import { describe, it, expect } from "vitest";
import {
  normalizeUnit,
  toCanonical,
  unitsMatch,
  UNIT_ALIASES,
} from "./units";

describe("Unit Normalization System", () => {
  describe("normalizeUnit", () => {
    it("should normalize tablet aliases to EA", () => {
      expect(normalizeUnit("tablet")).toBe("EA");
      expect(normalizeUnit("tab")).toBe("EA");
      expect(normalizeUnit("tablets")).toBe("EA");
      expect(normalizeUnit("cap")).toBe("EA");
      expect(normalizeUnit("capsule")).toBe("EA");
      expect(normalizeUnit("caplet")).toBe("EA");
    });

    it("should normalize liquid aliases to mL", () => {
      expect(normalizeUnit("ml")).toBe("mL");
      expect(normalizeUnit("mL")).toBe("mL");
      expect(normalizeUnit("milliliter")).toBe("mL");
      expect(normalizeUnit("cc")).toBe("mL");
      expect(normalizeUnit("drop")).toBe("mL");
    });

    it("should normalize weight aliases to g", () => {
      expect(normalizeUnit("g")).toBe("g");
      expect(normalizeUnit("gram")).toBe("g");
      expect(normalizeUnit("grams")).toBe("g");
      expect(normalizeUnit("mg")).toBe("g");
      expect(normalizeUnit("milligram")).toBe("g");
    });

    it("should normalize insulin units to U", () => {
      expect(normalizeUnit("u")).toBe("U");
      expect(normalizeUnit("U")).toBe("U");
      expect(normalizeUnit("unit")).toBe("U");
      expect(normalizeUnit("units")).toBe("U");
      expect(normalizeUnit("iu")).toBe("U");
    });

    it("should normalize inhaler/spray aliases to actuations", () => {
      expect(normalizeUnit("puff")).toBe("actuations");
      expect(normalizeUnit("puffs")).toBe("actuations");
      expect(normalizeUnit("inhalation")).toBe("actuations");
      expect(normalizeUnit("actuation")).toBe("actuations");
      expect(normalizeUnit("actuations")).toBe("actuations");
    });

    it("should handle case-insensitive normalization", () => {
      expect(normalizeUnit("TABLET")).toBe("EA");
      expect(normalizeUnit("ML")).toBe("mL");
      expect(normalizeUnit("GRAM")).toBe("g");
      expect(normalizeUnit("UNIT")).toBe("U");
    });

    it("should return EA as default for unrecognized units", () => {
      expect(normalizeUnit("unknown")).toBe("EA");
      expect(normalizeUnit("xyz")).toBe("EA");
    });
  });

  describe("toCanonical", () => {
    it("should convert EA without modification", () => {
      expect(toCanonical(1, "EA")).toEqual({ amount: 1, unit: "EA" });
      expect(toCanonical(100, "EA")).toEqual({ amount: 100, unit: "EA" });
    });

    it("should convert mL without modification", () => {
      expect(toCanonical(5, "mL")).toEqual({ amount: 5, unit: "mL" });
      expect(toCanonical(10.5, "mL")).toEqual({ amount: 10.5, unit: "mL" });
    });

    it("should convert mg to g with division by 1000", () => {
      expect(toCanonical(500, "mg")).toEqual({ amount: 0.5, unit: "g" });
      expect(toCanonical(1000, "mg")).toEqual({ amount: 1, unit: "g" });
      expect(toCanonical(250, "mg")).toEqual({ amount: 0.25, unit: "g" });
    });

    it("should convert g without modification", () => {
      expect(toCanonical(0.5, "g")).toEqual({ amount: 0.5, unit: "g" });
      expect(toCanonical(1, "g")).toEqual({ amount: 1, unit: "g" });
    });

    it("should convert U without modification", () => {
      expect(toCanonical(10, "U")).toEqual({ amount: 10, unit: "U" });
      expect(toCanonical(100, "U")).toEqual({ amount: 100, unit: "U" });
    });

    it("should convert actuations without modification", () => {
      expect(toCanonical(1, "actuations")).toEqual({
        amount: 1,
        unit: "actuations",
      });
      expect(toCanonical(2, "actuations")).toEqual({
        amount: 2,
        unit: "actuations",
      });
    });

    it("should handle edge cases: 0 amount", () => {
      expect(toCanonical(0, "EA")).toEqual({ amount: 0, unit: "EA" });
      expect(toCanonical(0, "mg")).toEqual({ amount: 0, unit: "g" });
    });

    it("should handle fractional mg conversions", () => {
      expect(toCanonical(100, "mg")).toEqual({ amount: 0.1, unit: "g" });
      expect(toCanonical(50, "mg")).toEqual({ amount: 0.05, unit: "g" });
      expect(toCanonical(0.5, "mg")).toEqual({ amount: 0.0005, unit: "g" });
    });
  });

  describe("unitsMatch", () => {
    it("should match identical canonical units", () => {
      expect(unitsMatch("EA", "EA")).toBe(true);
      expect(unitsMatch("mL", "mL")).toBe(true);
      expect(unitsMatch("g", "g")).toBe(true);
      expect(unitsMatch("U", "U")).toBe(true);
      expect(unitsMatch("actuations", "actuations")).toBe(true);
    });

    it("should match normalized unit variants", () => {
      expect(unitsMatch("tablet", "EA")).toBe(true);
      expect(unitsMatch("EA", "tablet")).toBe(true);
      expect(unitsMatch("tab", "cap")).toBe(true);
      expect(unitsMatch("ml", "milliliter")).toBe(true);
      expect(unitsMatch("mg", "g")).toBe(true);
      expect(unitsMatch("unit", "U")).toBe(true);
    });

    it("should not match different units", () => {
      expect(unitsMatch("EA", "mL")).toBe(false);
      expect(unitsMatch("mL", "g")).toBe(false);
      expect(unitsMatch("U", "EA")).toBe(false);
      expect(unitsMatch("actuations", "tablet")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(unitsMatch("TABLET", "EA")).toBe(true);
      expect(unitsMatch("ML", "MILLILITER")).toBe(true);
      expect(unitsMatch("GRAM", "mg")).toBe(true);
    });

    it("should handle mg to g comparison", () => {
      expect(unitsMatch("mg", "g")).toBe(true);
      expect(unitsMatch("g", "mg")).toBe(true);
      expect(unitsMatch("500mg", "0.5g")).toBe(true);
    });

    it("should be symmetric", () => {
      expect(unitsMatch("tablet", "cap")).toBe(
        unitsMatch("cap", "tablet")
      );
      expect(unitsMatch("ml", "mL")).toBe(unitsMatch("mL", "ml"));
    });
  });

  describe("UNIT_ALIASES constant", () => {
    it("should contain all expected tablet aliases", () => {
      const tabletAliases = Object.entries(UNIT_ALIASES)
        .filter(([_, v]) => v === "EA")
        .map(([k, _]) => k);
      expect(tabletAliases.length).toBeGreaterThan(0);
      expect(tabletAliases).toContain("tab");
      expect(tabletAliases).toContain("tablet");
      expect(tabletAliases).toContain("cap");
    });

    it("should contain all expected liquid aliases", () => {
      const liquidAliases = Object.entries(UNIT_ALIASES)
        .filter(([_, v]) => v === "mL")
        .map(([k, _]) => k);
      expect(liquidAliases.length).toBeGreaterThan(0);
      expect(liquidAliases).toContain("ml");
      expect(liquidAliases).toContain("cc");
    });

    it("should contain all expected weight aliases", () => {
      const weightAliases = Object.entries(UNIT_ALIASES)
        .filter(([_, v]) => v === "g")
        .map(([k, _]) => k);
      expect(weightAliases.length).toBeGreaterThan(0);
      expect(weightAliases).toContain("g");
      expect(weightAliases).toContain("mg");
    });

    it("should map lowercase and uppercase variants", () => {
      // Should have lowercase versions
      expect(UNIT_ALIASES["tab"]).toBeDefined();
      expect(UNIT_ALIASES["ml"]).toBeDefined();

      // Uppercase should also work (normalized in function)
      const tablet = normalizeUnit("TABLET");
      expect(tablet).toBe("EA");
    });
  });

  describe("Real-world pharmacy scenarios", () => {
    it("should normalize Amoxicillin dosing: 500mg tablets", () => {
      expect(toCanonical(500, "mg")).toEqual({ amount: 0.5, unit: "g" });
      expect(unitsMatch("tablet", "EA")).toBe(true);
    });

    it("should normalize Albuterol liquid: 5mL dose", () => {
      expect(normalizeUnit("mL")).toBe("mL");
      expect(toCanonical(5, "mL")).toEqual({ amount: 5, unit: "mL" });
    });

    it("should normalize insulin: 10 units, 2x daily", () => {
      expect(normalizeUnit("units")).toBe("U");
      expect(toCanonical(10, "U")).toEqual({ amount: 10, unit: "U" });
    });

    it("should normalize inhaler: 2 puffs", () => {
      expect(normalizeUnit("puff")).toBe("actuations");
      expect(unitsMatch("inhalation", "actuation")).toBe(true);
    });

    it("should normalize topical cream: 1g", () => {
      expect(normalizeUnit("gram")).toBe("g");
      expect(toCanonical(1, "g")).toEqual({ amount: 1, unit: "g" });
    });

    it("should handle unit conversion from dose form: 250mg tablet → 0.25g", () => {
      const converted = toCanonical(250, "mg");
      expect(converted.unit).toBe("g");
      expect(converted.amount).toBe(0.25);
    });

    it("should handle NDC unit matching: prescription vs available stock", () => {
      // Prescription says tablets
      const prescriptionUnit = normalizeUnit("tablet");
      // Stock has capsules
      const stockUnit = normalizeUnit("capsule");
      // Both normalize to EA, so they match
      expect(unitsMatch(prescriptionUnit, stockUnit)).toBe(true);
    });
  });
});

