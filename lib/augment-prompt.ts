// lib/augment-prompt.ts

import { BookSearchResult } from "./book-types";
import { searchBooks, formatBookResults, formatCitations } from "./book-search";

/**
 * Augment a Claude prompt with relevant book context
 *
 * @param originalPrompt The base prompt (without book context)
 * @param queryText Text to search books on (e.g. design decision + rationale)
 * @returns Object containing augmented prompt and book search results
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
 *
 * @param output The base output text from Claude
 * @param bookResults Array of book search results to cite
 * @returns Output with citations appended
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
