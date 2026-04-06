// Stub for astro:content — used by Vitest via alias in vitest.config.ts
// The real implementation is provided by Astro at build time.
// Tests override individual exports using vi.mock('astro:content', ...).

export const getCollection = async () => [];
export const render = async () => ({ Content: () => null, headings: [] });
