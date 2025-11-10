# DoseMatch Memory Bank

**Purpose:** Persistent knowledge base for the DoseMatch project. After each session reset, these files ensure complete context restoration and seamless continuation of work.

**Last Updated:** November 10, 2025

---

## 📂 File Structure

```
memory-bank/
├── README.md              ← You are here
├── projectbrief.md        ← Foundation (read first)
├── productContext.md      ← Why & How
├── systemPatterns.md      ← Architecture & Patterns
├── techContext.md         ← Technology Stack
├── activeContext.md       ← Current Work Focus
└── progress.md            ← What's Done & What's Left
```

---

## 📖 Reading Order

### For New Session / Context Reset:

1. **projectbrief.md** - Understand project goals, scope, constraints
2. **productContext.md** - Understand user needs and product vision
3. **systemPatterns.md** - Understand architecture and design patterns
4. **techContext.md** - Understand technology stack and setup
5. **activeContext.md** - Understand current state and next steps
6. **progress.md** - Understand what's complete and what's pending

**Total Reading Time:** ~15-20 minutes for complete context

---

## 📄 File Descriptions

### 1. projectbrief.md (Foundation Document)

**Purpose:** Source of truth for project scope, goals, and constraints  
**Key Contents:**

- Project overview and tagline
- Core problem and solution
- Success criteria (MVP)
- Target users
- Technology stack summary
- Phase overview

**When to Update:**

- Project scope changes
- Success criteria changes
- Major pivot or direction shift

---

### 2. productContext.md

**Purpose:** Why this product exists and how it should work  
**Key Contents:**

- Problems being solved
- User journeys and workflows
- UX goals and design principles
- Feature differentiation
- Future vision (post-MVP)

**When to Update:**

- User feedback changes priorities
- New pain points discovered
- UX decisions made
- Feature additions/removals

---

### 3. systemPatterns.md

**Purpose:** Architecture, design patterns, and technical decisions  
**Key Contents:**

- Architectural patterns (Hybrid Client-Server)
- Key technical decisions (rationale included)
- Component relationships
- Design patterns used
- Error handling philosophy
- Performance patterns
- GCP migration path

**When to Update:**

- Major architectural decision made
- New pattern introduced
- Component structure changes
- Performance optimization added

---

### 4. techContext.md

**Purpose:** Technology stack, tools, and technical constraints  
**Key Contents:**

- Frontend/backend tech stack
- External API details (RxNorm, FDA, OpenAI)
- Development setup and workflow
- Dependencies
- Security considerations
- Monitoring & logging
- Troubleshooting guide

**When to Update:**

- New dependency added
- API changes or new API integrated
- Development workflow changes
- Security consideration discovered

---

### 5. activeContext.md

**Purpose:** Current state, active decisions, and immediate next steps  
**Key Contents:**

- Immediate next steps (always current)
- Recent changes and decisions
- Active decisions and considerations
- Questions resolved
- Current blockers
- Work in progress
- Upcoming milestones
- Notes for future self

**When to Update:**

- ⚠️ **MOST FREQUENTLY UPDATED FILE**
- After completing any task
- Before ending work session
- When making important decisions
- When encountering blockers
- When planning next steps

---

### 6. progress.md

**Purpose:** Track what works, what's in progress, and what's left  
**Key Contents:**

- Completed phases/tasks (✅)
- In-progress work (🚧)
- Pending tasks (📋)
- Phase completion summary table
- Known issues
- Future enhancements list
- Velocity tracking (once started)
- Lessons learned

**When to Update:**

- After completing any phase or task
- When discovering new issues
- At end of each work session
- When adding future enhancements

---

## 🔄 Update Workflow

### After Completing Work

1. Update **progress.md** - Mark tasks complete, update table
2. Update **activeContext.md** - Document decisions, update next steps
3. Update **techContext.md** - If new tech/patterns used
4. Update **systemPatterns.md** - If architecture changed

### When User Says "Update Memory Bank"

**MUST review ALL 6 files**, even if not all need updates. Focus on:

- activeContext.md (always needs review)
- progress.md (what's new since last update)
- Other files as relevant

---

## 🎯 Memory Bank Principles

### 1. **Self-Contained**

Each file should be readable independently but references others when needed.

### 2. **Always Current**

activeContext.md and progress.md MUST reflect latest state.

### 3. **Decision Documentation**

Always include "why" not just "what" for important decisions.

### 4. **Future-Self Friendly**

Write as if explaining to someone who knows nothing about the project.

### 5. **Hierarchical**

projectbrief.md is foundation → other files build upon it.

---

## 🚀 Quick Start (New Session)

```
1. Read projectbrief.md (5 min)
2. Skim systemPatterns.md (3 min)
3. Read activeContext.md thoroughly (5 min)
4. Check progress.md for current phase (2 min)
5. Start work on "Immediate Next Steps" from activeContext.md
```

---

## 📋 Memory Bank Health Check

✅ **Healthy Memory Bank:**

- activeContext.md has clear next steps
- progress.md table is up-to-date
- No contradictions between files
- Recent updates within last session

⚠️ **Needs Update:**

- activeContext.md "next steps" completed but not updated
- progress.md doesn't match actual code state
- Files contradict each other
- "Last Updated" dates are old

---

## 🔧 Maintenance

### Weekly Review (If Long Project)

- Verify all files still accurate
- Update progress table
- Archive completed phases details
- Update velocity tracking

### After Major Milestone

- Document lessons learned in progress.md
- Update future enhancements
- Celebrate in activeContext.md notes

---

## 📚 Related Documents

**In `/Docs/` folder:**

- `PRD.md` - Original product requirements
- `TaskList.md` - Detailed step-by-step build guide (14 phases)
- `architecture.md` - System architecture diagram (Mermaid)

**Memory Bank vs Docs:**

- **Memory Bank** = Living documents, frequently updated, current state
- **Docs** = Reference documents, less frequent updates, foundational

---

**For Questions About Memory Bank:**
Refer to the user rules section on Memory Bank structure and workflows.

---

This README helps maintain and navigate the Memory Bank effectively.
