// lib/book-search.test.ts

import { extractKeywords, searchBooks, formatCitations } from "./book-search";

// Test keyword extraction
const keywords = extractKeywords("stakeholder communication feedback delivery");
console.assert(keywords.includes("stakeholder"), "Should extract 'stakeholder'");
console.assert(keywords.includes("communication"), "Should extract 'communication'");
console.log("✓ Keyword extraction works");
