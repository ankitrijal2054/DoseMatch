# DoseMatch - Product Context

## Why This Project Exists

DoseMatch addresses a critical pain point in pharmacy operations: **prescription fulfillment errors due to incorrect NDC matching and quantity calculations**. Every day, pharmacists face:

- **Claim rejections** from insurance due to wrong NDC codes
- **Patient frustration** from delayed prescriptions
- **Operational inefficiency** from manual error correction
- **Financial loss** from rejected claims and wasted inventory

Current pharmacy systems lack intelligent NDC matching and often require manual intervention, leading to a 20%+ error rate in complex scenarios.

---

## Problems It Solves

### 1. **Dosage Form Mismatches**

**Problem:** Prescription says "tablets" but system selects "capsules"  
**Solution:** RxNorm normalization ensures correct dosage form matching

### 2. **Package Size Confusion**

**Problem:** Need 60 tablets but available packs are 30, 90, or 100  
**Solution:** Multi-pack optimizer finds best combination (e.g., 2×30) with minimal waste

### 3. **Inactive NDC Selection**

**Problem:** System selects discontinued NDC, claim gets rejected  
**Solution:** Real-time FDA status check + prominent warnings for inactive NDCs

### 4. **Complex SIG Interpretation**

**Problem:** "Take 1 tablet twice daily" vs "Take 2 tablets once daily at bedtime"  
**Solution:** AI-assisted SIG parsing with 95%+ accuracy using rules + GPT-4o-mini fallback

### 5. **Unit Conversion Errors**

**Problem:** Mixing tablets, mL, units (insulin), actuations (inhalers)  
**Solution:** Canonical unit system (EA, mL, g, U, actuations) with automatic normalization

---

## How It Should Work

### User Journey

```
1. Pharmacist opens DoseMatch
2. Enters drug name (e.g., "lisinopril 10mg")
3. Enters SIG (e.g., "Take 1 tablet once daily")
4. Enters days supply (e.g., 30 days)
5. Clicks "Calculate Recommendation"

↓ System processes (< 2 seconds)

6. See parsed SIG breakdown
   - Dose: 1 EA
   - Frequency: 1×/day
   - Confidence: 95%

7. See recommendation
   - Primary: NDC 12345678901 (30 tablets) - EXACT MATCH ✓
   - Alternatives: 2 other options
   - Warnings: None

8. Copy JSON or manually enter NDC into pharmacy system
```

### Key Features

**Smart SIG Parsing:**

- Rules engine handles 75% of common patterns instantly
- OpenAI GPT-4o-mini handles complex/ambiguous cases
- Shows confidence score and rationale

**Multi-Pack Optimization:**

- Finds exact matches when available
- Suggests optimal pack combinations (e.g., 2×30 + 1×15 = 75)
- Highlights overfill/underfill with percentages

**Active NDC Verification:**

- Real-time status from FDA NDC Directory
- Prominent "INACTIVE" badges
- Warnings for discontinued products

**Unit Intelligence:**

- Handles tablets, liquids, insulin, inhalers
- Automatic unit normalization (tabs→EA, cc→mL)
- Prevents unit mismatch errors

---

## User Experience Goals

### Performance

- **<2 second response** for 95% of queries
- **Instant results** for cached drugs (localStorage)
- **Smooth loading states** with progress indicators

### Clarity

- **Plain English explanations** for every recommendation
- **Visual badges** for status (Active, Inactive, Exact Match)
- **Color-coded warnings** (red=error, yellow=warning, blue=info)

### Trust

- **Show confidence scores** for SIG parsing
- **Explain "why"** for each recommendation
- **Provide alternatives** so user can choose
- **Structured JSON output** for verification

### Efficiency

- **Quick presets** for common drugs (Amoxicillin, Lisinopril, etc.)
- **One-click copy** of JSON results
- **No login required** for MVP (reduce friction)

---

## What Makes It Different

### vs. Manual Calculation

- ✅ 10× faster
- ✅ Eliminates math errors
- ✅ Checks NDC status automatically

### vs. Basic Pharmacy Systems

- ✅ AI-assisted SIG parsing
- ✅ Multi-pack optimization
- ✅ Real-time inactive NDC detection
- ✅ Unit normalization

### vs. Enterprise Solutions

- ✅ Free and open (portfolio project)
- ✅ No integration required (standalone tool)
- ✅ Beautiful, modern UI
- ✅ Transparent calculations (show your work)

---

## Design Principles

1. **Accuracy First:** Never sacrifice correctness for speed
2. **Transparency:** Always show how we arrived at recommendation
3. **Pragmatic AI:** Use LLM only when rules engine insufficient
4. **Graceful Degradation:** Work without AI if OpenAI unavailable
5. **Patient Safety:** Err on side of caution (highlight warnings)

---

## Future Vision (Post-MVP)

### User Accounts

- Save query history
- Track most-used drugs
- Personal preferences (default days supply)

### Analytics Dashboard

- Most common drugs
- SIG parsing accuracy trends
- NDC active/inactive ratio

### Integration

- Pharmacy management system APIs
- Batch processing (upload CSV)
- Export to PDF/Excel

### Advanced Features

- OCR for prescription images
- Voice input for SIG
- Multi-language support

---

This product context guides all feature decisions and UI/UX design.
