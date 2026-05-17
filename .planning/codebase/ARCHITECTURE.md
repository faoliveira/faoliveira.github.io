# Architecture

**Analysis Date:** 2026-05-15

## Pattern

**Static-first islands architecture** built on Astro 6. The site renders to fully static HTML at build time; client-side JavaScript is opt-in per island. No SSR, no API server, no runtime database.

The architecture optimizes for **GitHub Pages deployment**: every page is a pre-rendered HTML file, search runs entirely in the browser via Pagefind, and dynamic widgets re-hydrate only the smallest viable component.

## Layers

```
┌──────────────────────────────────────────────────────┐
│  src/pages/        Thin route handlers (Astro pages) │
├──────────────────────────────────────────────────────┤
│  src/layouts/      Page shells (BaseLayout, etc.)    │
├──────────────────────────────────────────────────────┤
│  src/components/   Reusable Astro components         │
│  src/islands/      Svelte 5 client-side islands      │
├──────────────────────────────────────────────────────┤
│  src/modules/      Domain logic (Deep Modules)       │
│    ├── content/    Content collection queries        │
│    ├── currently/  Now-page widgets + audio source   │
│    ├── seo/        OG image, meta, structured data   │
│    ├── search/     Pagefind workshop search          │
│    ├── theme/      Light/dark theme persistence      │
│    ├── navigation/ Nav state                         │
│    └── design-system/ Token + component registry     │
├──────────────────────────────────────────────────────┤
│  src/content/      Markdown posts + currently JSON   │
│  src/assets/       Images, fonts (OG render fonts)   │
│  src/styles/       Token CSS + page-specific CSS     │
└──────────────────────────────────────────────────────┘
```

**Boundary rule:** Pages and components import only from module **barrels** (`@modules/content`, `@modules/seo`, etc.). Internal module files are private. This is enforced by convention and verified during code review.

## Data Flow

### Build-time (the dominant path)

```
src/content/posts/*.md
       │
       │ glob() loader + Zod schema (src/content.config.ts)
       ▼
Astro Content Collection ("posts")
       │
       │ getCollection() via src/modules/content/queries.ts
       ▼
Filtered + sorted Post[] (excludes drafts in PROD)
       │
       │ rendered by src/pages/posts/[...slug].astro
       ▼
Static HTML in dist/
       │
       │ pagefind --site dist/  (post-build)
       ▼
Static search index in dist/pagefind/
```

The same `getCollection` pipeline drives the homepage, the log, the RSS feed, the sitemap, and the OG image endpoint.

### Runtime (browser, opt-in per island)

```
Static HTML page (no JS by default)
       │
       │ on demand:
       ├──► CurrentlyWidget.svelte   — re-hydrates with audio + game
       ├──► SearchBox.astro <script> — loads Pagefind, queries index
       ├──► theme-script.ts          — inline script, sets data-theme
       └──► NightfallToggle.astro    — toggles theme via localStorage
```

## Key Abstractions

### Content collections (the schema-first domain)

`src/content.config.ts` declares two collections:

- **posts** — Markdown / MDX under `src/content/posts/**`, validated by `PostSchema` (`src/modules/content/types.ts`). Drafts live in a `drafts/` subfolder.
- **currently** — JSON at `src/content/currently/now.json`, validated by `CurrentlySchema` (`src/modules/currently/schema.ts`). Drives the "Currently" widget.

Schemas are Zod-based; derived fields like `slug`, `formatted date`, and `type` are computed in `src/modules/content/` — never inline in templates.

### Content queries (`src/modules/content/queries.ts`)

Four query functions own all collection access:

- `getPublishedPosts({ limit, excludeFeatured })` — main feed
- `getFeaturedPosts()` — homepage hero grid
- `getPostsByType(type)` — log filters
- `getPostBySlug(slug)` — detail pages

Each runs `getCollection("posts", filter)` with a shared `isVisible()` predicate (drops drafts in PROD, keeps them in DEV) and a stable `sortByDateDesc()` comparator.

### SEO module (`src/modules/seo/`)

- `meta.ts` — assembles `<title>`, OG meta, canonical
- `og-image.ts` — renders OG images on demand via Satori + resvg, called from `src/pages/og/[...slug].png.ts`
- `structured-data.ts` — JSON-LD per page type
- `site-config.ts` — central site identity

### Search module (`src/modules/search/`)

Two implementations exist — the lightweight global header search (`SearchBox.astro` + `src/modules/search/`) and the heavier workshop search (`src/modules/search/workshop/` + `WorkshopSearch.astro`). Both load Pagefind dynamically with `@vite-ignore`. See `CONCERNS.md` for the duplication note.

### Theme module (`src/modules/theme/`)

- `theme-script.ts` — inline script injected into `<head>` so the theme applies before paint (no FOUC)
- `index.ts` — barrel exporting the script and a `THEME_KEY` constant
- Driven by `NightfallToggle.astro` in the header

### Currently / Cyberdeck (`src/modules/currently/`)

The "Now" page is an interactive 1-bit cyberdeck UI implemented as Svelte 5 islands:

- `CyberdeckLayout.svelte` — mobile layout
- `DesktopLayout.svelte` — desktop layout
- `NunotchiGame.svelte` + `nunotchi-state.ts` — virtual-pet game powered by Kontra
- `audio-source.ts` — wraps YouTube + Spotify embed APIs with module-level promise caches
- `window-state.svelte.ts` — pocket-organizer window state, persisted to localStorage

## Entry Points

| Path | Purpose |
|------|---------|
| `src/pages/index.astro` | Homepage — featured grid + recent posts |
| `src/pages/posts/index.astro` | Paginated post list |
| `src/pages/posts/[...slug].astro` | Individual post detail |
| `src/pages/posts/page/[page].astro` | Pagination route |
| `src/pages/log.astro` | Chronological log view |
| `src/pages/about.astro` | About page |
| `src/pages/search.astro` | Full-page Pagefind search |
| `src/pages/design-system.astro` | Internal design system reference |
| `src/pages/rss.xml.ts` | RSS feed endpoint |
| `src/pages/og/[...slug].png.ts` | OG image endpoint (Satori) |
| `src/pages/404.astro` | Fallback |
| `src/pages/privacy.astro` | Static privacy page |

## Build / Deploy

- **Local dev:** `bun run dev` → Vite dev server on `localhost:4321`
- **Build:** `bun run build` runs `astro build && pagefind --site dist/`
- **Deploy:** `.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/` to GitHub Pages
- **Custom domain:** `felipeo.me` (CNAME file at repo root)

## Architecture Decisions (read this before changing things)

These are encoded in `CLAUDE.md` and enforced by review:

1. **No SSR.** `output: "static"` in `astro.config.mjs`. Don't add dynamic rendering.
2. **No database, no auth, no background workers.** Data lives in Markdown/JSON files.
3. **Smallest island.** Default to HTML/CSS. Add JS only when interaction is non-trivial.
4. **Pages stay thin.** Transforms, vendor wrappers, and normalization go in `src/modules/`.
5. **External APIs wrapped in modules.** Bluesky, YouTube, Spotify, Pagefind — all go through a module.
6. **Deep modules.** Small public APIs in `index.ts`; complexity hidden in internal files. Enforced by the 600-line ceiling per file (`scripts/loc-guard.sh`).

---

*Architecture analysis: 2026-05-15*
