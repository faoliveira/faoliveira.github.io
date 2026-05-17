# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**
- TypeScript (strict) — all source code in `src/`, including modules, islands, and page logic
- Astro (`.astro`) — page and layout templates

**Secondary:**
- Svelte 5 — interactive islands in `src/islands/`
- CSS — custom design system via `src/styles/`
- JavaScript (`.mjs`) — Astro config (`astro.config.mjs`)

## Runtime

**Environment:**
- Node.js >=22.12.0 (required; actual: v26.0.0)
- Bun >=1.3.0 (required; actual: 1.3.14)

**Package Manager:**
- Bun 1.3.14 — primary package manager and script runner
- Lockfile: `bun.lock` (present, committed)

## Frameworks

**Core:**
- Astro 6.x (`^6.0.6`) — static site generator; output mode `static`, no SSR
- Svelte 5.x (`^5.0.0`) — reactive UI for client-side islands only

**Testing:**
- Vitest 4.x (`^4.1.0`) — test runner, configured in `vitest.config.ts`
- jsdom 29.x — DOM environment for unit tests
- @axe-core/cli 4.x — CLI accessibility testing against live dev server

**Build/Dev:**
- Vite (bundled with Astro) — used via Astro's config for alias resolution and Svelte SSR options
- pagefind 1.x — static search index generation; runs post-build via `pagefind --site dist/`

## Key Dependencies

**Critical:**
- `astro` `^6.0.6` — framework core; all pages, layouts, content collections
- `@astrojs/svelte` `^8.1.0` — Svelte integration for Astro islands
- `@astrojs/mdx` `^5.0.2` — MDX support for blog posts
- `@astrojs/rss` `^4.0.17` — RSS feed generation at `src/pages/rss.xml.ts`
- `@astrojs/sitemap` `^3.7.1` — sitemap generation; excludes `/404/` and `/design-system/`

**OG Image Generation:**
- `satori` `^0.26.0` — renders HTML/CSS to SVG at build time for OG images
- `satori-html` `^0.3.2` — template helper for satori
- `@resvg/resvg-js` `^2.6.2` — converts SVG to PNG for OG image files

**Content & Embeds:**
- `astro-expressive-code` `^0.41.7` — syntax-highlighted code blocks; themes: `everforest-light`, `kanagawa-wave`
- `@astro-community/astro-embed-bluesky` `^0.1.6` — Bluesky post embeds
- `@astro-community/astro-embed-twitter` `^0.5.11` — Twitter/X post embeds
- `@astro-community/astro-embed-youtube` `^0.5.10` — YouTube video embeds
- `@astro-community/astro-embed-vimeo` `^0.3.12` — Vimeo video embeds
- `@astro-community/astro-embed-gist` `^0.1.0` — GitHub Gist embeds
- `remark-emoji` `^5.0.2` — emoji shortcode support in Markdown
- `markdown-it` `^14.1.1` — Markdown renderer used for RSS body content
- `sanitize-html` `^2.17.2` — HTML sanitization for RSS feed output
- `phosphor-astro` `^2.1.0` — icon set for Astro components
- `phosphor-svelte` `^3.1.0` — icon set for Svelte islands

**Client-Side Game/Audio:**
- `kontra` `^10.0.2` — sprite/game loop library used in `src/islands/lib/NunotchiGame.svelte` for the virtual pet

**Code Quality:**
- `@biomejs/biome` `^2.4.8` — linting + formatting (replaces ESLint + Prettier)
- `knip` `^5.88.1` — dead code and unused exports detection
- `lefthook` `^2.1.4` — git hooks (pre-commit: lint, knip, loc-guard, typecheck, impeccable)

## Configuration

**TypeScript:**
- Extends `astro/tsconfigs/strict` — full strict mode
- Path aliases: `@modules/*`, `@components/*`, `@layouts/*`, `@styles/*`, `@islands/*`, `@assets/*`
- Config: `tsconfig.json`

**Biome (Lint + Format):**
- Indent: 2 spaces, line width 100
- `noConsole`: error (except explicitly suppressed in `CurrentlyWidget.svelte`)
- `noExcessiveCognitiveComplexity`: error
- Config: `biome.json`

**Astro:**
- Site: `https://felipeo.me`
- Output: `static`
- Vite alias: `@assets` → `src/assets/`
- Config: `astro.config.mjs`

**Environment:**
- No `.env` files detected — site has no runtime environment variables
- All configuration is build-time only

**Build:**
- Build command: `astro build && pagefind --site dist/`
- Output: `dist/`

## Platform Requirements

**Development:**
- macOS or Linux, Bun >=1.3.0, Node >=22.12.0
- `lefthook` installed for pre-commit hooks (runs lint, type-check, loc-guard, knip)

**Production:**
- Fully static output in `dist/` — no server runtime required
- Custom domain: `felipeo.me` (CNAME file at root)
- Deployed to GitHub Pages via `.github/workflows/deploy.yml`

---

*Stack analysis: 2026-05-15*
