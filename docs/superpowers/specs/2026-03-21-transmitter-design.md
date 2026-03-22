# Transmitter: Book-Grounded Design Tool Enhancement

**Date**: 2026-03-21
**Status**: Design approved, ready for planning
**Scope**: Exploratory MVP validation

---

## Overview

Transmitter is a book extraction and indexing pipeline that grounds the design-tools MVP in design theory. It ingests design/PM books from the user's library, creates a lightweight searchable index, and injects relevant excerpts into Claude prompts to improve design rationales, research briefs, and stakeholder communication.

**Hypothesis**: Augmenting Claude prompts with curated book excerpts produces higher-quality, more theory-grounded design outputs.

**Success metric**: 7 out of 10 Articulate module outputs are noticeably better when book context is included (more specific, less generic, better grounded in design principles).

---

## Architecture

### Data Flow

```
Books (.epub, .pdf)
    ↓
Extract & Summarize (local script + Claude)
    ↓
Index (JSON files in /data/books/)
    ↓
Query at Runtime (keyword + string similarity)
    ↓
Augment Claude Prompt
    ↓
Generate Output + Citation
```

### Components

**1. Extraction Pipeline** (`scripts/extract-books.ts`)
- Parse EPUB/PDF files from `/Users/miguelarias/Documents/books/`
- For each book: extract chapters, summarize key sections with Claude
- Output: structured chapter data (title, summary, key quotes, representative excerpt)

**2. Index Storage** (`/data/books/`)
```
/data/books/
  discussing-design/
    metadata.json      # {title, author, year, cover_image_prompt}
    chapters.json      # [{id, title, summary, key_quotes: [], excerpt, keywords: []}]
  org-design-for-design-orgs/
    metadata.json
    chapters.json
  [remaining books...]
```

**3. Search & Retrieval** (`lib/book-search.ts`)
- Accept a query string (design decision + rationale)
- Extract keywords from query
- Search chapter index for matches (keyword overlap + string similarity)
- Return top 2-3 most relevant excerpts with source citations

**4. Prompt Augmentation** (`lib/augment-prompt.ts`)
- Take the original Claude prompt (from Articulate module)
- Fetch relevant book excerpts via search
- Insert excerpts into prompt with context label: "Ground your response in these design principles:"
- Return augmented prompt

**5. Citation Layer**
- Track which books/chapters were used in retrieval
- Append to Claude output: "Grounded in: [Book Title] (Ch. X), [Book Title] (Ch. Y)"

---

## Book Extraction Strategy

### Priority Weighting

**Deep Extraction** (full chapters + comprehensive summaries):
- *Discussing Design: Improving Communication and Collaboration through Critique*
- *Org Design for Design Orgs: Building and Managing In-House Design Teams*
- *Designing Together: The collaboration and conflict management handbook for creative professionals*

**Light Extraction** (key chapters + brief summaries):
- *Mapping Experiences: A Complete Guide to Customer Alignment Through Journeys, Blueprints, and Diagrams*
- *UX Writing for Beginners: The Complete Guide to UX Writing*
- *Just Enough Research: 2024 Edition*
- *Lean Analytics: Use Data to Build a Better Startup Faster*
- *Storytelling with Data: A Data Visualization Guide for Business Professionals*
- *Interviewing Users: How to Uncover Compelling Insights*
- *Mental Models: [core concepts]*
- *My Product Management Toolkit: Tools and Techniques to Become an Outstanding Product Manager*
- *Closing the Loop: Systems Thinking for Designers*

### Extraction Process

For each book:
1. Parse structure (chapters, sections)
2. Use Claude to generate 1-2 sentence summary per chapter
3. Extract 3-5 key quotes per chapter
4. Select 200-300 word representative excerpt (or paraphrase if dense)
5. Generate keyword tags (e.g., "stakeholder communication", "feedback delivery", "design process")
6. Save to `chapters.json` with metadata

---

## Integration: Articulate Module First

The Articulate module is the entry point for validation because it directly benefits from design theory grounding.

### Modified Flow

**Current**: User inputs decision → Claude generates rationale → Output

**New**: User inputs decision → Search books → Augment prompt → Claude generates rationale → Output + Citation

### Implementation

1. Modify `lib/articulate.ts` (or equivalent):
   ```typescript
   async function articulate(inputs) {
     // 1. Extract keywords from inputs.decision + inputs.userRationale + inputs.bizRationale
     const keywords = extractKeywords(inputs);

     // 2. Search book index
     const bookExcerpts = await searchBooks(keywords);

     // 3. Build augmented prompt
     const augmentedPrompt = buildAugmentedPrompt(
       originalPrompt,
       bookExcerpts
     );

     // 4. Call Claude with augmented prompt
     const response = await callClaude(augmentedPrompt);

     // 5. Append citations
     const citations = buildCitations(bookExcerpts);
     return response + "\n\n" + citations;
   }
   ```

2. For exploration phase: hardcode keyword extraction and string matching. No fancy NLP.

---

## Quality Test Plan

### Test Setup

1. Prepare 8-10 realistic design decisions (varied domains: onboarding, critique, communication, research)
2. Run Articulate module twice for each decision:
   - **Control**: Without book context
   - **Test**: With book context
3. Compare outputs side-by-side

### Evaluation Criteria

For each pair, assess:
- **Specificity**: Does the test output cite specific design principles (not generic advice)?
- **Grounding**: Are rationales tied to theory or established practices (vs. intuition)?
- **Trade-off awareness**: Does it acknowledge complexity and alternatives better?
- **Persuasiveness**: Would a stakeholder find the test output more credible?

### Success Metrics

- **Pass**: ≥7/10 decisions show meaningful improvement with book context
- **Fail**: <7/10 show improvement → re-evaluate approach or book selection

---

## Scope & Constraints

### In Scope (Phase 1)
- Extract core 3 books (deep) + remaining books (light)
- Build extraction pipeline + JSON index
- Implement keyword-based search
- Integrate into Articulate module only
- Run quality test
- Track which books/chapters appear in successful outputs

### Out of Scope (Phase 2+)
- Semantic search with embeddings (upgrade if Phase 1 succeeds)
- Integration into other modules (Stakeholders, Critique Prep, Research Brief)
- UI for designers to browse/search books directly
- Database storage (Supabase) — repo-based JSON for now

### Technical Constraints
- No external dependencies for search (keyword-based only)
- No API calls beyond Claude
- All extraction/indexing happens locally or via Claude API

---

## Success Criteria

**Phase 1 Complete When:**
1. Books extracted and indexed in `/data/books/`
2. Search + retrieval working reliably
3. Articulate module augmented with book context
4. Quality test shows ≥7/10 improvement
5. Citations rendering correctly in output

**Next Step**: If Phase 1 succeeds, use writing-plans skill to plan Phase 2 (other modules, semantic search, UI).

---

## Open Questions for Implementation Planning

1. **Extraction tooling**: Use `epub-js` for parsing? Or extract manually and feed raw text to Claude?
2. **Keyword extraction**: Simple regex patterns vs. Claude-based extraction? Trade-off: speed vs. accuracy.
3. **Storage location**: Keep JSON in `/data/books/` or `/lib/data/books/`? Depends on build process.
4. **Search performance**: At what book count does keyword search become slow? (Probably fine up to 50+ books.)
5. **Test dataset**: Should we use real design decisions from Carrier sessions, or synthetic examples?

---

## References

- MVP tool: `/Users/miguelarias/Desktop/design_tool_mvp.html`
- Books library: `/Users/miguelarias/Documents/books/`
- Design-tools project: `/Users/miguelarias/Code/design-tools/`
