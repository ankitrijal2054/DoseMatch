# DoseMatch - System Patterns

## Architecture Overview

**Pattern:** Hybrid Client-Server Architecture  
**Frontend:** Static SvelteKit (client-side logic)  
**Backend:** Firebase Cloud Functions (server-side AI)  
**Rationale:** Security (API keys), performance (static hosting), cost (minimal server usage)

---

## Key Technical Decisions

### 1. Security Architecture: Hybrid Client-Server

**Decision:** Public APIs client-side, OpenAI server-side via Cloud Functions

**Why:**

- ✅ RxNorm & FDA are public, no keys → client-side = faster, no server cost
- ✅ OpenAI requires secret key → server-side = secure, prevents abuse
- ✅ Best of both worlds: performance + security

**Implementation:**

```
Client (Browser)
├─ RxNorm adapter → Direct API call → Cache in localStorage
├─ FDA adapter → Direct API call → Cache in localStorage
└─ SIG Parser → Rules engine (client) → If needed → Cloud Function (server) → OpenAI
```

---

### 2. Caching Strategy: localStorage (Browser-Based)

**Decision:** Use localStorage for 24h TTL caching instead of server-side cache

**Why:**

- ✅ Static hosting has no server to cache on
- ✅ Persists across page reloads (better UX than in-memory)
- ✅ 5-10MB available (plenty for API responses)
- ✅ Automatic per-user caching (no shared cache needed)

**Pattern:**

```typescript
class BrowserCache {
  private CACHE_PREFIX = "dosematch_cache_";
  private DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24h

  set(key, data) {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, timestamp: Date.now(), ttl })
    );
  }

  get(key) {
    // Check expiration, auto-cleanup if expired
  }
}
```

**Cache Keys:**

- `dosematch_cache_RXNORM:lisinopril-10mg`
- `dosematch_cache_NDC:12345`

---

### 3. SIG Parsing: Rules First, AI Fallback

**Pattern:** Tiered parsing with confidence thresholds

**Why:**

- ✅ Rules engine handles 75%+ of common patterns (fast, free)
- ✅ AI handles edge cases only (slower, costs money)
- ✅ Fallback to defaults if both fail (safe)

**Flow:**

```
User Input: "Take 1 tablet twice daily"
    ↓
Rules Engine (Client)
├─ Regex: Extract dose, unit, frequency
├─ Confidence: 0.95 (>0.75 threshold) ✓
└─ Return: { amountPerDose: 1, unit: "EA", frequencyPerDay: 2 }

If confidence < 0.75:
    ↓
Cloud Function → OpenAI GPT-4o-mini
├─ System prompt: "You are a pharmacy SIG parser..."
├─ Parse JSON response
└─ Return: { ...parsed, confidence: 0.88, parsedBy: "llm" }

If LLM fails:
    ↓
Default Fallback
└─ Return: { amountPerDose: 1, unit: "EA", frequencyPerDay: 1, confidence: 0.3 }
```

---

### 4. Multi-Pack Selection: Optimized Combinatorial Search

**Pattern:** Greedy algorithm with early termination and constraints

**Why:**

- Original O(n² × maxPacks²) could hit 90,000 iterations
- Optimized to O(400) typical case with 4 constraints

**Optimizations:**

```typescript
1. Limit NDCs: slice(0, 20)
   → Reduces search space from O(n²) to O(400)

2. Overfill cap: if total > target * 1.15, skip
   → Prunes 70% of bad combinations early

3. Smart count limits: Math.ceil(target / packageSize) + 1
   → Don't try 3× huge pack for small quantity

4. Early termination: if overfill < 2%, return immediately
   → Stops when excellent match found
```

**Selection Priority:**

1. **Exact match** (score: 1500) - Single pack = target
2. **Multi-pack** (score: 1300) - 2-3 packs, <10% overfill
3. **Nearest overfill** (score: 1000) - Single pack, slight excess
4. **Underfill** (score: 500) - Partial fill, warn patient

---

### 5. Unit Normalization: Canonical Unit System

**Pattern:** Map all variants to 5 canonical units

**Canonical Units:**

- `EA` (each) - tablets, capsules, patches
- `mL` (milliliters) - liquids, suspensions
- `g` (grams) - creams, ointments
- `U` (units) - insulin
- `actuations` - inhalers, sprays

**Mapping:**

```typescript
{
  tab: "EA", tablet: "EA", cap: "EA", capsule: "EA",
  ml: "mL", milliliter: "mL", cc: "mL",
  mg: "g" (with /1000 conversion),
  u: "U", units: "U", iu: "U",
  puff: "actuations", inhalation: "actuations"
}
```

---

## Component Relationships

### Adapters (External API Integration)

**RxNorm Adapter:**

```
Input: Drug name or NDC
Process:
  1. Detect if NDC (11 digits) or name
  2. Call appropriate RxNorm endpoint
  3. Extract RxCUI, dose form, strength
  4. Cache result 24h
Output: RxNormResult { rxcui, doseForm, strength, synonyms }
```

**FDA Adapter:**

```
Input: RxCUI
Process:
  1. Query FDA NDC Directory by RxCUI
  2. Parse packaging array
  3. Extract NDC11, package size, unit, status
  4. Sort: ACTIVE first, then by size
  5. Cache result 24h
Output: NdcRecord[] { ndc11, packageSize, unit, status }
```

### Engines (Domain Logic)

**Quantity Engine:**

```typescript
totalUnits = amountPerDose × frequencyPerDay × daysSupply
// Always round up (Math.ceil) for dispensing
```

**Pack Engine:**

```
1. Filter NDCs by matching unit
2. Try exact match
3. Try multi-pack combinations (2-3 packs)
4. Fall back to nearest single pack
5. Score and rank all options
```

**Warning Engine:**

```
Check for:
- Inactive NDC in recommendation
- No exact match found
- High overfill (>20%)
- Partial fill (underfill)
Generate structured warnings with severity
```

### Controller (Orchestration)

**Main Flow:**

```
processRecommendation(input):
  1. Parse SIG (rules → LLM if needed)
  2. Normalize drug to RxCUI (RxNorm)
  3. Fetch NDCs (FDA)
  4. Calculate target quantity
  5. Recommend packs
  6. Generate warnings
  7. Return complete ResultPayload
```

---

## Design Patterns Used

### 1. **Adapter Pattern**

- `RxNormAdapter`, `FDAAdapter` wrap external APIs
- Consistent interface regardless of API differences
- Easy to swap implementations

### 2. **Strategy Pattern**

- SIG parsing: Rules strategy vs LLM strategy
- Pack selection: Exact, multi-pack, nearest strategies

### 3. **Chain of Responsibility**

- SIG parsing: Rules → LLM → Default
- Each handler tries, passes to next if confidence low

### 4. **Repository Pattern**

- Cache layer abstracts storage (could swap localStorage → Redis)

### 5. **Facade Pattern**

- Controller provides simple interface to complex subsystems

---

## Error Handling Philosophy

### Graceful Degradation

1. **Cache miss:** Fetch from API, app still works
2. **RxNorm timeout:** Show clear error, suggest NDC direct entry
3. **FDA timeout:** Show error, suggest retry
4. **OpenAI failure:** Fall back to rules engine result
5. **Rules engine uncertain:** Use LLM or safe defaults

### Never Fail Silently

- Always log to console
- Always show user-friendly message
- Always provide actionable suggestion

---

## Performance Patterns

### Debouncing (300ms)

```typescript
// Prevent excessive API calls while user typing
let timeout;
input.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => search(), 300);
});
```

### Lazy Loading

- Load RxNorm/FDA only when needed
- Don't call OpenAI unless rules fail

### Request Batching

- Could batch multiple SIG parses (future optimization)

---

## Testing Patterns

### Unit Tests (Vitest)

- Test pure functions in isolation
- Mock external dependencies
- Focus on units.ts, sig/rules.ts, engines/

### Integration Tests

- Mock API responses (golden files)
- Test full flow: input → recommendation
- Verify caching behavior

### Manual E2E

- Checklist-based testing
- Browser compatibility
- Network throttling scenarios

---

## GCP Migration Path

### Phase 1: Functions → Cloud Run (Minimal Changes)

```
1. Wrap Cloud Functions in Express/Fastify
2. Containerize with Dockerfile
3. Deploy to Cloud Run
4. Update FUNCTIONS_URL config
```

### Phase 2: Add Cloud Services (Optional)

```
- Redis (Memorystore) for shared cache
- Cloud SQL for persistent data (if auth added)
- Cloud Monitoring for observability
```

**Code Impact:** <5% (mostly config changes)

---

This system patterns document guides all architectural and implementation decisions.
