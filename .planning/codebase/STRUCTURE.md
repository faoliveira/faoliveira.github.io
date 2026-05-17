# Directory Structure

**Analysis Date:** 2026-05-15

## Top-Level Layout

```
GDS/
├── src/                       Source code (TS, Astro, Svelte, CSS)
├── public/                    Static assets copied verbatim to dist/
├── scripts/                   Repo tooling (loc-guard.sh, etc.)
├── tests/                     Cross-cutting test fixtures (if any)
├── .github/workflows/         GitHub Actions (deploy.yml)
├── .planning/                 GSD planning artifacts (this folder)
├── astro.config.mjs           Astro config (static, sitemap, mdx, svelte)
├── tsconfig.json              Strict TS via astro/tsconfigs/strict + aliases
├── vitest.config.ts           Vitest runner config
├── biome.json                 Lint + format config
├── lefthook.yml               Pre-commit hooks
├── knip.json                  Dead code detection config
├── package.json               Bun-managed dependencies + scripts
├── bun.lock                   Bun lockfile (committed)
├── CLAUDE.md                  AI assistant project rules
├── CNAME                      GitHub Pages custom domain (felipeo.me)
└── README.md
```

## `src/` Anatomy

```
src/
├── pages/                     Astro file-based routes (thin handlers)
│   ├── index.astro            Homepage
│   ├── about.astro            About page
│   ├── log.astro              Log view
│   ├── search.astro           Full-page search
│   ├── design-system.astro    Internal token reference (excluded from sitemap)
│   ├── 404.astro              Fallback
│   ├── privacy.astro          Static privacy page
│   ├── rss.xml.ts             RSS feed endpoint
│   ├── posts/
│   │   ├── index.astro        Post list
│   │   ├── [...slug].astro    Post detail
│   │   └── page/[page].astro  Pagination
│   └── og/
│       └── [...slug].png.ts   OG image endpoint (Satori)
│
├── layouts/                   Page shells
│   ├── BaseLayout.astro
│   ├── DataEssayLayout.astro
│   ├── LogLayout.astro
│   ├── PostLayout.astro
│   └── ProjectLayout.astro
│
├── components/                Reusable Astro components
│   ├── FeaturedCard.astro     Card variants for hero grid
│   ├── FeaturedGrid.astro
│   ├── Footer.astro
│   ├── GoatCounter.astro      Privacy-friendly analytics
│   ├── Hero.astro
│   ├── IslandPlaceholder.astro
│   ├── LogoMark.astro
│   ├── MarginNote.astro
│   ├── Nav.astro              Main nav
│   ├── NightfallToggle.astro  Theme toggle (large because no JS framework)
│   ├── NunoDoodle.astro
│   ├── Pagination.astro
│   ├── Polaroid.astro
│   ├── PostList.astro
│   ├── PostRow.astro
│   ├── SEOHead.astro          Meta tag composition
│   ├── SearchBox.astro        Global header search (Pagefind)
│   ├── SkipLink.astro         A11y skip link
│   ├── TableOfContents.astro
│   ├── TypeTag.astro
│   ├── WashiTape.astro
│   ├── WorkshopSearch.astro   Heavier workshop search variant
│   ├── content/               Content-rendering components
│   └── embeds/                Wrapped third-party embeds
│
├── islands/                   Svelte 5 islands (client-side hydrated)
│   ├── CurrentlyWidget.svelte
│   ├── DataTableSort.svelte
│   ├── ImageCompare.svelte
│   ├── TestCounter.svelte     (uncommitted scaffold — see CONCERNS.md)
│   └── lib/                   Deep-module helpers for the cyberdeck UI
│       ├── CyberdeckLayout.svelte
│       ├── DesktopLayout.svelte
│       ├── NunotchiGame.svelte
│       ├── NowPlayingCard.svelte
│       ├── CurrentlyCard.svelte
│       ├── ReadingCard.svelte
│       ├── TerminalCard.svelte
│       ├── NunotchiCard.svelte
│       ├── audio-format.ts
│       ├── audio-source.ts        (YouTube + Spotify wrappers)
│       ├── currently-types.ts
│       ├── nuno-atlas.ts
│       ├── nuno-commands.ts
│       ├── nunotchi-state.ts
│       ├── paper-anim.ts
│       └── window-state.svelte.ts
│
├── modules/                   Domain logic (Deep Modules — barrel-only public API)
│   ├── content/               Post collection queries
│   │   ├── index.ts           Barrel: formatDate, queries, types
│   │   ├── format-date.ts
│   │   ├── queries.ts         getPublishedPosts, getFeaturedPosts, etc.
│   │   ├── types.ts           Zod PostSchema + types
│   │   └── __tests__/
│   ├── currently/             Currently/now schema
│   │   └── schema.ts          Zod CurrentlySchema
│   ├── seo/                   OG, meta, structured data
│   │   ├── index.ts
│   │   ├── meta.ts
│   │   ├── og-image.ts        Satori renderer
│   │   ├── structured-data.ts JSON-LD
│   │   ├── site-config.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   ├── search/                Pagefind search controllers
│   │   ├── workshop/          Workshop search (heavier path)
│   │   └── __tests__/
│   ├── theme/                 Theme persistence + inline script
│   │   ├── index.ts
│   │   ├── theme-script.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   ├── navigation/            Nav state
│   │   └── __tests__/
│   └── design-system/         Internal token registry
│       └── __tests__/
│
├── content/                   Astro Content Collections (data, not code)
│   ├── posts/                 Markdown / MDX posts
│   │   └── drafts/            Hidden in PROD
│   └── currently/
│       └── now.json           Drives Currently widget
│
├── content.config.ts          Collection definitions (Zod schemas)
│
├── assets/                    Imported assets (bundled by Vite)
│   ├── about/                 About-page photos
│   └── fonts/                 Font files
│       └── og/                Fonts loaded by Satori for OG render
│
├── styles/                    CSS (token-driven design system)
│   ├── global.css             Resets + base
│   ├── tokens.css             Design tokens (colors, spacing, type)
│   ├── typography.css
│   ├── prose.css              Markdown content styles
│   ├── code.css
│   ├── animations.css
│   ├── nightfall.css          Dark theme
│   ├── texture.css            Grain / paper texture
│   ├── currently-widget.css   Cyberdeck UI styles (large; widget-specific)
│   ├── data-essay.css
│   ├── embeds.css
│   ├── pages/                 Page-specific CSS
│   └── __tests__/
│
└── __mocks__/                 Vitest module mocks
    └── astro-content.ts       Mocks 'astro:content' for unit tests
```

## Path Aliases

Defined in `tsconfig.json` and mirrored in `vitest.config.ts`:

| Alias | Resolves to | Use for |
|-------|-------------|---------|
| `@modules/*` | `src/modules/*` | Cross-module imports through barrels |
| `@components/*` | `src/components/*` | Astro components |
| `@layouts/*` | `src/layouts/*` | Page layouts |
| `@styles/*` | `src/styles/*` | CSS imports |
| `@islands/*` | `src/islands/*` | Svelte islands |
| `@assets/*` | `src/assets/*` | Bundled assets (also registered as Vite alias in `astro.config.mjs`) |

## Naming Conventions (where files live)

| Kind | Location | Filename |
|------|----------|----------|
| Astro route | `src/pages/<path>.astro` | matches URL |
| Dynamic route | `src/pages/<segment>/[param].astro` | bracket syntax |
| Layout | `src/layouts/<Name>Layout.astro` | PascalCase |
| Astro component | `src/components/<Name>.astro` | PascalCase |
| Svelte island (top-level) | `src/islands/<Name>.svelte` | PascalCase |
| Svelte island helper | `src/islands/lib/<name>.ts` or `<Name>.svelte` | kebab-case for TS, PascalCase for components |
| Domain module | `src/modules/<capability>/index.ts` | barrel at root |
| Module internal | `src/modules/<capability>/<name>.ts` | kebab-case |
| Test | `src/<...>/<__tests__>/<name>.test.ts` | co-located |
| Style | `src/styles/<name>.css` | kebab-case |
| Page-specific style | `src/styles/pages/<page>.css` | matches page name |

## Where to Put Things

| Task | Go to |
|------|-------|
| Add a page | `src/pages/` |
| Add a layout variant | `src/layouts/` |
| Add a static component | `src/components/` |
| Add an interactive widget | `src/islands/` |
| Add domain logic | `src/modules/<capability>/`, expose via `index.ts` |
| Add a content type | Define in `src/content.config.ts`, add Zod schema in matching module |
| Add a Markdown post | `src/content/posts/` (or `posts/drafts/`) |
| Tweak design tokens | `src/styles/tokens.css` |
| Add a font for OG | `src/assets/fonts/og/`, register in `src/modules/seo/og-image.ts` |
| Add an external API | Wrap behind a module, never call from a page |

## Pages → Modules Map

Quick reference for which page touches which module:

| Page | Modules used |
|------|--------------|
| `index.astro` | `content`, `seo` |
| `posts/[...slug].astro` | `content`, `seo` |
| `posts/index.astro`, `posts/page/[page].astro` | `content`, `seo` |
| `log.astro` | `content`, `seo` |
| `about.astro` | `seo` |
| `search.astro` | `search`, `seo` |
| `rss.xml.ts` | `content`, `seo` |
| `og/[...slug].png.ts` | `seo`, `content` |
| `design-system.astro` | `design-system` |

---

*Structure analysis: 2026-05-15*
