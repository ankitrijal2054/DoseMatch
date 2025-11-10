# DoseMatch - Active Context

**Last Updated:** November 10, 2025  
**Current Phase:** Phase 2 - Caching Layer  
**Status:** 🟢 Phase 1 Complete, Moving Forward

---

## Current Work Focus

### Immediate Next Steps

1. **Start Phase 2: Caching Layer**

   - Create `cache/index.ts` with BrowserCache class
   - Implement localStorage wrapper with 24h TTL
   - Add SSR-safe guards (typeof window checks)
   - Implement graceful degradation for cache failures
   - Add cache stats and clear methods

2. **Next: Phase 3 - API Adapters**

   - RxNorm adapter for drug normalization
   - FDA adapter for NDC package retrieval
   - Integrate caching layer with adapters

3. **Then: Phase 4 - SIG Parsing**
   - Rules-based parser (client-side)
   - LLM parser (Cloud Functions)
   - Unified parser orchestration

---

## Recent Changes

### Phase 1 Completed (Nov 10, 2025) ✅

1. **types.ts Created**

   - All core TypeScript interfaces defined
   - 5 canonical units established (EA, mL, g, U, actuations)
   - Complete type safety for domain logic
   - No linter errors

2. **units.ts Created**
   - 40+ unit aliases mapped to canonical forms
   - Unit normalization functions implemented
   - mg→g conversion logic added
   - Unit comparison utilities ready

**Impact:** Foundation for type-safe development across all subsequent phases

---

## Recent Changes (Architecture Decisions)

### Architecture Decisions Made (Nov 10, 2025)

1. **Security: OpenAI → Cloud Functions** ✅

   - **Decision:** Move SIG parsing LLM to server-side Cloud Function
   - **Rationale:** Protect API key, prevent abuse, enable GCP migration
   - **Impact:** Added Phase 0.2 (Functions setup), updated Phase 4

2. **Caching: In-Memory → localStorage** ✅

   - **Decision:** Use browser localStorage instead of server-side cache
   - **Rationale:** Static hosting has no server, localStorage persists across reloads
   - **Impact:** Complete rewrite of Phase 2.1 cache implementation

3. **Performance: Multi-Pack Optimization** ✅

   - **Decision:** Limit to 20 NDCs, add early termination, cap overfill at 15%
   - **Rationale:** Reduce O(n²) to O(400), 90% faster for typical cases
   - **Impact:** Updated Phase 6.1 algorithm with 4 optimizations

4. **Testing: Automated E2E → Manual Checklist** ✅

   - **Decision:** Skip Playwright automation, use manual testing checklist
   - **Rationale:** Sufficient for portfolio MVP, reduces complexity
   - **Impact:** Replaced Phase 10.3 with comprehensive manual checklist

5. **GCP Migration Path Documented** ✅
   - **Decision:** Document incremental migration approach
   - **Rationale:** User plans to migrate post-MVP if time permits
   - **Impact:** New section with Functions → Cloud Run path

---

## Active Decisions & Considerations

### Authentication (Deferred)

**Status:** Not implementing for MVP  
**Reason:** Portfolio project, open access reduces friction  
**Future:** Firebase Auth planned post-MVP for query history  
**No code impact:** Architecture designed to add auth later

### Rate Limiting (Deferred)

**Status:** Not implementing for MVP  
**Reason:** No auth, low traffic expected  
**Risk:** Potential API abuse (acceptable for portfolio)  
**Future:** Add if abuse detected or when auth implemented

### Error Handling (Simplified)

**Status:** Basic error handling only for MVP  
**Reason:** Focus on core functionality  
**Approach:** Clear error messages, graceful degradation  
**Future:** Enhanced UX with actionable suggestions

### OpenAI Explainer (Optional)

**Status:** Phase 11 marked as optional post-MVP  
**Reason:** Deterministic "why" field already sufficient  
**Decision:** Skip unless user requests or time allows

---

## Questions Resolved

### Q: How to secure OpenAI API key?

**A:** Firebase Cloud Functions with Secrets Manager ✅

### Q: What cache strategy with static hosting?

**A:** localStorage (browser-based, 24h TTL) ✅

### Q: How to optimize multi-pack algorithm?

**A:** 4 optimizations: 20 NDC limit, 15% overfill cap, smart counts, early exit ✅

### Q: Automated E2E testing needed?

**A:** No, manual checklist sufficient for MVP ✅

### Q: GCP migration path?

**A:** Functions → Cloud Run (documented, minimal code changes) ✅

### Q: Firebase or GCP for hosting?

**A:** Firebase for MVP, GCP migration option post-MVP ✅

### Q: Rate limiting needed?

**A:** No for MVP, may add with auth later ✅

---

## Current Blockers

**None.** All architectural decisions made, documents finalized, ready to proceed.

---

## Work in Progress

**None yet.** Starting from Phase 0.

---

## Upcoming Milestones

### Milestone 1: Phase 0 Complete (Est. 2-3 hours)

- ✅ SvelteKit project initialized
- ✅ Firebase project created and configured
- ✅ Tailwind CSS with Foundation Health theme
- ✅ Project structure in place
- ✅ Environment variables configured
- ✅ Firebase emulators working

### Milestone 2: Core Logic Complete (Est. 1-2 days)

- Phases 1-7 complete
- Domain types, unit system, caching, adapters, parsers, engines
- Ready for UI implementation

### Milestone 3: UI & Integration (Est. 1-2 days)

- Phases 8-9 complete
- Controller orchestration, SvelteKit UI
- End-to-end flow working locally

### Milestone 4: Testing & Deployment (Est. 1 day)

- Phases 10-12 complete
- Tests passing, deployed to Firebase
- Live URL working

### Milestone 5: Polish & Launch (Est. 1 day)

- Phases 13-14 complete
- Documentation, accessibility, final testing
- Portfolio-ready

**Total Estimate:** 4-6 days of focused work

---

## Development Environment Status

### Tools Installed

- ⏳ Node.js 18+ (needs verification)
- ⏳ npm/yarn (needs verification)
- ⏳ Firebase CLI (needs installation)
- ⏳ Git (needs verification)

### APIs Ready

- ⏳ OpenAI API key (needs acquisition)
- ✅ RxNorm API (public, no key needed)
- ✅ FDA NDC Directory API (public, no key needed)

### Accounts Needed

- ⏳ Firebase account (needs setup)
- ⏳ Firebase project (needs creation)
- ⏳ OpenAI account (needs setup if not already)

---

## Next Session Checklist

When resuming work:

1. ✅ **Read Memory Bank files** (all 6 files)

   - projectbrief.md - Understand project goals
   - productContext.md - Understand user needs
   - systemPatterns.md - Understand architecture
   - techContext.md - Understand tech stack
   - activeContext.md (this file) - Understand current state
   - progress.md - Understand what's done

2. ✅ **Review Docs/**

   - TaskList.md - Phase 0 instructions
   - PRD.md - Original requirements
   - architecture.md - System diagram

3. ✅ **Start Phase 0.1**
   - Initialize SvelteKit project
   - Follow TaskList.md step-by-step

---

## Notes for Future Self

### Important Reminders

- **No rush:** Flexible timeline, focus on quality
- **Portfolio focus:** This demonstrates skill for Foundation Health
- **Document decisions:** Update Memory Bank when making choices
- **Test incrementally:** Verify each phase before moving on
- **Ask questions:** Clarify uncertainties before implementing

### Patterns to Follow

- **Client-side:** RxNorm, FDA adapters, rules engine
- **Server-side:** OpenAI calls only
- **Cache everything:** 24h TTL in localStorage
- **Fail gracefully:** Always provide fallback or clear error

### Avoid These Mistakes

- ❌ Don't put OpenAI key in client code
- ❌ Don't skip caching (APIs are slow)
- ❌ Don't over-engineer (MVP first, enhance later)
- ❌ Don't forget to test with real drugs (not just mocks)

---

**Memory Bank Status:** ✅ Complete and up-to-date  
**Documents Status:** ✅ All finalized and consistent  
**Project Status:** 🚀 Ready to start Phase 0

This active context will be updated as work progresses.
