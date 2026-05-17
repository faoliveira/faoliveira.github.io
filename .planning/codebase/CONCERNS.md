# Concerns

**Analysis Date:** 2026-05-15

Areas of technical debt, fragile patterns, and known risks. Each item includes severity and a recommended direction so future plans can pick them up.

## Tech Debt

### Dual search implementations
**Severity:** Medium
**Where:** `src/components/SearchBox.astro` (~585 lines) and `src/modules/search/workshop/` + `src/components/WorkshopSearch.astro`
**Issue:** Two parallel implementations of Pagefind-backed search. Both duplicate `escapeHtml`, `sanitizeExcerpt`, the Pagefind loader (`@vite-ignore` dynamic import), and the result rendering loop.
**Direction:** Extract a shared search controller into `src/modules/search/` and have both components import from the barrel. Today only the workshop path has the sanitized excerpt logic in a testable module — the global header path inlines it in a `<script>` block.

### `escapeHtml` defined three times
**Severity:** Medium
**Where:** `SearchBox.astro` inline script, workshop search module, and an additional copy in another consumer.
**Issue:** Subtle discrepancy — single-quote handling differs between versions. A future XSS payload that exploits the inconsistency could slip past one of them.
**Direction:** Single canonical `escapeHtml` in `src/modules/search/` (or a shared text utility if it grows). Cover with tests for `<`, `>`, `&`, `'`, `"`.

### Theme key duplication
**Severity:** Low
**Where:** `src/modules/theme/theme-script.ts` (inline `<head>` script — must be a string literal for inline injection) and `src/modules/theme/index.ts` (`THEME_KEY` constant used by toggle)
**Issue:** The localStorage key `THEME_KEY` is duplicated between the two contexts with no type-checked sync guarantee. A rename in one place silently breaks theme persistence.
**Direction:** Generate the inline script at build time from the constant, or add a unit test that asserts both literals match.

### OG palette duplicated from CSS tokens
**Severity:** Low
**Where:** `src/modules/seo/og-image.ts` hardcodes hex approximations of design tokens for Satori (which can't read CSS variables).
**Issue:** Token updates in `src/styles/tokens.css` will not flow through to OG images. Brand drift over time.
**Direction:** Centralize tokens in a TS file (`src/modules/design-system/tokens.ts`) and have both `tokens.css` (generated or referenced) and `og-image.ts` import from it.

### Design system page duplicates token values
**Severity:** Low
**Where:** `src/pages/design-system.astro`
**Issue:** Manually re-types token display values from `src/styles/tokens.css`. Same drift problem as OG.
**Direction:** Same root cause as above — central source of truth for tokens.

### Unused exports flagged by knip
**Severity:** Low
**Where:** `knip.json` reports ~11 unused exports + ~13 unused types
**Issue:** `knip.json` ignore scope is broad enough that some genuinely-dead exports survive. Dead code accretes.
**Direction:** Tighten `knip.json` ignores, then run cleanup phase to delete or re-export.

### Stale scaffold file
**Severity:** Low
**Where:** `src/islands/TestCounter.svelte`
**Issue:** Appears to be an uncommitted Svelte scaffold with no consumers — looks like a learning artifact.
**Direction:** Delete unless there's a documented reason to keep it.

## Security

### `innerHTML` with Pagefind excerpt HTML
**Severity:** Medium (mitigated)
**Where:** Workshop search renders excerpts via `innerHTML` after passing through `sanitizeExcerpt`. The global `SearchBox.astro` path has its own sanitizer.
**Issue:** Pagefind excerpts contain `<mark>` tags that must survive sanitization. A bug in either sanitizer could allow injection from any post body indexed by Pagefind. Two sanitizers means two surfaces to audit.
**Direction:** Consolidate to one sanitizer (see "Dual search implementations" above). Add a test that injects `<script>` into a fixture post and asserts it's stripped.

### Email obfuscation (ROT13)
**Severity:** Low (accepted)
**Where:** Contact page email is ROT13-encoded.
**Issue:** ROT13 is trivially scraped — it slows naive bots, nothing more.
**Direction:** Accept as-is. The site has no security boundary; the email is intentionally public.

### `@vite-ignore` dynamic Pagefind import
**Severity:** Low
**Where:** `SearchBox.astro` and workshop search use `import(/* @vite-ignore */ '/pagefind/pagefind.js')`
**Issue:** Bypasses Vite's bundling so Pagefind can be loaded from the static output. Same-origin only, so low risk.
**Direction:** No action needed. Document why the comment exists where it's used.

## Performance

### Grain texture forces recomposite on scroll
**Severity:** Low (accepted)
**Where:** `src/styles/texture.css` — `body::after` with `position: fixed` + `mix-blend-mode`
**Issue:** Forces a composite layer recalc on every scroll on some browsers. Visible only on low-end devices.
**Direction:** Documented as accepted tradeoff (the texture is a brand element). If performance regresses, gate behind `prefers-reduced-motion` or downgrade to a static background-image.

### Module-level singletons in audio source
**Severity:** Low
**Where:** `src/islands/lib/audio-source.ts` keeps `ytApiPromise`, `spotifyApiPromise`, and a result cache as module-level variables.
**Issue:** Optimizes hot path but complicates test isolation — tests must `vi.resetModules()` between cases. Also can't reset across Astro view transitions if those are ever added.
**Direction:** If view transitions land, refactor to a per-island instance. Otherwise, document and leave.

### OG font cache is a module-level singleton
**Severity:** Low
**Where:** `src/modules/seo/og-image.ts`
**Issue:** Same shape — singleton speeds up the OG endpoint but couples test runs.
**Direction:** Acceptable for now; the singleton is only read at build time and the test surface is small.

## Fragile Areas

### `now.json` errors surface only at build time
**Severity:** Medium
**Where:** `src/content/currently/now.json` validated by `CurrentlySchema` in `src/modules/currently/schema.ts`
**Issue:** A malformed `now.json` breaks the build with a Zod error. No editor-time validation; no schema test.
**Direction:** Add a Vitest case that loads `now.json` and asserts it parses. Wire to pre-commit so the issue surfaces before push.

### 585-line `SearchBox.astro` with logic in `<script>`
**Severity:** Medium
**Where:** `src/components/SearchBox.astro`
**Issue:** Approaches the 600-line loc-guard cap. Most of the logic is in an inline `<script>` block which is hard to unit-test.
**Direction:** Extract the controller into `src/modules/search/` (also resolves the dual-implementation note). The Astro component becomes a thin DOM shell.

### `getExcerpt()` regex chain in `log.astro`
**Severity:** Low
**Where:** `src/pages/log.astro` — inline regex chain to extract a log excerpt from Markdown body
**Issue:** Untested, lives in a page (violates "pages stay thin"), and regex chains are notoriously easy to break.
**Direction:** Move to `src/modules/content/` with explicit tests for code fences, headings, images, and HTML.

## Dependencies at Risk

### Svelte 5 + Astro coordination
**Severity:** Medium
**Where:** `svelte` `^5.0.0` + `@astrojs/svelte` `^8.1.0` + `phosphor-svelte` `^3.1.0`
**Issue:** Svelte 5 runes-based reactivity is still settling; `@astrojs/svelte` integration and `phosphor-svelte` SSR workarounds (`ssr.noExternal` + `optimizeDeps.include` in `astro.config.mjs`) are tightly coupled. A version bump in one piece risks SSR errors.
**Direction:** Treat the three as a unit. Pin in renovate / bump together. Run `bun run check` + a smoke build before merging any of them.

### `kontra` (game loop library)
**Severity:** Low
**Where:** `src/islands/lib/NunotchiGame.svelte` uses `kontra` `^10.0.2`
**Issue:** Niche library, low release cadence. If it stops being maintained the virtual pet is stranded.
**Direction:** Accept the risk — the surface area used (`Sprite`, game loop) is small enough to inline if needed.

### `@atproto/*` transitive chain via Bluesky embed
**Severity:** Low
**Where:** `@astro-community/astro-embed-bluesky` pulls in `@atproto/*` packages.
**Issue:** Transitive supply chain is non-trivial for a single embed feature.
**Direction:** Audit when bumping the embed package. If the dep graph balloons, replace with a static iframe embed.

## Test Coverage Gaps

| Surface | Why it matters | Priority |
|---------|---------------|----------|
| `SearchBox.astro` search controller | Highest user-facing surface, no unit tests | High |
| `log.astro` `getExcerpt()` | Regex parser with no tests | Medium |
| YouTube / Spotify singleton lifecycle | Edge cases under failed embed loads | Medium |
| `now.json` schema validation | Build-only error surface | Medium |
| OG image hex palette ↔ CSS tokens | Brand drift detection | Low |

## Severity Summary

| Severity | Count |
|----------|-------|
| Medium | 6 |
| Low | 13 |

No High-severity items today. The recurring theme: **search and design-system tokens** are the two areas with the most duplication and fragility. A focused phase on each would clear most of the Medium list.

---

*Concerns analysis: 2026-05-15*
