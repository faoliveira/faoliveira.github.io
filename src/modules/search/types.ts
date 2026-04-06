// src/modules/search/types.ts

export interface SubResult {
  url: string;
  title: string;
  excerpt: string;
}

export interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
  subResults?: SubResult[];
}

export interface SearchConfig {
  excerptLength: number;
  maxResults: number;
  debounceMs: number;
}
