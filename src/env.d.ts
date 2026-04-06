/// <reference types="astro/client" />

// Pagefind index is generated at build time by `pagefind --site dist/`
// The module does not exist during development — imported lazily with @vite-ignore
declare module "/pagefind/pagefind.js" {
  export function options(opts: Record<string, unknown>): Promise<void>;
  export function init(): Promise<void>;
  export function debouncedSearch(
    term: string,
    opts: Record<string, unknown>,
    debounce: number,
  ): Promise<{
    results: Array<{
      data: () => Promise<{
        url: string;
        meta: { title: string };
        excerpt: string;
      }>;
    }>;
  } | null>;
}
