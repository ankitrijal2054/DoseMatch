import { describe, it, expect } from "vitest";
import { parseSigWithRules } from "./rules";

describe("SIG Parsing Rules Engine", () => {
  describe("parseSigWithRules", () => {
    it("should parse simple tablet SIG", () => {
      const result = parseSigWithRules("take 1 tablet twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
      expect(result?.frequencyPerDay).toBe(2);
      expect(result?.unit).toBe("EA");
      expect(result?.daysSupply).toBe(30);
    });

    it("should parse capsule dosing", () => {
      const result = parseSigWithRules("take 1 capsule three times daily", 14);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
      expect(result?.frequencyPerDay).toBe(3);
      expect(result?.unit).toBe("EA");
    });

    it("should parse liquid medication SIG", () => {
      const result = parseSigWithRules("take 5 ml three times daily", 7);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(5);
      expect(result?.frequencyPerDay).toBe(3);
      expect(result?.unit).toBe("mL");
    });

    it("should parse fractional doses", () => {
      const result = parseSigWithRules("take 0.5 tablet once daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(0.5);
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should parse BID abbreviation", () => {
      const result = parseSigWithRules("take 1 tablet bid", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should parse TID abbreviation", () => {
      const result = parseSigWithRules("take 2 tablets tid", 14);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(2);
      expect(result?.frequencyPerDay).toBe(3);
    });

    it("should parse QID abbreviation", () => {
      const result = parseSigWithRules("take 1 tablet qid", 21);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(4);
    });

    it("should parse QD abbreviation", () => {
      const result = parseSigWithRules("take 1 tablet qd", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should parse Q6H abbreviation (6 times daily)", () => {
      const result = parseSigWithRules("take 1 tablet q6h", 10);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(4);
    });

    it("should parse Q8H abbreviation (3 times daily)", () => {
      const result = parseSigWithRules("take 1 tablet q8h", 10);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(3);
    });

    it("should parse Q12H abbreviation (2 times daily)", () => {
      const result = parseSigWithRules("take 1 tablet q12h", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should parse 'twice daily' pattern", () => {
      const result = parseSigWithRules("take 1 tablet twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should parse 'three times daily' pattern", () => {
      const result = parseSigWithRules("take 1 tablet three times daily", 14);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(3);
    });

    it("should parse 'once daily' pattern", () => {
      const result = parseSigWithRules("take 1 tablet once daily", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should parse units: tablets", () => {
      const result = parseSigWithRules("take 2 tablets daily", 30);
      expect(result).toBeDefined();
      expect(result?.unit).toBe("EA");
    });

    it("should parse units: milliliters", () => {
      const result = parseSigWithRules("take 5 ml daily", 30);
      expect(result).toBeDefined();
      expect(result?.unit).toBe("mL");
    });

    it("should parse units: units (insulin)", () => {
      const result = parseSigWithRules("inject 10 units twice daily", 28);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(10);
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should parse units: puffs (inhalers)", () => {
      const result = parseSigWithRules("inhale 2 puffs twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(2);
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should set parsedBy to 'rules' on success", () => {
      const result = parseSigWithRules("take 1 tablet twice daily", 30);
      expect(result?.parsedBy).toBe("rules");
    });

    it("should return null if no dose pattern found", () => {
      const result = parseSigWithRules("take as needed", 30);
      expect(result).toBeNull();
    });

    it("should return null for unparseable SIG", () => {
      const result = parseSigWithRules("as directed", 30);
      expect(result).toBeNull();
    });

    it("should be case-insensitive", () => {
      const lower = parseSigWithRules("take 1 tablet twice daily", 30);
      const upper = parseSigWithRules("TAKE 1 TABLET TWICE DAILY", 30);

      expect(lower?.frequencyPerDay).toBe(upper?.frequencyPerDay);
      expect(lower?.amountPerDose).toBe(upper?.amountPerDose);
    });

    it("should have high confidence for clear SIGs", () => {
      const result = parseSigWithRules("take 1 tablet twice daily", 30);
      expect(result).toBeDefined();
      expect(result!.confidence).toBeGreaterThan(0.7);
    });

    it("should include daysSupply in result", () => {
      const result = parseSigWithRules("take 1 tablet twice daily", 45);
      expect(result?.daysSupply).toBe(45);
    });

    // Real-world pharmacy scenarios
    it("Amoxicillin: 1 capsule three times daily", () => {
      const result = parseSigWithRules(
        "Take 1 capsule by mouth three times daily",
        10
      );
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
      expect(result?.frequencyPerDay).toBe(3);
    });

    it("Lisinopril: 1 tablet once daily", () => {
      const result = parseSigWithRules(
        "Take 1 tablet by mouth once daily",
        30
      );
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("Albuterol MDI: 2 puffs twice daily", () => {
      const result = parseSigWithRules("Inhale 2 puffs twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(2);
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("Insulin: 10 units twice daily", () => {
      const result = parseSigWithRules("Inject 10 units twice daily", 28);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(10);
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("Cough syrup: 5 mL four times daily", () => {
      const result = parseSigWithRules("Take 5 mL four times daily", 7);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(5);
      expect(result?.frequencyPerDay).toBe(4);
      expect(result?.unit).toBe("mL");
    });

    it("Metformin: 2 tablets twice daily", () => {
      const result = parseSigWithRules("Take 2 tablets twice daily", 90);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(2);
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should handle pharmaceutical abbreviations like PO (by mouth)", () => {
      const result = parseSigWithRules("take 1 tablet PO twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(2);
    });

    it("should handle 'at bedtime' frequency", () => {
      const result = parseSigWithRules("take 1 tablet at bedtime", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should handle 'in the morning' frequency", () => {
      const result = parseSigWithRules("take 1 tablet in the morning", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should handle 'at night' frequency", () => {
      const result = parseSigWithRules("take 1 tablet at night", 30);
      expect(result).toBeDefined();
      expect(result?.frequencyPerDay).toBe(1);
    });

    it("should handle decimal amounts", () => {
      const result = parseSigWithRules("take 1.5 tablets twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1.5);
    });

    it("should handle 'apply' verb for topicals", () => {
      const result = parseSigWithRules("apply 1 patch once daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
    });

    it("should handle 'use' verb", () => {
      const result = parseSigWithRules("use 1 spray twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
    });

    it("should handle 'instill' verb for eye drops", () => {
      const result = parseSigWithRules("instill 1 drop twice daily", 30);
      expect(result).toBeDefined();
      expect(result?.amountPerDose).toBe(1);
    });
  });
});
