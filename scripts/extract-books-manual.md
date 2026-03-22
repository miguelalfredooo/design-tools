# Manual Book Extraction Guide

This document describes the process for extracting design books and building the Transmitter index.

## Overview

The Transmitter system indexes design books to ground design prompts in theory. Since parsing PDFs and EPUBs is complex, we use a manual extraction process augmented by Claude.

## Process

For each book:

1. **Identify chapters**: Select 3-5 most relevant chapters for the design/PM context
2. **Extract text**: Open the book in a reader and copy key chapter text
3. **Summarize with Claude**: Use the prompt template below to get structured summaries
4. **Manual review**: Verify quotes are accurate (paraphrases acceptable)
5. **Save to index**: Store in `chapters.json` with metadata

## File Structure

Each book lives in `data/books/{book-shortname}/`:

```
data/books/
  discussing-design/
    metadata.json      # Book metadata (title, author, year, description)
    chapters.json      # Array of chapter objects with summaries and excerpts
  org-design-for-design-orgs/
    metadata.json
    chapters.json
  [other books...]
```

## Chapter Structure

Each chapter in `chapters.json` should include:

```json
{
  "id": "ch-1-unique-id",
  "title": "Chapter title",
  "summary": "1-2 sentence summary of main idea",
  "keyQuotes": [
    "Quote 1 (verbatim or close paraphrase)",
    "Quote 2",
    "Quote 3"
  ],
  "excerpt": "200-300 word representative passage or paraphrase",
  "keywords": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}
```

### Field Guidelines

- **id**: Unique identifier, format: `ch-{number}-{slug}` (e.g., `ch-1-critique-framework`)
- **title**: Exact chapter title or descriptive subtitle
- **summary**: Distill the chapter's core idea into 1-2 sentences
- **keyQuotes**: 3-5 verbatim quotes or close paraphrases that capture the chapter's essence
- **excerpt**: 200-300 word block that represents the chapter's key concepts. Can be a direct excerpt or a well-organized paraphrase combining multiple sections.
- **keywords**: 5-8 lowercase tags separated by spaces, related to design/PM topics (e.g., "critique", "feedback", "psychological safety")

## Claude Summarization Prompt Template

Use this prompt in Claude to generate structured chapter summaries:

```
I'm building a design tool that helps designers articulate decisions and gather feedback.
I'm extracting insights from design and PM books to ground prompts in theory.

Here's a chapter from [BOOK_TITLE]:

[PASTED CHAPTER TEXT]

Please provide:
1. A 1-2 sentence summary of the chapter's main idea
2. 3-5 key quotes (verbatim or close paraphrases)
3. A 200-300 word excerpt or paraphrase that captures the essence
4. 5-8 keyword tags (lowercase, comma-separated)

Format your response as a JSON object with keys: summary, keyQuotes (array), excerpt, keywords (array).
```

## Example: Discussing Design Chapters

See `/data/books/discussing-design/chapters.json` for a completed example with two chapters:

- **Chapter 1: Foundations of Critique** — How critique frameworks create psychological safety
- **Chapter 2: Feedback Delivery** — Observation-based feedback techniques

Both include full metadata, representative excerpts, key quotes, and keywords.

## Keyword Strategy

Keywords should relate to design/PM domains:

**Critique & Feedback**: critique, feedback, psychological safety, communication, constructive criticism, facilitation

**Design Process**: design process, iteration, prototyping, user-centered design, design thinking

**Research & Validation**: user research, validation, testing, research methods, assumptions

**Stakeholder Management**: stakeholder communication, alignment, persuasion, decision-making, objection handling

**Organization & Teams**: design teams, team structure, leadership, collaboration, conflict resolution

**Specific Techniques**: design rationale, decision-making, personas, journey mapping, systems thinking

Choose keywords that help search find this chapter when users ask about related topics.

## Quality Checklist

Before saving a chapter:

- [ ] Summary is 1-2 sentences
- [ ] 3-5 quotes provided (checked for accuracy)
- [ ] Excerpt is 200-300 words
- [ ] Keywords are 5-8 lowercase tags
- [ ] JSON is valid (can be parsed)
- [ ] Quotes actually reflect chapter content (paraphrases are OK)
- [ ] Excerpt represents key ideas clearly

## Search Integration

Once chapters are in `chapters.json`, they automatically become searchable via `lib/book-search.ts`.

The search function:
1. Extracts keywords from the search query (e.g., "feedback communication")
2. Finds matching chapters based on keyword overlap
3. Returns top 3 results with relevance scores

Example search query that would match the Discussing Design chapters:
```
"How do I deliver feedback without making the designer feel attacked?"
→ Keywords: ["how", "deliver", "feedback", "without", "making", "designer", "feel", "attacked"]
→ Matches: "feedback delivery" and "psychological safety" chapters
```

## Extraction Priority

**Phase 1 (Complete Now)**:
- Discussing Design (2 chapters done, expandable)
- Org Design for Design Orgs (stub)
- Designing Together (stub)

**Phase 2 (If Phase 1 validates)**:
- Deep extraction of remaining books
- Consider expanding to more chapters per book
- Evaluate if semantic search is needed

## Tools & Setup

You'll need:
- A PDF or EPUB reader (Apple Books, Kindle, Adobe Reader, etc.)
- Access to design books library (usually at `/Users/miguelarias/Documents/books/`)
- Claude for summarization
- Text editor or JSON editor for formatting

## Next Steps

1. Pick a book from the stub list
2. Select 2-3 relevant chapters
3. Copy chapter text and use Claude prompt
4. Format response into `chapters.json`
5. Commit with message: `feat: add [book-title] chapters to index`
6. Repeat for remaining books
