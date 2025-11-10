# DoseMatch - Project Brief

**Organization:** Foundation Health (Portfolio Project)  
**Developer:** Ankit  
**Project Type:** Portfolio demonstration for Foundation Health  
**Timeline:** No fixed deadline (flexible development)  
**Status:** Pre-development (documents finalized, ready to build)

---

## Project Overview

**DoseMatch** is an AI-accelerated NDC (National Drug Code) packaging and quantity calculator designed to enhance prescription fulfillment accuracy in pharmacy systems. The tool matches prescriptions with valid NDCs and calculates correct dispense quantities, addressing common issues like dosage form mismatches, package size errors, and inactive NDCs.

**Tagline:** _"From SIG to shelf—perfect fills, every time."_

---

## Core Problem

Pharmacy systems struggle with:

- **Dosage form mismatches** leading to claim rejections
- **Package size errors** causing fulfillment delays
- **Inactive NDCs** resulting in rejected prescriptions
- **Manual calculation errors** in quantity dispensing
- **Time-consuming processes** for pharmacists

These issues lead to operational delays, claim rejections, and patient frustration.

---

## Project Goals

### Business Goals

1. Improve medication normalization accuracy to 95%+
2. Reduce NDC-related claim rejections by 50%
3. Demonstrate technical capabilities for Foundation Health
4. Create portfolio-ready showcase of full-stack development

### Technical Goals

1. Build secure, scalable architecture using Firebase + GCP
2. Implement AI-assisted SIG parsing (OpenAI GPT-4o-mini)
3. Optimize multi-pack selection algorithm for performance
4. Design system ready for GCP migration post-MVP
5. Maintain <2 second response times with caching

---

## Success Criteria (MVP)

**Must Have:**

- Input drug name/NDC + SIG + days supply → accurate recommendation
- SIG parsing with rules engine + LLM fallback (75%+ confidence)
- RxNorm drug normalization
- FDA NDC retrieval with active/inactive status
- Multi-pack optimization (up to 3 packs)
- Inactive NDC warnings
- Clean UI with Foundation Health branding
- Deployed to Firebase Hosting
- OpenAI API secured server-side

**Performance Targets:**

- P50 < 800ms, P95 < 2.0s
- 24h caching (localStorage)
- Support EA, mL, g, U, actuations units

**Optional (Post-MVP):**

- Firebase Auth for user history
- GCP migration to Cloud Run
- Advanced analytics
- Batch processing

---

## Target Users

**Primary:**

- Pharmacists requiring accurate NDC matching and quantity calculation
- Pharmacy Technicians needing streamlined prescription processing

**Secondary:**

- Healthcare Administrators monitoring operational efficiency

---

## Key Constraints

1. **No Authentication (MVP):** Open access, no user accounts initially
2. **Portfolio Project:** Must demonstrate skill without over-engineering
3. **Budget Conscious:** Firebase free tier + minimal API costs
4. **Solo Developer:** All work by Ankit, no team dependencies
5. **API Dependencies:** RxNorm, FDA NDC Directory, OpenAI availability

---

## Out of Scope (MVP)

- Real-time prescription processing beyond NDC calculations
- Integration with pharmacy management systems
- Advanced analytics on prescription data
- Multi-language support
- Voice input
- Whiteboard/drawing features
- PDF/Excel export

---

## Project Phases

**Phase 0:** Project Foundation (Setup, Firebase, Branding)  
**Phase 1:** Domain Types & Unit System  
**Phase 2:** Caching Layer (localStorage)  
**Phase 3:** API Adapters (RxNorm, FDA)  
**Phase 4:** SIG Parsing (Rules + Cloud Functions)  
**Phase 5:** Quantity Calculation Engine  
**Phase 6:** Pack Selection Engine (Multi-Pack)  
**Phase 7:** Warnings & Evaluation  
**Phase 8:** Main Controller (Orchestration)  
**Phase 9:** UI Implementation (SvelteKit)  
**Phase 10:** Testing (Unit, Integration, Manual E2E)  
**Phase 11:** OpenAI Explainer (Optional)  
**Phase 12:** Firebase Deployment  
**Phase 13:** Documentation & Polish  
**Phase 14:** Final Testing & Launch

---

## Technology Stack

**Frontend:** SvelteKit, TypeScript, Tailwind CSS  
**Backend:** Firebase Cloud Functions (Node.js 18)  
**Hosting:** Firebase Hosting (static)  
**APIs:** RxNorm, FDA NDC Directory, OpenAI GPT-4o-mini  
**Caching:** localStorage (browser-based, 24h TTL)  
**Future:** GCP Cloud Run migration path documented

---

## Key Metrics

- Normalization accuracy: 95%+
- Response time: <2s (P95)
- Cache hit rate: Track in console
- API costs: Monitor OpenAI usage
- User satisfaction: Qualitative feedback from testing

---

This project brief serves as the foundation for all other Memory Bank documents.
