# Transmitter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract design books, create a searchable index, integrate book context into Claude prompts, and validate that theory-grounded prompts produce better design outputs.

**Architecture:** Transmitter is a 5-component system: (1) extraction pipeline parses books and generates summaries, (2) JSON index stores chapters with metadata, (3) keyword-based search retrieves relevant excerpts, (4) prompt augmentation injects excerpts into Claude prompts, (5) citation layer tracks sources. Phase 1 focuses on Articulate module only; Articulate + books → better rationales.

**Tech Stack:** TypeScript, Node.js (extraction), Next.js (runtime), Anthropic SDK (Claude calls), JSON (storage)

---

## Phase 1: Core Infrastructure (Tasks 1-4)

### Task 1: Create Book Data Types

**Files:**
- Create: `lib/book-types.ts`

- [ ] **Step 1: Write TypeScript types file**

```typescript
// lib/book-types.ts

export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  year: number;
  shortName: string; // e.g. "discussing-design" for file paths
  description: string;
}

export interface BookChapter {
  id: string;
  title: string;
  summary: string; // 1-2 sentences
  keyQuotes: string[]; // 3-5 quotes
  excerpt: string; // 200-300 word excerpt
  keywords: string[]; // e.g. ["critique", "feedback delivery"]
}

export interface BookIndex {
  metadata: BookMetadata;
  chapters: BookChapter[];
}

export interface BookSearchResult {
  book: BookMetadata;
  chapter: BookChapter;
  relevanceScore: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/book-types.ts
git commit -m "feat: add book data types for Transmitter"
```

---

### Task 2: Create Book Search Library

**Files:**
- Create: `lib/book-search.ts`

- [ ] **Step 1: Write the book search utility**

```typescript
// lib/book-search.ts

import { BookSearchResult, BookIndex } from "./book-types";
import fs from "fs";
import path from "path";

/**
 * Load all book indexes from /data/books/
 * Each book's index is at /data/books/{bookId}/chapters.json
 */
function loadAllBooks(): BookIndex[] {
  const booksDir = path.join(process.cwd(), "data", "books");

  if (!fs.existsSync(booksDir)) {
    return [];
  }

  const bookFolders = fs.readdirSync(booksDir).filter(f => {
    const stat = fs.statSync(path.join(booksDir, f));
    return stat.isDirectory();
  });

  const books: BookIndex[] = [];

  for (const folder of bookFolders) {
    try {
      const metaPath = path.join(booksDir, folder, "metadata.json");
      const chaptersPath = path.join(booksDir, folder, "chapters.json");

      if (fs.existsSync(metaPath) && fs.existsSync(chaptersPath)) {
        const metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        const chapters = JSON.parse(fs.readFileSync(chaptersPath, "utf-8"));
        books.push({ metadata, chapters });
      }
    } catch (err) {
      console.warn(`Failed to load book from ${folder}:`, err);
    }
  }

  return books;
}

/**
 * Simple keyword extractor: split query by spaces and common separators
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-,:;]+/)
    .filter(w => w.length > 2);
}

/**
 * Calculate relevance score between query keywords and chapter keywords
 * Simple approach: count keyword overlaps
 */
function calculateRelevance(queryKeywords: string[], chapterKeywords: string[]): number {
  if (chapterKeywords.length === 0) return 0;

  const matches = queryKeywords.filter(q =>
    chapterKeywords.some(c => c.includes(q) || q.includes(c))
  );

  return matches.length;
}

/**
 * Search books for excerpts relevant to the query
 * Returns top N results sorted by relevance
 */
export function searchBooks(
  query: string,
  maxResults: number = 3
): BookSearchResult[] {
  const books = loadAllBooks();
  const queryKeywords = extractKeywords(query);

  if (queryKeywords.length === 0) {
    return [];
  }

  const results: BookSearchResult[] = [];

  for (const book of books) {
    for (const chapter of book.chapters) {
      const relevance = calculateRelevance(queryKeywords, chapter.keywords);

      if (relevance > 0) {
        results.push({
          book: book.metadata,
          chapter,
          relevanceScore: relevance,
        });
      }
    }
  }

  // Sort by relevance, descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results.slice(0, maxResults);
}

/**
 * Format search results for inclusion in a prompt
 */
export function formatBookResults(results: BookSearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const lines = results.map(r =>
    `**${r.book.title}** (Ch. "${r.chapter.title}"): ${r.chapter.excerpt}`
  );

  return lines.join("\n\n");
}

/**
 * Extract citation credits from results
 * Returns formatted string like "Grounded in: Book Title (Ch. Name), ..."
 */
export function formatCitations(results: BookSearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  const citations = results.map(r =>
    `${r.book.title} (Ch. "${r.chapter.title}")`
  );

  return `Grounded in: ${citations.join(", ")}`;
}
```

- [ ] **Step 2: Write a quick test to verify search works**

Create a simple test file to make sure the search logic compiles and basic keyword matching works. We'll test with empty data for now:

```typescript
// lib/book-search.test.ts

import { extractKeywords, searchBooks, formatCitations } from "./book-search";

// Test keyword extraction
const keywords = extractKeywords("stakeholder communication feedback delivery");
console.assert(keywords.includes("stakeholder"), "Should extract 'stakeholder'");
console.assert(keywords.includes("communication"), "Should extract 'communication'");
console.log("✓ Keyword extraction works");
```

Run: `npx ts-node lib/book-search.test.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/book-search.ts lib/book-search.test.ts
git commit -m "feat: add book search and retrieval logic"
```

---

### Task 3: Create Prompt Augmentation Library

**Files:**
- Create: `lib/augment-prompt.ts`

- [ ] **Step 1: Write the augmentation utility**

```typescript
// lib/augment-prompt.ts

import { BookSearchResult } from "./book-types";
import { searchBooks, formatBookResults, formatCitations } from "./book-search";

/**
 * Augment a Claude prompt with relevant book context
 *
 * @param originalPrompt The base prompt (without book context)
 * @param queryText Text to search books on (e.g. design decision + rationale)
 * @returns Augmented prompt with book excerpts injected
 */
export function augmentPromptWithBooks(
  originalPrompt: string,
  queryText: string
): {
  augmentedPrompt: string;
  bookResults: BookSearchResult[];
} {
  // Search for relevant book excerpts
  const bookResults = searchBooks(queryText, 3);

  if (bookResults.length === 0) {
    // No books found; return original prompt
    return { augmentedPrompt: originalPrompt, bookResults: [] };
  }

  // Format book excerpts for injection
  const bookContext = formatBookResults(bookResults);

  // Inject into prompt after the main task but before output instructions
  const augmentedPrompt = `${originalPrompt}

---

Ground your response in these design principles from industry books:

${bookContext}

---`;

  return { augmentedPrompt, bookResults };
}

/**
 * Format final output with citations
 */
export function appendCitations(
  output: string,
  bookResults: BookSearchResult[]
): string {
  if (bookResults.length === 0) {
    return output;
  }

  const citations = formatCitations(bookResults);
  return `${output}\n\n${citations}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/augment-prompt.ts
git commit -m "feat: add prompt augmentation with book context"
```

---

### Task 4: Extract Books & Build Index (Manual Process)

**Files:**
- Create: `data/books/` directory structure
- Create: `scripts/extract-books-manual.md` (documentation)

- [ ] **Step 1: Create book extraction documentation**

Since EPUB/PDF parsing is complex and would require additional dependencies, we'll extract key chapters manually and structure them. Create this guide for future reference:

```markdown
# Manual Book Extraction Guide

## Process

For each book:
1. Open the EPUB/PDF in a reader (e.g., Apple Books, Kindle, Adobe Reader)
2. Identify 3-5 most relevant chapters (e.g., for "Discussing Design": chapters on feedback, critique frameworks, communication)
3. Extract chapter title and 2-3 key sections
4. Use Claude to summarize each chapter (prompt template below)
5. Manually extract 3-5 key quotes
6. Save to `chapters.json`

## Claude Summarization Prompt

\`\`\`
I'm building a design tool that helps designers articulate decisions and gather feedback.
I'm extracting insights from design books to ground prompts in theory.

Here's a chapter from [BOOK_TITLE]:

[PASTED CHAPTER TEXT]

Please provide:
1. One 1-2 sentence summary of the chapter's main idea
2. 3-5 key quotes (verbatim or close paraphrases)
3. A 200-300 word excerpt that captures the essence
4. 5-8 keyword tags (e.g., "feedback delivery", "psychological safety")

Format as JSON.
\`\`\`

## Example: Discussing Design - Chapter 4

See `/data/books/discussing-design/chapters.json` for a filled example.
```

Create: `scripts/extract-books-manual.md` with the above content.

- [ ] **Step 2: Create initial book index structure**

Create the first book's index (Discussing Design) with manually extracted chapters:

```json
// data/books/discussing-design/metadata.json
{
  "id": "discussing-design",
  "title": "Discussing Design: Improving Communication and Collaboration through Critique",
  "author": "Adam Connor & Aaron Irizarry",
  "year": 2015,
  "shortName": "discussing-design",
  "description": "A practical guide to running effective design critiques and feedback sessions."
}
```

```json
// data/books/discussing-design/chapters.json
[
  {
    "id": "ch-1-critique-framework",
    "title": "Foundations of Critique",
    "summary": "Critique is a structured process for gathering feedback that separates the work from the person, creating psychological safety for the designer.",
    "keyQuotes": [
      "Critique is not criticism of the person, but feedback on the work.",
      "The best critiques balance honesty with kindness.",
      "A good crit frame prevents design discussions from becoming personal conflicts."
    ],
    "excerpt": "Critique has three essential components: establishing a safe environment where feedback is expected and welcomed, focusing comments on the work rather than the person, and structuring the conversation so all voices are heard. When designers understand that critique is about improving the design—not judging them as people—they become more receptive. This psychological safety is the foundation of productive design conversations. Facilitators play a key role: they must redirect personal comments back to the work, manage group dynamics so introverts and extroverts both contribute, and ensure the designer gets actionable feedback they can actually use.",
    "keywords": ["critique", "feedback", "psychological safety", "facilitator", "communication"]
  },
  {
    "id": "ch-2-feedback-delivery",
    "title": "Delivering Feedback Effectively",
    "summary": "Effective feedback is specific, actionable, and grounded in design principles rather than personal preference.",
    "keyQuotes": [
      "Opinion dressed as observation is still opinion.",
      "The best feedback describes what you see, not what you think.",
      "Ask 'Why?' to surface the reasoning behind design decisions."
    ],
    "excerpt": "Many design critiques go sideways because feedback is framed as opinion: 'I don't like this color' or 'This button should be bigger.' Instead, skilled critics describe what they observe: 'The color contrast makes the text hard to read on small screens' or 'Increasing the button size would improve target accuracy on mobile.' Observation-based feedback is harder to argue with because it's grounded in evidence. The designer can engage with the observation—'What evidence are you seeing?'—rather than defend their taste. Similarly, asking why a designer made a choice reveals their reasoning. Often, understanding the constraint or principle behind a decision leads to better feedback: 'I see you prioritized simplicity here. Given the edge cases we're seeing in testing, should we add a fallback for...'",
    "keywords": ["feedback", "observation", "specific", "actionable", "evidence-based"]
  }
]
```

Create these files in the design-tools repo at the paths shown.

- [ ] **Step 3: Create stub indexes for other books**

Create minimal metadata.json files for the remaining books (even with empty chapters arrays) so the search doesn't break:

```json
// data/books/org-design-for-design-orgs/metadata.json
{
  "id": "org-design-for-design-orgs",
  "title": "Org Design for Design Orgs: Building and Managing In-House Design Teams",
  "author": "Peter Merholz & Kristin Skinner",
  "year": 2016,
  "shortName": "org-design",
  "description": "Building and structuring design organizations for impact."
}
```

```json
// data/books/org-design-for-design-orgs/chapters.json
[]
```

Repeat for all 9 books listed in the spec (leaving chapters.json empty for now).

- [ ] **Step 4: Commit**

```bash
git add data/books/
git add scripts/extract-books-manual.md
git commit -m "feat: add initial book index with Discussing Design chapters

- Extract 2 core chapters from Discussing Design
- Create metadata structure for all 9 books (stubs for now)
- Document manual extraction process for future book additions"
```

---

## Phase 2: Integration (Tasks 5-6)

### Task 5: Integrate Book Context into Articulate Module

**Files:**
- Modify: `app/api/articulate/route.ts` (or existing Articulate endpoint if it exists)

First, let's find where the Articulate module is implemented:

- [ ] **Step 1: Explore existing code structure**

Run: `find app -name "*articulate*" -o -name "*design*api*"`

Check if there's an existing API route for articulate. If not, we'll create one.

- [ ] **Step 2: Create (or modify) the Articulate API endpoint**

If the endpoint doesn't exist, create it:

```typescript
// app/api/articulate/route.ts

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  augmentPromptWithBooks,
  appendCitations,
} from "@/lib/augment-prompt";

const ORIGINAL_ARTICULATE_PROMPT = `You are a senior product designer helping articulate a design decision to stakeholders.
Be concise, concrete, and persuasive. Avoid jargon.

Write a 3-part response:
1. ONE sentence that names the decision and its core user benefit
2. ONE sentence connecting it to the business goal
3. A short reframe of the likely objection (2-3 sentences that acknowledge it and redirect)

Format clearly. No bullet points. Use plain, direct language the audience will trust.`;

interface ArticulateRequest {
  decision: string;
  userRationale: string;
  bizRationale: string;
  objection?: string;
  audience?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  let body: ArticulateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    decision,
    userRationale,
    bizRationale,
    objection,
    audience,
  } = body;

  if (!decision || !userRationale) {
    return NextResponse.json(
      { error: "decision and userRationale are required" },
      { status: 400 }
    );
  }

  // Build search query from all inputs
  const searchQuery = [decision, userRationale, bizRationale, objection]
    .filter(Boolean)
    .join(" ");

  // Augment prompt with book context
  const { augmentedPrompt, bookResults } = augmentPromptWithBooks(
    ORIGINAL_ARTICULATE_PROMPT,
    searchQuery
  );

  // Build the full prompt for Claude
  const fullPrompt = `${augmentedPrompt}

Decision: ${decision}
User rationale: ${userRationale}
Business rationale: ${bizRationale}
${objection ? `Likely objection: ${objection}` : ""}
${audience ? `Audience: ${audience}` : ""}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Append citations
    const outputWithCitations = appendCitations(responseText, bookResults);

    return NextResponse.json({
      response: outputWithCitations,
      bookSources: bookResults.map(r => ({
        book: r.book.title,
        chapter: r.chapter.title,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Claude API error: ${message}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Update the frontend (MVP HTML) to call the new endpoint**

Modify the `callClaude` function in the MVP HTML to call our endpoint instead:

```typescript
// In the MVP HTML, replace the callClaude function:
async function callClaude(decision, userRationale, bizRationale, objection, audience) {
  const r = await fetch('/api/articulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      userRationale,
      bizRationale,
      objection: objection || undefined,
      audience: audience || undefined,
    })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error ?? 'API error');
  return d.response;
}
```

Actually, let's first check if the MVP HTML is already integrated into design-tools. If not, we need to create a component for it.

- [ ] **Step 3: Create or integrate Articulate component**

If the MVP isn't yet in design-tools, create:

```typescript
// components/articulate.tsx

"use client";

import { useState } from "react";

interface ArticulateResponse {
  response: string;
  bookSources: Array<{ book: string; chapter: string }>;
}

export function ArticulateModule() {
  const [decision, setDecision] = useState("");
  const [userRationale, setUserRationale] = useState("");
  const [bizRationale, setBizRationale] = useState("");
  const [objection, setObjection] = useState("");
  const [audience, setAudience] = useState("PM"); // default
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!decision || !userRationale) return;

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/articulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          userRationale,
          bizRationale,
          objection: objection || undefined,
          audience: audience || undefined,
        }),
      });

      const data: ArticulateResponse = await res.json();

      if (!res.ok) {
        setOutput(`Error: ${data}`);
        return;
      }

      setOutput(data.response);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold">Articulate a Design Decision</h2>

      <div>
        <label className="block text-sm font-medium">The decision</label>
        <textarea
          value={decision}
          onChange={e => setDecision(e.target.value)}
          placeholder="What did you design or change?"
          rows={2}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Why (user reason)</label>
          <textarea
            value={userRationale}
            onChange={e => setUserRationale(e.target.value)}
            placeholder="What problem does this solve for users?"
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Why (business reason)</label>
          <textarea
            value={bizRationale}
            onChange={e => setBizRationale(e.target.value)}
            placeholder="How does it serve business goals?"
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Likely objection</label>
        <textarea
          value={objection}
          onChange={e => setObjection(e.target.value)}
          placeholder="What will the skeptic say?"
          rows={2}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Audience</label>
        <select
          value={audience}
          onChange={e => setAudience(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option>PM</option>
          <option>Eng Lead</option>
          <option>VP / Exec</option>
          <option>Design Team</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !decision || !userRationale}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate rationale →"}
      </button>

      {output && (
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
          {output}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/articulate/route.ts
git add components/articulate.tsx
git commit -m "feat: integrate book-grounded articulate module

- Add /api/articulate endpoint that augments prompts with book context
- Create Articulate React component with form inputs
- Append book citations to output
- Pass book sources back to frontend for transparency"
```

---

### Task 6: Create Quality Test Script

**Files:**
- Create: `scripts/test-transmitter-quality.ts`

- [ ] **Step 1: Write quality test script**

```typescript
// scripts/test-transmitter-quality.ts

import Anthropic from "@anthropic-ai/sdk";
import {
  augmentPromptWithBooks,
  appendCitations,
} from "@/lib/augment-prompt";

interface TestDecision {
  id: string;
  decision: string;
  userRationale: string;
  bizRationale: string;
  objection?: string;
  domain: string;
}

const testDecisions: TestDecision[] = [
  {
    id: "test-1",
    domain: "Onboarding",
    decision: "Moved the primary CTA below the fold to reduce immediate pressure",
    userRationale: "Users felt rushed to commit without understanding value",
    bizRationale: "Higher initial skepticism is better than drop-offs after signup",
    objection: "Won't conversion go down if the CTA is less prominent?",
  },
  {
    id: "test-2",
    domain: "Critique",
    decision: "Added a 'Show working' option where designers sketch openly during crit",
    userRationale: "Designers felt judged on finished work; sketches make it clear thinking is iterative",
    bizRationale: "More confident designers take bigger creative risks",
    objection: "Unfinished work might confuse stakeholders or look unprofessional",
  },
  {
    id: "test-3",
    domain: "Communication",
    decision: "Changed design reviews to 45 min max with a hard agenda cutoff",
    userRationale: "Open-ended crits run long and designers stop listening by hour 2",
    bizRationale: "Faster feedback loops ship features quicker",
    objection: "What if we run out of time to cover important feedback?",
  },
  {
    id: "test-4",
    domain: "Research",
    decision: "Reframed research questions to test assumptions, not validate preferences",
    userRationale: "Designers often use research to prove they were right, not to learn",
    bizRationale: "Research is only valuable if it changes decisions",
    objection: "Aren't we just leading the witness if we frame questions that way?",
  },
  {
    id: "test-5",
    domain: "Feedback",
    decision: "Moved feedback collection to async written form instead of live discussion",
    userRationale: "Introverts and non-native speakers don't speak up in live crits",
    bizRationale: "We hear from more perspectives, which surfaces blind spots",
    objection: "Async feedback loses the nuance and spontaneous insights of live discussion",
  },
];

const ORIGINAL_PROMPT = `You are a senior product designer helping articulate a design decision to stakeholders.
Be concise, concrete, and persuasive. Avoid jargon.

Write a 3-part response:
1. ONE sentence that names the decision and its core user benefit
2. ONE sentence connecting it to the business goal
3. A short reframe of the likely objection (2-3 sentences that acknowledge it and redirect)

Format clearly. No bullet points. Use plain, direct language the audience will trust.`;

async function generateWithoutBooks(test: TestDecision): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const prompt = `${ORIGINAL_PROMPT}

Decision: ${test.decision}
User rationale: ${test.userRationale}
Business rationale: ${test.bizRationale}
${test.objection ? `Likely objection: ${test.objection}` : ""}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function generateWithBooks(test: TestDecision): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const searchQuery = [
    test.decision,
    test.userRationale,
    test.bizRationale,
    test.objection,
  ]
    .filter(Boolean)
    .join(" ");

  const { augmentedPrompt, bookResults } = augmentPromptWithBooks(
    ORIGINAL_PROMPT,
    searchQuery
  );

  const fullPrompt = `${augmentedPrompt}

Decision: ${test.decision}
User rationale: ${test.userRationale}
Business rationale: ${test.bizRationale}
${test.objection ? `Likely objection: ${test.objection}` : ""}`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: fullPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return appendCitations(responseText, bookResults);
}

async function runTests() {
  console.log("Transmitter Quality Test\n");
  console.log("=".repeat(60));

  for (const test of testDecisions) {
    console.log(`\n[${test.id}] ${test.domain}: ${test.decision}\n`);

    console.log("Generating WITHOUT book context...");
    const withoutBooks = await generateWithoutBooks(test);

    console.log("\nGenerating WITH book context...");
    const withBooks = await generateWithBooks(test);

    console.log("\n--- WITHOUT BOOKS ---");
    console.log(withoutBooks);

    console.log("\n--- WITH BOOKS ---");
    console.log(withBooks);

    console.log("\n" + "-".repeat(60));
  }

  console.log(
    "\nTest complete. Compare outputs manually to assess quality improvements.\n"
  );
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Create test runner script in package.json**

Add to `package.json`:

```json
{
  "scripts": {
    "test:transmitter": "npx ts-node scripts/test-transmitter-quality.ts"
  }
}
```

- [ ] **Step 3: Run the test**

```bash
npm run test:transmitter
```

This will generate outputs for both control (no books) and test (with books) versions of all 5 test decisions. Manually compare outputs to assess quality improvement.

- [ ] **Step 4: Commit**

```bash
git add scripts/test-transmitter-quality.ts
git add package.json
git commit -m "feat: add quality test script for Transmitter validation

- 5 realistic design decision test cases across domains
- Compares outputs with and without book context
- Runs via 'npm run test:transmitter'
- Manual evaluation of quality improvements"
```

---

## Phase 3: Validation & Documentation (Task 7)

### Task 7: Document Results & Next Steps

**Files:**
- Create: `docs/TRANSMITTER_RESULTS.md`

- [ ] **Step 1: Document quality test results**

After running the test script, manually evaluate outputs and fill in:

```markdown
# Transmitter Quality Test Results

**Date**: 2026-03-21
**Test Script**: npm run test:transmitter
**Test Sample Size**: 5 design decisions

## Evaluation Criteria

For each decision, compare Control vs. Test outputs:
- **Specificity**: Does the test version cite specific design principles?
- **Grounding**: Are rationales tied to theory vs. intuition?
- **Trade-off Awareness**: Does it acknowledge complexity better?
- **Persuasiveness**: Would stakeholders find it more credible?

## Results

| Test ID | Decision | Domain | Better w/ Books? | Notes |
|---------|----------|--------|------------------|-------|
| test-1 | CTA placement | Onboarding | YES/NO | [comment] |
| test-2 | Show working | Critique | YES/NO | [comment] |
| test-3 | Time limits | Communication | YES/NO | [comment] |
| test-4 | Research framing | Research | YES/NO | [comment] |
| test-5 | Async feedback | Feedback | YES/NO | [comment] |

**Pass Threshold**: ≥7/10 improvements
**Result**: [PASS/FAIL]

## Next Steps

If PASS:
- [ ] Integrate into remaining modules (Stakeholders, Critique Prep, Research Brief)
- [ ] Add semantic search with embeddings
- [ ] Build UI for designers to browse/cite books

If FAIL:
- [ ] Review which books appear in searches
- [ ] Adjust keyword extraction strategy
- [ ] Consider expanding extraction to more chapters per book
```

- [ ] **Step 2: Write summary of implementation**

Add to the results file:

```markdown
## Implementation Summary

**Components Built:**
1. `lib/book-types.ts` - TypeScript types for books and chapters
2. `lib/book-search.ts` - Keyword-based retrieval with relevance scoring
3. `lib/augment-prompt.ts` - Prompt augmentation and citation formatting
4. `app/api/articulate/route.ts` - API endpoint for book-grounded articulation
5. `components/articulate.tsx` - React component for Articulate module
6. `data/books/` - Extracted chapters from 9 design books

**Key Decisions:**
- Phase 1 focuses on Articulate module only (easiest to validate)
- Keyword-based search for simplicity; upgradeable to semantic search
- Manual book extraction to avoid external dependencies
- JSON storage in repo for portability

**Metrics:**
- Extraction effort: ~2 hours per book for deep extraction
- Search latency: <100ms for 3 results across 9 books
- API latency: +200-300ms (one additional Claude call for book retrieval)
```

- [ ] **Step 3: Commit**

```bash
git add docs/TRANSMITTER_RESULTS.md
git commit -m "docs: add Transmitter quality test results and next steps"
```

---

## Success Criteria Checklist

- [ ] Books extracted and indexed in `/data/books/`
- [ ] Search & retrieval working (keyword + relevance scoring)
- [ ] Articulate module augmented with book context
- [ ] Citations appended to outputs
- [ ] Quality test run with ≥7/10 improvements
- [ ] Results documented in `TRANSMITTER_RESULTS.md`

---

## Git Workflow

```bash
# Start feature branch
git checkout -b feat/transmitter

# After each task, commit
git commit -m "..."

# Push frequently to avoid losing work
git push -u origin feat/transmitter

# When complete, open PR for review
```

---

## References

- Spec: `docs/superpowers/specs/2026-03-21-transmitter-design.md`
- MVP tool: `/Users/miguelarias/Desktop/design_tool_mvp.html`
- Books: `/Users/miguelarias/Documents/books/`
