# DoseMatch - Technical Context

## Technology Stack

### Frontend

**Framework:** SvelteKit  
**Version:** Latest (as of project start)  
**Why:** Lightweight, fast, excellent DX, built-in routing

**Language:** TypeScript  
**Why:** Type safety, better IDE support, catch errors at compile time

**Styling:** Tailwind CSS  
**Why:** Utility-first, fast prototyping, Foundation Health custom theme

**Adapter:** `@sveltejs/adapter-static`  
**Why:** Static output for Firebase Hosting, fast loading, cheap hosting

---

### Backend

**Platform:** Firebase Cloud Functions  
**Runtime:** Node.js 18  
**Why:** Serverless, automatic scaling, easy Firebase integration

**Language:** TypeScript  
**Why:** Shared types with frontend, type safety

**Functions:**

- `parseSigWithLLM` - SIG parsing via OpenAI (callable function)
- `explainRecommendation` - Optional AI explainer (post-MVP)

---

### Hosting & Deployment

**Hosting:** Firebase Hosting  
**Why:** Free tier generous, global CDN, automatic SSL

**Functions:** Firebase Cloud Functions (2nd gen)  
**Why:** Integrated with Hosting, same project, easy secrets management

**Domain:** TBD (Firebase subdomain for MVP)

---

### External APIs

#### 1. RxNorm API (NLM)

**URL:** `https://rxnav.nlm.nih.gov/REST`  
**Purpose:** Drug normalization to RxCUI  
**Auth:** None (public)  
**Rate Limit:** Reasonable use (~100/min)  
**Endpoints:**

- `/approximateTerm.json` - Drug name search
- `/ndcstatus.json` - NDC to RxCUI
- `/rxcui/{rxcui}/property.json` - Drug details

**Cache:** 24h TTL (drug names rarely change)

#### 2. FDA NDC Directory API (OpenFDA)

**URL:** `https://api.fda.gov/drug/ndc.json`  
**Purpose:** NDC package information and status  
**Auth:** None (public, rate limit 240/min without key)  
**Rate Limit:** 240 requests/min (1000/min with API key)  
**Query:** `search=openfda.rxcui:"12345"&limit=100`

**Cache:** 24h TTL (NDC status changes infrequently)

#### 3. OpenAI API

**Model:** GPT-4o-mini  
**Purpose:** Complex SIG parsing fallback  
**Auth:** API key (secured in Firebase Secrets)  
**Rate Limit:** Tier-based (expect Tier 1: 500 RPM, 200k TPD)  
**Cost:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

**Usage Pattern:** ~150 tokens per SIG parse  
**Cost Estimate:** ~$0.00001 per parse (1¢ per 1000 parses)

---

### Data Storage

**Cache:** localStorage (browser-based)  
**Structure:**

```json
{
  "dosematch_cache_RXNORM:lisinopril-10mg": {
    "data": { "rxcui": "123", ... },
    "timestamp": 1699632000000,
    "ttl": 86400000
  }
}
```

**Size Limit:** 5-10MB per domain (more than enough)  
**Persistence:** Until cleared or expired

---

### Development Setup

#### Required Tools

- **Node.js:** 18+ (LTS)
- **npm:** 9+ (or yarn/pnpm)
- **Firebase CLI:** `npm install -g firebase-tools`
- **Git:** Version control

#### Environment Variables

**Frontend (.env.local):**

```bash
PUBLIC_RXNORM_BASE_URL=https://rxnav.nlm.nih.gov/REST
PUBLIC_FDA_NDC_BASE_URL=https://api.fda.gov/drug/ndc.json
PUBLIC_APP_MODE=demo
PUBLIC_FUNCTIONS_URL=http://127.0.0.1:5001/PROJECT_ID/us-central1
```

**Functions (functions/.env):**

```bash
OPENAI_API_KEY=sk-...
```

**Production (Firebase Secrets):**

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

---

### Development Workflow

#### Local Development

```bash
# Terminal 1: Frontend dev server
npm run dev  # localhost:5173

# Terminal 2: Firebase emulators
firebase emulators:start  # Functions on 5001, Hosting on 5000

# Terminal 3: Watch mode (optional)
npm test -- --watch
```

#### Testing

```bash
npm test                    # Unit + Integration (Vitest)
# Manual E2E: Follow checklist in Docs/TaskList.md Phase 10.3
```

#### Build & Deploy

```bash
npm run build               # Build frontend → build/
npm run build:functions     # Build functions → functions/lib/
npm run deploy              # Deploy both to Firebase
```

---

### Technical Constraints

#### API Limitations

- **RxNorm:** No SLA, occasional downtime, ~500-1500ms latency
- **FDA:** 240 req/min without key, 1000 req/min with key
- **OpenAI:** Rate limits vary by tier, costs per token

#### Browser Limitations

- **localStorage:** 5-10MB max (easily sufficient)
- **CORS:** RxNorm/FDA support CORS, OpenAI requires server-side

#### Performance Targets

- **P50:** <800ms (achievable with cache)
- **P95:** <2.0s (RxNorm + FDA sequential = ~1.5s)
- **Cache hit:** <100ms (localStorage read)

---

### Dependencies

#### Frontend (package.json)

```json
{
  "dependencies": {
    "axios": "^1.x",
    "date-fns": "^2.x"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.x",
    "@sveltejs/kit": "^2.x",
    "svelte": "^4.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "vitest": "^1.x"
  }
}
```

#### Functions (functions/package.json)

```json
{
  "dependencies": {
    "firebase-functions": "^5.x",
    "firebase-admin": "^12.x",
    "axios": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x"
  },
  "engines": {
    "node": "18"
  }
}
```

---

### Security Considerations

#### API Key Protection

- ✅ OpenAI key in Firebase Secrets (never in code)
- ✅ No keys in client bundle (verified via build inspection)
- ✅ Functions-only API access (client can't call OpenAI directly)

#### CORS & CSP

- RxNorm/FDA: Public CORS-enabled
- Cloud Functions: CORS configured automatically
- No CSP restrictions needed for MVP

#### Data Privacy

- ✅ No PHI/PII stored (ephemeral calculations only)
- ✅ No user accounts (no data to breach)
- ✅ localStorage cache local to user's browser

---

### Monitoring & Logging

#### Development

- `console.log()` for debugging
- Firebase Emulator logs in terminal
- Browser DevTools Network tab

#### Production

```bash
firebase functions:log          # View function logs
firebase hosting:channel:deploy preview  # Deploy to preview
```

**Metrics to Watch:**

- Function invocations (count)
- Function errors (count)
- Response times (P50, P95)
- OpenAI token usage (cost)

---

### GCP Migration Technical Details

#### Current: Firebase Functions

```
Runtime: Node.js 18
Trigger: HTTPS (callable)
Region: us-central1 (default)
Scaling: Automatic (0 to N)
Cold start: 1-3s (acceptable)
```

#### Future: Cloud Run

```
Runtime: Custom container (Node.js 18)
Trigger: HTTPS (any framework)
Region: Configurable
Scaling: 0 to N (faster cold starts)
Cold start: 500ms-1s (better)
```

**Migration Steps:**

1. Wrap functions in Express/Fastify
2. Create Dockerfile
3. Build container: `docker build -t dosematch-api .`
4. Deploy to Cloud Run: `gcloud run deploy dosematch-api`
5. Update `PUBLIC_FUNCTIONS_URL` in frontend

**Code Changes:** <100 lines (mostly HTTP wrapper)

---

### Troubleshooting Common Issues

#### Issue: "localStorage is not defined"

**Cause:** SSR trying to access localStorage  
**Fix:** Check `typeof window !== 'undefined'` before accessing

#### Issue: CORS error calling functions

**Cause:** Incorrect function URL or not using callable  
**Fix:** Use Firebase SDK `functions.httpsCallable()` or check CORS headers

#### Issue: OpenAI timeout

**Cause:** Slow LLM response or rate limit  
**Fix:** Increase timeout to 8s, handle error gracefully, fall back to rules

#### Issue: Cache not working

**Cause:** localStorage full or browser privacy mode  
**Fix:** Graceful degradation (catch errors, continue without cache)

---

This technical context ensures all technology choices are documented and justified.
