# Carrier Documentation Index

Welcome! This folder contains all reference documentation for Carrier. Use this index to find what you need.

---

## 🚀 Getting Started

**New to Carrier?** Start here:
1. [../README.md](../README.md) — Project overview, quick start, architecture
2. [DESIGN_PRINCIPLES.md](#design-principles) — How we think about design
3. [PRODUCT_REQUIREMENTS.md](#product-requirements) — What Carrier does (detailed spec)

---

## 📚 Core Documentation

### Design Handoff Specification
- **File:** `../CREW_HANDOFF_SPEC.md`
- **Purpose:** The contract between agents — what each agent must do, what outputs look like, gate checks
- **Read when:** Modifying agents, understanding agent coordination, debugging crew runs
- **Sections:** Agent specs, gate checks, lifecycle stages, synthesis tiers, execution flow

### Agent Details & Personas
- **File:** `../crew/AGENTS.md` *(coming in Phase 3)*
- **Purpose:** Deep dive into each agent's persona, grounding, and system prompt
- **Read when:** Want to understand agent thinking, updating agent prompts

### JSON Schema Validation
- **File:** `../crew/JSON_SCHEMA_VALIDATION.md`
- **Purpose:** How agent outputs are validated and what to do when validation fails
- **Read when:** Debugging validation errors, modifying agent output schema, preventing agent drift
- **Sections:** Why validation matters, schema reference, debugging guide, how to modify safely

### Iteration Loop
- **File:** `../crew/ITERATION_LOOP.md`
- **Purpose:** Multi-pass synthesis capability (infrastructure ready, UI not yet)
- **Read when:** Interested in refinement workflow, want to implement iteration feature
- **Sections:** Why iteration helps, what's implemented, what's missing, implementation roadmap

---

## 📋 System Documentation

### Crew API Setup
- **File:** `../crew/README.md`
- **Purpose:** Installation, running the crew server, basic troubleshooting
- **Read when:** Setting up dev environment, getting crew API running

### Crew Setup Details
- **File:** `../crew/SETUP.md` *(coming in Phase 3)*
- **Purpose:** Step-by-step installation guide with options
- **Read when:** Installing crew for the first time

### Crew Troubleshooting
- **File:** `../crew/TROUBLESHOOTING.md` *(coming in Phase 3)*
- **Purpose:** Common issues and fixes
- **Read when:** Crew API won't start, validation errors, Python version issues

### Python 3.13 Requirement
- **File:** `../crew/PYTHON_VERSION.md` *(coming in Phase 3)*
- **Purpose:** Why Python ≤3.13 is required, how to install
- **Read when:** Crew won't run, ModuleNotFoundError, Python version conflicts

---

## 🎨 Design & Product

### Design Principles
- **File:** `DESIGN_PRINCIPLES.md`
- **Purpose:** Philosophy guiding design work (10 principles from noticing to industry standards)
- **Read when:** Making design decisions, reviewing components, understanding quality facets
- **Sections:** Noticing, conceptual range/depth, live tuning, uncommon care, HIG/Material Design

### Product Requirements
- **File:** `PRODUCT_REQUIREMENTS.md`
- **Purpose:** Detailed product spec (aspirational — not all features implemented yet)
- **Read when:** Understanding product vision, evaluating feature requests, UX decisions
- **Sections:** Problem, users, goals, information architecture, quality facets, acceptance criteria

### Tier Synthesis UI Handoff
- **File:** `TIER_SYNTHESIS_HANDOFF.md`
- **Purpose:** Completion summary for tier-based synthesis UI (Quick/Balanced/In-Depth)
- **Read when:** Understanding synthesis card rendering, tier implementation details

---

## 🏗️ Architecture & Code

### Codebase Guide
- **File:** `../.planning/codebase/README.md` *(coming in Phase 3)*
- **Purpose:** Index to architecture documentation
- **Read when:** Exploring the codebase structure

### Architecture Overview
- **File:** `../.planning/codebase/ARCHITECTURE.md`
- **Purpose:** System design, component boundaries, data flow
- **Read when:** Understanding system structure, planning features

### Code Conventions
- **File:** `../.planning/codebase/CONVENTIONS.md`
- **Purpose:** Code style, naming, patterns
- **Read when:** Contributing code, reviewing PRs

### Technology Stack
- **File:** `../.planning/codebase/STACK.md`
- **Purpose:** Tech choices, versions, why each was selected
- **Read when:** Evaluating dependencies, planning upgrades

### Folder Structure
- **File:** `../.planning/codebase/STRUCTURE.md`
- **Purpose:** What lives where, folder organization
- **Read when:** Finding code, understanding project layout

### Integrations
- **File:** `../.planning/codebase/INTEGRATIONS.md`
- **Purpose:** External services, APIs, dependencies
- **Read when:** Working with Supabase, Figma, other integrations

### Testing Strategy
- **File:** `../.planning/codebase/TESTING.md`
- **Purpose:** Testing approach, how to run tests
- **Read when:** Writing tests, understanding test structure

### Technical Concerns
- **File:** `../.planning/codebase/CONCERNS.md`
- **Purpose:** Known issues, tech debt, architectural trade-offs
- **Read when:** Planning refactors, understanding constraints

---

## 📡 API Reference

### Complete API Reference
- **File:** `../API_REFERENCE.md` *(coming in Phase 3)*
- **Purpose:** All endpoints, request/response formats, authentication
- **Read when:** Integrating with crew, building new features

---

## 🗄️ Database

### Supabase Schema
- **File:** `../SUPABASE_SCHEMA.md` *(coming in Phase 3)*
- **Purpose:** Database tables, RLS policies, realtime subscriptions
- **Read when:** Working with data, understanding persistence

---

## ⚛️ Frontend

### Component Architecture
- **File:** `../COMPONENT_ARCHITECTURE.md` *(coming in Phase 3)*
- **Purpose:** React patterns, hooks, state management
- **Read when:** Building components, understanding data flow

---

## 🛠️ Maintenance

### Consolidation Plan
- **File:** `../DOCS_CONSOLIDATION_PLAN.md`
- **Purpose:** What docs to keep, consolidate, create, delete
- **Read when:** Contributing docs, understanding doc structure

### Consolidation Progress
- **File:** `../DOCS_CONSOLIDATION_PROGRESS.md`
- **Purpose:** Phase-by-phase progress on documentation work
- **Read when:** Tracking documentation improvements

---

## Quick Navigation by Task

**I want to...**

| Task | Start here |
|------|-----------|
| Understand what Carrier is | [../README.md](../README.md) |
| Set up dev environment | [../crew/README.md](../crew/README.md) |
| Modify an agent prompt | [../CREW_HANDOFF_SPEC.md](../CREW_HANDOFF_SPEC.md) → [../crew/JSON_SCHEMA_VALIDATION.md](../crew/JSON_SCHEMA_VALIDATION.md) |
| Debug a validation error | [../crew/JSON_SCHEMA_VALIDATION.md](../crew/JSON_SCHEMA_VALIDATION.md) |
| Build a new feature | [../README.md](../README.md) → [../COMPONENT_ARCHITECTURE.md](../COMPONENT_ARCHITECTURE.md) *(coming)* |
| Fix a bug in the crew | [../CREW_HANDOFF_SPEC.md](../CREW_HANDOFF_SPEC.md) → [../crew/JSON_SCHEMA_VALIDATION.md](../crew/JSON_SCHEMA_VALIDATION.md) |
| Understand product vision | [PRODUCT_REQUIREMENTS.md](#product-requirements) |
| Review design decisions | [DESIGN_PRINCIPLES.md](#design-principles) |
| Check database schema | [../SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md) *(coming)* |
| Find an API endpoint | [../API_REFERENCE.md](../API_REFERENCE.md) *(coming)* |
| Learn about iteration | [../crew/ITERATION_LOOP.md](../crew/ITERATION_LOOP.md) |

---

## Document Status

✅ = Complete and current
🚧 = In progress
📋 = Planned

| Document | Status |
|----------|--------|
| README.md | ✅ |
| CREW_HANDOFF_SPEC.md | ✅ |
| DESIGN_PRINCIPLES.md | ✅ |
| PRODUCT_REQUIREMENTS.md | ✅ |
| crew/README.md | ✅ |
| crew/JSON_SCHEMA_VALIDATION.md | ✅ |
| crew/ITERATION_LOOP.md | ✅ |
| TIER_SYNTHESIS_HANDOFF.md | ✅ |
| .planning/codebase/* | ✅ |
| crew/AGENTS.md | 📋 |
| crew/SETUP.md | 📋 |
| crew/TROUBLESHOOTING.md | 📋 |
| crew/PYTHON_VERSION.md | 📋 |
| API_REFERENCE.md | 📋 |
| SUPABASE_SCHEMA.md | 📋 |
| COMPONENT_ARCHITECTURE.md | 📋 |
| .planning/codebase/README.md | 📋 |

---

## Contributing

When adding new documentation:
1. Follow the naming convention: `DOCUMENT_NAME.md` (all caps)
2. Add a link to this index
3. Include sections with descriptive headers
4. Add code examples where helpful
5. Update the status table above

When updating existing documentation:
1. Update timestamps to current date
2. Note what changed in the file
3. Update cross-references if structure changed

---

**Last updated:** 2026-03-19

