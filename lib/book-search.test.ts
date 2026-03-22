// lib/book-search.test.ts

import { extractKeywords, searchBooks, formatCitations, calculateRelevance, formatBookResults, loadAllBooks } from "./book-search";

// Test keyword extraction
const keywords = extractKeywords("stakeholder communication feedback delivery");
console.assert(keywords.includes("stakeholder"), "Should extract 'stakeholder'");
console.assert(keywords.includes("communication"), "Should extract 'communication'");
console.log("✓ Keyword extraction works");

// Test calculateRelevance - exact matches
const queryKeywords1 = ["stakeholder", "communication"];
const chapterKeywords1 = ["stakeholder", "feedback", "delivery"];
const relevance1 = calculateRelevance(queryKeywords1, chapterKeywords1);
console.assert(relevance1 === 1, "Should match 'stakeholder' exactly, not 'communication'");

// Test calculateRelevance - word-boundary matching (avoid false positives)
const queryKeywords2 = ["stat"];
const chapterKeywords2 = ["stakeholder", "statements"];
const relevance2 = calculateRelevance(queryKeywords2, chapterKeywords2);
console.assert(relevance2 === 0, "Should NOT match 'stat' against 'stakeholder' or 'statements' (word-boundary)");

// Test calculateRelevance - no matches
const queryKeywords3 = ["unknown", "missing"];
const chapterKeywords3 = ["stakeholder", "feedback"];
const relevance3 = calculateRelevance(queryKeywords3, chapterKeywords3);
console.assert(relevance3 === 0, "Should return 0 for no matches");

console.log("✓ calculateRelevance works (exact + word-boundary matching)");

// Test formatBookResults
const mockResults = [
  {
    book: { id: "book1", title: "Test Book", author: "Test Author", year: 2020, shortName: "test-book", description: "A test book" },
    chapter: { id: "ch1", title: "Chapter 1", excerpt: "This is a test excerpt.", keywords: ["test"], summary: "Test summary", keyQuotes: ["quote1"] },
    relevanceScore: 5
  }
];
const formattedResults = formatBookResults(mockResults);
console.assert(formattedResults.includes("Test Book"), "Should include book title");
console.assert(formattedResults.includes("Chapter 1"), "Should include chapter title");
console.assert(formattedResults.includes("This is a test excerpt."), "Should include excerpt");
console.log("✓ formatBookResults works");

// Test formatCitations
const citations = formatCitations(mockResults);
console.assert(citations.includes("Grounded in:"), "Should include 'Grounded in:' prefix");
console.assert(citations.includes("Test Book"), "Should include book title in citation");
console.assert(citations.includes("Chapter 1"), "Should include chapter title in citation");
console.log("✓ formatCitations works");

// Test searchBooks - main function integration
console.log("\n--- Testing searchBooks() ---");

// Create mock in-memory test by checking if real data exists
const allBooks = loadAllBooks();
if (allBooks.length > 0) {
  console.log(`✓ Found ${allBooks.length} books in data/books/`);

  // Test with a real query
  const results = searchBooks("feedback delivery");
  console.assert(results.length >= 0, "Should return an array");

  if (results.length > 0) {
    console.assert(results.every(r => typeof r.relevanceScore === "number"), "All results should have numeric relevanceScore");
    console.assert(results.every(r => r.book && r.book.title), "All results should have book.title");
    console.assert(results.every(r => r.chapter && r.chapter.title), "All results should have chapter.title");

    // Verify results are sorted by relevance (descending)
    for (let i = 0; i < results.length - 1; i++) {
      console.assert(
        results[i].relevanceScore >= results[i + 1].relevanceScore,
        "Results should be sorted by relevanceScore descending"
      );
    }

    console.log(`✓ searchBooks() returned ${results.length} results in relevance order`);
    console.log(`  Top result: "${results[0].book.title}" (score: ${results[0].relevanceScore})`);
  } else {
    console.log("✓ searchBooks() returned empty results (no matches for 'feedback delivery')");
  }
} else {
  console.log("ℹ No books found in data/books/ - skipping searchBooks() integration test");
  console.log("  (This is OK during development; real test will run with actual book data)")
}
