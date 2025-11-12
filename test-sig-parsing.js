#!/usr/bin/env node

/**
 * Quick SIG Parsing Validator
 * 
 * Usage: node test-sig-parsing.js
 * 
 * Tests various SIG patterns to demonstrate the enhanced parsing engine.
 */

// Test cases: [input, expectedFrequency, expectedDose, expectedRoute]
const testCases = [
  // Simple patterns
  {
    sig: "take 1 tablet twice daily",
    expected: { dose: 1, freq: 2, route: undefined },
    desc: "Simple: twice daily"
  },
  {
    sig: "take 2 capsules three times daily",
    expected: { dose: 2, freq: 3, route: undefined },
    desc: "Simple: three times daily"
  },

  // Dose ranges
  {
    sig: "take 1-2 tablets twice daily",
    expected: { dose: 1, doseMax: 2, freq: 2, maxDaily: 4 },
    desc: "Dose range: 1-2 tablets"
  },

  // Frequency ranges
  {
    sig: "take 1 tablet every 6 hours",
    expected: { dose: 1, freq: 4, maxDaily: 4 },
    desc: "Every 6 hours: 4x per day"
  },
  {
    sig: "take 1 tablet every 4-6 hours",
    expected: { dose: 1, freq: 4, freqMax: 6, maxDaily: 6 },
    desc: "Frequency range: every 4-6 hours"
  },

  // Route extraction
  {
    sig: "take 1 tablet by mouth twice daily",
    expected: { dose: 1, freq: 2, route: "mouth" },
    desc: "Route: by mouth"
  },
  {
    sig: "apply 1 patch topical once daily",
    expected: { dose: 1, freq: 1, route: "topical" },
    desc: "Route: topical"
  },
  {
    sig: "inhale 2 puffs twice daily",
    expected: { dose: 2, freq: 2, route: "inhaled" },
    desc: "Route: inhaled"
  },

  // Duration
  {
    sig: "take 1 tablet twice daily for 7 days",
    expected: { dose: 1, freq: 2, duration: 7 },
    desc: "Duration: for 7 days"
  },
  {
    sig: "take 1 tablet tid x 10 days",
    expected: { dose: 1, freq: 3, duration: 10 },
    desc: "Duration: x10 days"
  },

  // PRN
  {
    sig: "take 1-2 tablets as needed for pain",
    expected: { dose: 1, doseMax: 2, prn: true, indication: "pain" },
    desc: "PRN: as needed for pain"
  },

  // Complex real-world
  {
    sig: "take 1-2 tab po qid x7d prn pain",
    expected: {
      dose: 1,
      doseMax: 2,
      freq: 4, // QID = 4 times daily
      route: "po",
      duration: 7,
      prn: true,
      indication: "pain",
      maxDaily: 8
    },
    desc: "Complex: ParseRx example"
  },
  {
    sig: "take 1-2 tablets every 6 hours for pain",
    expected: {
      dose: 1,
      doseMax: 2,
      freq: 4, // every 6 hours = 4x/day
      indication: "pain",
      maxDaily: 8
    },
    desc: "Complex: dose range + frequency + indication"
  },
];

console.log("\n╔════════════════════════════════════════════════════════════════════╗");
console.log("║         DoseMatch Enhanced SIG Parsing - Test Cases              ║");
console.log("╚════════════════════════════════════════════════════════════════════╝\n");

// Display test cases
testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.desc}`);
  console.log(`   Input: "${testCase.sig}"`);
  console.log(`   Expected:`);
  Object.entries(testCase.expected).forEach(([key, value]) => {
    console.log(`     - ${key}: ${value}`);
  });
});

console.log("\n═══════════════════════════════════════════════════════════════════════");
console.log("\n✅ To run actual tests with real parsing:");
console.log("   cd frontend");
console.log("   npm run test -- src/lib/sig/rules.test.ts");

console.log("\n📊 Stats:");
console.log(`   Total test cases: ${testCases.length}`);
console.log(`   Coverage: Simple, Ranges, Routes, Duration, PRN, Complex Real-World`);

console.log("\n🎯 Expected Results:");
console.log("   All tests should pass with high confidence (0.85+)");
console.log("   Route, duration, indication fields populated when present");
console.log("   Max daily dose calculated correctly for ranges");

console.log("\n═══════════════════════════════════════════════════════════════════════\n");

