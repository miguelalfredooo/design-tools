// lib/book-search.test.ts

import { extractKeywords, searchBooks, formatCitations, calculateRelevance, formatBookResults, loadAllBooks } from "./book-search";

// Test keyword extraction
const keywords = extractKeywords("stakeholder communication feedback delivery");
console.assert(keywords.includes("stakeholder"), "Should extract 'stakeholder'");
console.assert(keywords.includes("communication"), "Should extract 'communication'");
console.log("✓ Keyword extraction works");

// Test calculateRelevance
const queryKeywords1 = ["stakeholder", "communication"];
const chapterKeywords1 = ["stakeholder", "feedback", "delivery"];
const relevance1 = calculateRelevance(queryKeywords1, chapterKeywords1);
console.assert(relevance1 > 0, "Should find at least one matching keyword");
console.assert(relevance1 === 1, "Should match 'stakeholder' keyword");

const queryKeywords2 = ["unknown", "missing"];
const chapterKeywords2 = ["stakeholder", "feedback"];
const relevance2 = calculateRelevance(queryKeywords2, chapterKeywords2);
console.assert(relevance2 === 0, "Should return 0 for no matches");
console.log("✓ calculateRelevance works");

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
