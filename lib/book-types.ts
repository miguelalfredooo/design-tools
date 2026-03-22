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
