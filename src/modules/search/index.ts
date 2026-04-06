// src/modules/search/index.ts
export type { SearchConfig, SearchResult, SubResult } from "./types";

import type { SearchConfig } from "./types";

export const SEARCH_CONFIG: SearchConfig = {
  excerptLength: 30,
  maxResults: 5,
  debounceMs: 300,
};
