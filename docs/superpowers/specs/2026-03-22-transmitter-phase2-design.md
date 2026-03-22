# Transmitter Phase 2: UI-First Design with Citation Side Panel

**Date:** 2026-03-22
**Phase:** 2 of 3
**Status:** Design approved, ready for implementation planning
**Objective:** Add polished side panel UI to show book citations, foundation for Phase 3 semantic search

---

## Executive Summary

Phase 2 enhances the Articulate module (from Phase 1) with a side panel that displays which books grounded the design response. The approach is UI-first and client-focused:

- **Keep response generation simple** (no backend changes to `/api/articulate`)
- **Add new `/api/articulate/books` endpoint** to fetch book metadata on-demand
- **Build CitationPanel component** (React) for clean, minimal side-by-side display
- **Position for Phase 3** (semantic search endpoint implementation won't require UI changes)

This design prioritizes shipping fast, proving the UX works, then scaling to other modules in Phase 3.

---

## Architecture & Data Flow

### Request/Response Flow

```
┌─────────────────────────────────────────────────────┐
│ User submits design decision + inputs               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ POST /api/articulate   │
         │ (unchanged from Phase1)│
         └────────┬───────────────┘
                  │
         ┌────────▼──────────────────────────┐
         │ Response + bookResults array      │
         │ [                                 │
         │   { id: "discussing-design", ... │
         │   { id: "atomic-design", ...     │
         │ ]                                │
         └────────┬──────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
Render response text  Fetch book details
(fast, immediate)     (parallel, async)
      │                       │
      │        ┌──────────────▼──────────────┐
      │        │ GET /api/articulate/books   │
      │        │ ?ids=discussing-design,...  │
      │        └──────────────┬──────────────┘
      │                       │
      │        ┌──────────────▼──────────────┐
      │        │ Book metadata + chapters    │
      │        │ [                          │
      │        │   {                        │
      │        │     id, title, chapters    │
      │        │   }                        │
      │        │ ]                          │
      │        └──────────────┬──────────────┘
      │                       │
      └───────────┬───────────┘
                  │
                  ▼
        ┌──────────────────┐
        │ CitationPanel    │
        │ renders books    │
        └──────────────────┘
```

**Key principles:**
- Response rendering is not blocked by book fetching
- Side panel loads in parallel with response display
- If book endpoint fails, response still renders (graceful degradation)
- Book data is static (JSON files in repo), not computed per request

---

## Components & Implementation

### Component: CitationPanel.tsx

**Purpose:** Display books and chapters that grounded the response

**Props:**
```typescript
interface CitationPanelProps {
  bookResults: Array<{ id: string; chapterId: string }>;  // from /api/articulate
  onError?: (error: Error) => void;
}
```

**Structure:**
```
CitationPanel
├── useEffect: fetch /api/articulate/books with book IDs
├── Loading: SkeletonLoader (3 book placeholders)
├── Error: Alert "Unable to load citations"
└── BookList
    └── BookItem[] (one per book, max 3)
        ├── Book title + icon
        ├── ChapterList
        │   └── ChapterItem[] (max 2 per book)
        │       ├── Chapter title
        │       ├── Excerpt (truncated ~150 chars)
        │       └── [Read more] button
        └── ChapterModal (opens on [Read more])
            ├── Full excerpt
            ├── Chapter metadata
            └── [Close]
```

**Styling (clean & minimal):**
- Typography: Use Carrier design tokens (font family, sizes)
- Color: Neutral grays (#666, #999) for text, single accent for titles
- Spacing: 16px padding, 12px gaps between items
- Borders: Subtle dividers between books (1px, #e5e5e5)
- No background color (transparent, inherits parent)
- Mobile: full-width, stacked layout

**States:**
- Loading: skeleton while fetching
- Loaded: display books + chapters
- Error: show fallback message
- Empty: if no books found, show: "No relevant design theory"

---

### Component: Update ArticulateModule.tsx

**Current layout (Phase 1):**
- Form on left, response on right

**New layout (Phase 2):**
- Desktop: `grid grid-cols-[1fr 300px]`
  - Left: Form + response
  - Right: CitationPanel (fixed 300px)
- Mobile: `flex flex-col`
  - Form
  - Response
  - CitationPanel (full width, below response)

**Flow:**
1. Form submission → POST /api/articulate
2. Response renders immediately
3. In parallel: fetch /api/articulate/books with book IDs
4. CitationPanel renders when data arrives
5. If books endpoint fails: show error in panel, don't block response

**No layout shift:** CitationPanel height is flexible, desktop width is fixed

---

### Endpoint: GET /api/articulate/books

**Purpose:** Fetch metadata for books used in a response

**Query Parameters:**
```typescript
interface BooksQuery {
  ids?: string;  // comma-separated book IDs (e.g., "discussing-design,atomic-design")
}
```

**Response:**
```typescript
interface BooksResponse {
  books: Array<{
    id: string;
    title: string;
    chapters: Array<{
      id: string;
      title: string;
      excerpt: string;           // ~150 char preview
      fullExcerpt: string;       // full text for modal
      relevanceScore?: number;   // for future Phase 3 ranking
    }>;
  }>;
}
```

**Logic:**
- If no `ids` provided, return empty array
- If ID doesn't exist, skip it silently (don't error)
- Return only chapters that match the request
- Sort by relevance (highest first, max 3 books, max 2 chapters per book)
- Cache: Books data is static JSON, can be cached indefinitely

**Error handling:**
- 200 OK: even if some IDs missing (return what exists)
- 500: if data file corrupt (rare)
- Client catches errors, shows "Unable to load citations" in panel

---

## Data Model

### Book Metadata Structure

**Location:** `lib/book-types.ts` (extend existing)

```typescript
export interface Book {
  id: string;                    // unique slug: "discussing-design"
  title: string;                 // "Discussing Design"
  chapters: Chapter[];
}

export interface Chapter {
  id: string;                    // "delivering-feedback"
  title: string;                 // "Delivering Feedback Effectively"
  keywords: string[];            // for Phase 1 keyword search
  excerpt: string;               // ~150 chars, used in panel preview
  fullExcerpt: string;           // full text, shown in modal
  relevanceScore?: number;       // for Phase 3 semantic ranking
}
```

**Storage:** JSON files in `/data/books/` (unchanged from Phase 1)
- One file per book
- Schema matches structure above
- Already extracted in Phase 1, no changes needed

---

## API Changes Summary

### POST /api/articulate (existing, Phase 1)

**No changes to request/response signature.**

Current response already includes `bookResults` array:
```typescript
return NextResponse.json({
  response: outputWithCitations,
  bookSources: bookResults.map(r => ({
    book: r.book.title,
    chapter: r.chapter.title,
  })),
});
```

Phase 2 uses `bookSources` array to populate CitationPanel (fetch full details via new endpoint).

### GET /api/articulate/books (new, Phase 2)

**New endpoint** to fetch book metadata.

**Implementation:**
```typescript
// app/api/articulate/books/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',') || [];

  if (!ids.length) {
    return NextResponse.json({ books: [] });
  }

  const books = ids
    .map(id => loadBookData(id))
    .filter(Boolean);

  return NextResponse.json({ books });
}
```

---

## Layout & Responsive Design

### Desktop (≥1024px)

```
┌─────────────────────────────────────────┐
│ Transmitter: Book-Grounded Design       │
├──────────────────────┬──────────────────┤
│                      │                  │
│  Form                │ CitationPanel    │
│  ┌─────────────────┐ │ ┌──────────────┐ │
│  │ Decision        │ │ │ Grounded in: │ │
│  │ User rationale  │ │ │              │ │
│  │ Biz rationale   │ │ │ 📖 Book 1    │ │
│  │ [Generate]      │ │ │  Ch. X       │ │
│  └─────────────────┘ │ │  [excerpt]   │ │
│                      │ │              │ │
│  Response            │ │ 📖 Book 2    │ │
│  ┌─────────────────┐ │ │  Ch. Y       │ │
│  │ **Decision**    │ │ │  [excerpt]   │ │
│  │ This improves   │ │ │              │ │
│  │ ... Grounded    │ │ │ Filter: [🔍] │ │
│  │ in: Discussing  │ │ └──────────────┘ │
│  │ Design (Ch. X)  │ │                  │
│  └─────────────────┘ │                  │
│                      │                  │
└──────────────────────┴──────────────────┘
```

- Form + response: left column (fluid)
- CitationPanel: right column (fixed 300px)
- Scrollable independently

### Mobile (<1024px)

```
┌──────────────────────────────┐
│ Transmitter                  │
├──────────────────────────────┤
│                              │
│  Form                        │
│  ┌────────────────────────┐  │
│  │ Decision               │  │
│  │ [Generate]             │  │
│  └────────────────────────┘  │
│                              │
│  Response                    │
│  ┌────────────────────────┐  │
│  │ **Decision**           │  │
│  │ This improves...       │  │
│  │ Grounded in:           │  │
│  │ - Discussing Design    │  │
│  └────────────────────────┘  │
│                              │
│  Citations                   │
│  ┌────────────────────────┐  │
│  │ Grounded in:           │  │
│  │                        │  │
│  │ 📖 Discussing Design   │  │
│  │    Ch. X [excerpt]     │  │
│  │                        │  │
│  │ 📖 Atomic Design       │  │
│  │    Ch. Y [excerpt]     │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

- Full width stacking
- CitationPanel below response

---

## Error Handling & Edge Cases

### Scenario: Book endpoint returns 500

**Behavior:**
- Response already rendered (success)
- CitationPanel shows: "Unable to load citations"
- No blocking, no impact to user

### Scenario: User submits before books load

**Behavior:**
- Form submission still works
- Previous CitationPanel clears (loading state)
- New panel populates when ready

### Scenario: Book ID in response doesn't exist

**Behavior:**
- Endpoint skips missing IDs silently
- Returns only books that exist
- Panel shows what's available

### Scenario: No books found for decision

**Behavior:**
- CitationPanel shows: "No relevant design theory found"
- Response still renders fully
- User sees decision + articulation without citations

### Scenario: User is on slow connection

**Behavior:**
- Response appears in <100ms (server cached)
- CitationPanel waits for book data (may take 1-2s)
- Loading skeleton shows, no disruption

---

## Success Criteria

### Functional
- ✅ CitationPanel renders books from response bookResults
- ✅ GET /api/articulate/books endpoint works
- ✅ Clicking excerpt expands to full text in modal
- ✅ Mobile layout stacks correctly
- ✅ No blocking: response renders before panel loads
- ✅ Error handling: panel fails gracefully

### Visual & UX
- ✅ Clean, minimal aesthetic (typography hierarchy clear)
- ✅ Consistent with Articulate module style
- ✅ Readable on mobile (not cramped)
- ✅ No visual glitches on layout shift
- ✅ Loading state obvious (skeleton or spinner)

### Performance
- ✅ Panel loads in <500ms (local JSON)
- ✅ No layout shift when panel renders
- ✅ Mobile: panel doesn't slow response rendering
- ✅ Zero impact to POST /api/articulate endpoint

---

## Phase 3 Readiness

This design positions Phase 3 (semantic search) with minimal friction:

- **Replace keyword search:** Swap `/lib/book-search.ts` logic without touching UI
- **Add ranking:** CitationPanel already supports `relevanceScore` field (just not used yet)
- **Expand to modules:** CitationPanel component is reusable in other modules
- **Book browser:** Side panel can grow into full book browser without breaking Articulate

No UI refactor needed for Phase 3. Just upgrade the search logic.

---

## Summary

**Phase 2 delivers:**
1. Polished side panel UI showing book citations (clean, minimal)
2. New GET endpoint for fetching book metadata
3. Foundation for Phase 3 semantic search (no UI changes needed)
4. Proof that book grounding improves design credibility

**Scope:** Articulate module only (Phase 3 will expand to other modules)

**Timeline:** ~2 weeks (component + endpoint + testing)

**Next:** Implementation plan in writing-plans output
