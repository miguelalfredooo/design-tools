# Documentation Consolidation Plan
**Date:** 2026-03-19
**Status:** In Progress

---

## Executive Summary

Carrier documentation is spread across 30+ files with significant redundancy, outdated content, and missing critical pieces. This plan consolidates into a clear hierarchy with single sources of truth.

---

## Current State Analysis

### 📁 Files to Keep (Core)

#### 1. **README.md** → REWRITE
**Current state:** Generic Next.js template (obsolete)
**Action:** Replace with Carrier-specific README
**Content:**
- Project overview (what Carrier is)
- Quick start (install, dev servers, ports)
- Key features
- Links to detailed docs

---

#### 2. **CREW_HANDOFF_SPEC.md** → KEEP & CONSOLIDATE
**Current state:** Agent handoff spec (high quality, well-structured)
**Issues:** Overlaps with `docs/carrier-crew-system.md`
**Action:** Keep as the canonical spec. Move agent persona details to `crew/AGENTS.md`.

---

#### 3. **crew/README.md** → CONSOLIDATE INTO `crew/SETUP.md`
**Current state:** Setup + troubleshooting
**Action:**
- Keep setup steps
- Move Python version warning to `crew/PYTHON_VERSION.md`
- Move troubleshooting to `crew/TROUBLESHOOTING.md`

---

#### 4. **docs/carrier-crew-system.md** → CONSOLIDATE INTO `CREW_HANDOFF_SPEC.md`
**Current state:** Crew system details (architecture, agents, flows)
**Issues:** Nearly identical to CREW_HANDOFF_SPEC.md with less clarity
**Action:** DELETE. Merge unique content (data sources table, execution flow diagram) into CREW_HANDOFF_SPEC.

---

#### 5. **HANDOFF.md** → RENAME to `TIER_SYNTHESIS_HANDOFF.md`
**Current state:** Tier synthesis UI handoff (dated March 19, 2026)
**Issues:** Timestamp suggests it's a session handoff, not reference documentation
**Action:** Rename, move to `docs/`, add "See also" links to crew spec.

---

#### 6. **docs/carrier-prd.md** → KEEP AS REFERENCE
**Current state:** Product requirements (detailed, comprehensive)
**Action:** Keep but mark clearly as "aspirational product spec" (not all features implemented yet)

---

#### 7. **docs/design-principles.md** → KEEP
**Current state:** Design philosophy (10 principles, HIG/Material Design references)
**Action:** Keep as-is. High quality.

---

### 🗑️ Files to Delete

1. **`.planning/PHASE-1-HANDOFF.md`** — Old phase handoff, superseded by current work
2. **`.planning/01-security-foundation/**`** — Old security foundation phase, completed
3. **`docs/brainstorms/2026-03-11-*.md`** — Old brainstorms, work already implemented
4. **`docs/plans/2026-03-05-*.md`** — Old plans, feature already shipped
5. **`docs/plans/2026-03-11-feat-design-ops-crew-plan.md`** — Implementation plan, work complete
6. **`docs/superpowers/HANDOFF-tier-synthesis-ui.md`** — Superseded by TIER_SYNTHESIS_HANDOFF.md
7. **`docs/PHASE_3_VERIFICATION.md`** — Completed phase documentation
8. **`docs/SYNTHESIS_TIERS_IMPLEMENTATION.md`** — Implementation notes, not reference material
9. **`docs/RAPTIVE_COMMUNITY_CONTEXT.md`** — Project-specific context, not needed for current iteration
10. **`TIER_SYNTHESIS_COMPLETION.md`** — Completion summary, superseded by HANDOFF.md

---

### 📝 Files to Create (Missing Docs)

#### 1. **crew/AGENTS.md** — Agent Reference
**Purpose:** Document each agent in detail
**Content:**
- Agent 1: Product Manager
  - Role, goal, persona, grounding
  - Inputs & gate checks
  - Output requirements
  - Example usage
- Agent 2: Research & Insights
  - (same structure)
- Agent 3: Product Designer
  - (same structure)

**Why needed:** Currently spread across CREW_HANDOFF_SPEC.md and carrier-crew-system.md. Agents are the core abstraction and deserve dedicated, detailed documentation.

---

#### 2. **crew/JSON_SCHEMA_VALIDATION.md** — Schema Reference
**Purpose:** Document how agent outputs are validated
**Content:**
- Why JSON validation matters (prevents agent drift)
- Pydantic schemas in `crew/schemas.py`
- How to modify schemas safely
- Testing validation
- Common validation errors

**Why needed:** No documentation exists on how agent outputs are validated. This is critical for preventing agent drift and maintaining output consistency.

---

#### 3. **crew/ITERATION_LOOP.md** — Iteration & Refinement
**Purpose:** Document iteration capability
**Content:**
- Current state: single pass per agent
- Planned: iteration on low confidence
- How iteration would work
- Example scenarios

**Why needed:** Mentioned in memory as "in progress," but not documented. Teams need to understand the planned flow.

---

#### 4. **API_REFERENCE.md** — API Endpoints
**Purpose:** Complete API reference
**Content:**
- Design voting API (POST /sessions, etc.)
- Design ops API (POST /design-ops/run, etc.)
- Research API (POST /observations, etc.)
- Auth/security
- Rate limiting

**Why needed:** Currently scattered across route files. Developers need a single reference for integration.

---

#### 5. **SUPABASE_SCHEMA.md** — Database Schema
**Purpose:** Document database structure
**Content:**
- voting_sessions, voting_options, voting_votes
- voting_reactions, design_comments
- research_observations, research_segments, research_segment_items
- research_insights
- RLS policies per table
- Realtime publications

**Why needed:** Schema is complex and undocumented. This is essential for backend maintenance.

---

#### 6. **COMPONENT_ARCHITECTURE.md** — Component Patterns
**Purpose:** Document component hierarchy & patterns
**Content:**
- SessionProvider (context)
- Custom hooks pattern (useAdmin, useVoterIdentity, etc.)
- Component hierarchy tree
- State management patterns
- Reusable patterns across design/voting/research modules

**Why needed:** Components are well-organized but patterns aren't documented for new contributors.

---

#### 7. **.planning/codebase/README.md** — Codebase Guide Index
**Purpose:** Index to all codebase documentation
**Content:**
- Quick links to ARCHITECTURE, CONVENTIONS, STACK, etc.
- "Use this when..." guidance for each doc

**Why needed:** The `.planning/codebase/` folder has 7 docs but no index. New contributors don't know where to start.

---

### ⚠️ Files That Need Updates

1. **README.md** — Replace generic Next.js content with Carrier-specific
2. **crew/README.md** → Extract & refactor into multiple files
3. **.planning/codebase/STRUCTURE.md** — Review against current state
4. **.planning/codebase/CONVENTIONS.md** — Review against current code
5. All docs — Update timestamps, status, and cross-references

---

## Proposed Documentation Structure

```
design-tools/
├── README.md                          # Project overview, quick start
├── API_REFERENCE.md                   # All API endpoints (NEW)
├── SUPABASE_SCHEMA.md                # Database schema (NEW)
├── COMPONENT_ARCHITECTURE.md          # Component patterns (NEW)
├── CREW_HANDOFF_SPEC.md              # Agent handoff contract (KEPT, cleaned)
├── docs/
│   ├── DESIGN_PRINCIPLES.md          # Design philosophy
│   ├── PRODUCT_REQUIREMENTS.md       # Renamed from carrier-prd.md
│   ├── TIER_SYNTHESIS_HANDOFF.md    # Renamed from HANDOFF.md
│   └── README.md                     # Docs index
├── crew/
│   ├── README.md                     # Quick start only
│   ├── SETUP.md                      # Installation & setup (NEW, from crew/README)
│   ├── AGENTS.md                     # Detailed agent reference (NEW)
│   ├── JSON_SCHEMA_VALIDATION.md    # Schema validation & drift (NEW)
│   ├── ITERATION_LOOP.md            # Iteration capability (NEW)
│   ├── PYTHON_VERSION.md            # Python 3.13 requirement (NEW)
│   ├── TROUBLESHOOTING.md           # Common issues & fixes (NEW)
│   └── requirements.txt
├── .planning/
│   └── codebase/
│       ├── README.md                 # Index to all codebase docs (NEW)
│       ├── ARCHITECTURE.md           # System design
│       ├── CONVENTIONS.md            # Code conventions
│       ├── STACK.md                  # Technology stack
│       ├── STRUCTURE.md              # Folder organization
│       ├── INTEGRATIONS.md           # External integrations
│       ├── TESTING.md                # Testing strategy
│       └── CONCERNS.md               # Known issues & tech debt
└── [OLD DOCS DELETED - see cleanup section]
```

---

## Next Steps

### Phase 1: Delete Obsolete Files
- [ ] Delete `.planning/PHASE-1-HANDOFF.md`
- [ ] Delete `.planning/01-security-foundation/`
- [ ] Delete `docs/brainstorms/`
- [ ] Delete `docs/plans/`
- [ ] Delete `docs/superpowers/`
- [ ] Delete `docs/PHASE_3_VERIFICATION.md`
- [ ] Delete `docs/SYNTHESIS_TIERS_IMPLEMENTATION.md`
- [ ] Delete `docs/RAPTIVE_COMMUNITY_CONTEXT.md`
- [ ] Delete `TIER_SYNTHESIS_COMPLETION.md`
- [ ] Delete `docs/carrier-crew-system.md` (merge content first)

### Phase 2: Consolidate & Refactor
- [ ] Rewrite README.md
- [ ] Refactor crew/README.md into SETUP.md + AGENTS.md + TROUBLESHOOTING.md
- [ ] Consolidate crew system docs
- [ ] Rename HANDOFF.md → docs/TIER_SYNTHESIS_HANDOFF.md
- [ ] Rename carrier-prd.md → docs/PRODUCT_REQUIREMENTS.md
- [ ] Move design-principles.md → docs/DESIGN_PRINCIPLES.md

### Phase 3: Create Missing Docs
- [ ] crew/JSON_SCHEMA_VALIDATION.md
- [ ] crew/ITERATION_LOOP.md
- [ ] crew/PYTHON_VERSION.md
- [ ] API_REFERENCE.md
- [ ] SUPABASE_SCHEMA.md
- [ ] COMPONENT_ARCHITECTURE.md
- [ ] .planning/codebase/README.md

### Phase 4: Add Cross-References
- [ ] Link from README to all docs
- [ ] Add "See also" sections to related docs
- [ ] Create docs/README.md as index
- [ ] Create crew/README.md as index

### Phase 5: Verify & Update
- [ ] Review .planning/codebase/ docs against current code
- [ ] Update all timestamps
- [ ] Verify no broken links
- [ ] Final spelling/grammar pass

---

## Key Missing Content

### 1. JSON Schema Validation
**Current gap:** How do agent outputs get validated? How do schemas prevent drift?
**Example:** `crew/schemas.py` has Pydantic models but no explanation of why they exist or how to maintain them.

### 2. Iteration Loop
**Current gap:** Mentioned as "in progress" but not documented.
**Need:** Design document explaining planned iteration capability and how it would work.

### 3. Agent Prompts
**Current gap:** Agents live in `crew/agents/` but their actual system prompts are not visible or documented.
**Need:** Either expose prompts in agents.md or add crew/AGENT_PROMPTS.md

### 4. Error Handling
**Current gap:** How does the system handle agent failures, validation errors, missing data?
**Need:** crew/ERROR_HANDLING.md explaining retry logic, fallbacks, user-facing errors.

### 5. Testing Strategy
**Current gap:** `.planning/codebase/TESTING.md` exists but is vague.
**Need:** Concrete test examples, coverage targets, test organization by module.

---

## Success Criteria

- [ ] No redundant documentation (single source of truth per topic)
- [ ] Every major component has dedicated documentation
- [ ] New contributor can understand system in 1-2 hours using docs
- [ ] No broken links between docs
- [ ] All dates and statuses current (as of 2026-03-19)
- [ ] Clear "index" docs (README.md, docs/README.md, .planning/codebase/README.md)
- [ ] JSON schema validation documented and maintainable
- [ ] Iteration loop clearly explained
- [ ] API reference complete and accurate

---

## Notes

- **Preserve context:** Keep CREW_HANDOFF_SPEC.md unchanged in content, just clean up formatting.
- **Backward compatibility:** If old links exist in code/comments, update them to point to new locations.
- **Status quo on PRD:** Keep `docs/PRODUCT_REQUIREMENTS.md` but clearly mark features that are planned vs. implemented.
- **GSD planning docs:** The `.planning/` directory contains historical GSD phases. These should be archived or moved to `.planning/archive/` to avoid confusion.

