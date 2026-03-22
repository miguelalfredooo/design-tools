// lib/book-search.ts

import { BookSearchResult, BookIndex } from "./book-types";
import * as fs from "fs";
import * as path from "path";

/**
 * Load all book indexes from /data/books/
 * Each book's index is at /data/books/{bookId}/chapters.json
 */
export function loadAllBooks(): BookIndex[] {
  const booksDir = path.join(process.cwd(), "data", "books");

  if (!fs.existsSync(booksDir)) {
    return [];
  }

  const bookFolders = fs
    .readdirSync(booksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  const books: BookIndex[] = [];

  for (const folder of bookFolders) {
    const metaPath = path.join(booksDir, folder, "metadata.json");
    const chaptersPath = path.join(booksDir, folder, "chapters.json");

    if (!fs.existsSync(metaPath) || !fs.existsSync(chaptersPath)) {
      continue;
    }

    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch (err) {
      console.warn(`Failed to parse metadata.json from ${folder}:`, err);
      continue;
    }

    let chapters;
    try {
      chapters = JSON.parse(fs.readFileSync(chaptersPath, "utf-8"));
    } catch (err) {
      console.warn(`Failed to parse chapters.json from ${folder}:`, err);
      continue;
    }

    books.push({ metadata, chapters });
  }

  return books;
}

/**
 * Simple keyword extractor: split query by spaces and common separators
 */
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-,:;]+/)
    .filter(w => w.length > 2);
}

/**
 * Calculate relevance score between query keywords and chapter keywords
 * Uses word-boundary matching to avoid false positives (e.g., "stat" matching "statements")
 */
export function calculateRelevance(queryKeywords: string[], chapterKeywords: string[]): number {
  if (chapterKeywords.length === 0) return 0;

  const matches = queryKeywords.filter(q => {
    // Check if query keyword matches any chapter keyword exactly or as a complete word
    return chapterKeywords.some(c => {
      // Exact match is strongest
      if (c === q) return true;

      // Check if q is a whole word within c (word-boundary matching)
      // Split by non-alphanumeric to find word boundaries
      const cWords = c.split(/[^a-z0-9]+/);
      const qWords = q.split(/[^a-z0-9]+/);

      // All words from q must exist in c
      return qWords.every(qWord => qWord && cWords.includes(qWord));
    });
  });

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
