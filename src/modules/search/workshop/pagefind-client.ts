import { SEARCH_CONFIG } from "../index";

export interface ResultData {
  url: string;
  meta: { title: string };
  excerpt: string;
}

export interface PagefindResultRef {
  data: () => Promise<ResultData>;
}

export interface PagefindModule {
  options: (opts: Record<string, unknown>) => Promise<void>;
  init: () => Promise<void>;
  debouncedSearch: (
    term: string,
    opts: Record<string, unknown>,
    debounce: number,
  ) => Promise<{ results: PagefindResultRef[] } | null>;
}

let cached: Promise<PagefindModule | null> | null = null;

export function loadPagefind(): Promise<PagefindModule | null> {
  if (cached) return cached;
  cached = (async () => {
    try {
      const specifier = "/pagefind/pagefind.js";
      const pf = (await import(/* @vite-ignore */ specifier)) as PagefindModule;
      await pf.options({ excerptLength: SEARCH_CONFIG.excerptLength });
      await pf.init();
      return pf;
    } catch {
      cached = Promise.resolve(null);
      return null;
    }
  })();
  return cached;
}
