# External Integrations

**Analysis Date:** 2026-05-15

## APIs & External Services

**Analytics:**
- GoatCounter — privacy-respecting, cookieless page analytics
  - Script: loaded from `//gc.zgo.at/count.js`
  - Endpoint: `https://kazary.goatcounter.com/count`
  - Implementation: `src/components/GoatCounter.astro`
  - No cookies, no personal data. IP discarded server-side.
  - Re-triggers on Astro View Transition soft navigations via `astro:page-load` event.
  - Opt-out: hash `#toggle-goatcounter` on any page; preference saved in `localStorage`.

**Embed Providers (content only, no auth):**
- YouTube — video embeds in blog posts and the "Now Playing" audio widget
  - Static embed: `@astro-community/astro-embed-youtube` used in `src/components/embeds/YouTube.astro`
  - Dynamic embed: YouTube IFrame API loaded at runtime from `https://www.youtube.com/iframe_api` in `src/islands/lib/audio-source.ts`
- Spotify — music playback in "Now Playing" audio widget
  - Spotify IFrame API loaded at runtime from `https://open.spotify.com/embed/iframe-api/v1` in `src/islands/lib/audio-source.ts`
  - Supports tracks, episodes, playlists, albums
  - Preview detection: clips <=30.5s flagged as `preview: true`
- Vimeo — video embeds in blog posts
  - Static embed: `@astro-community/astro-embed-vimeo` used in `src/components/embeds/Vimeo.astro`
- Twitter/X — post embeds in blog posts
  - Static embed: `@astro-community/astro-embed-twitter` used in `src/components/embeds/Tweet.astro`
- Bluesky — post embeds in blog posts
  - Static embed: `@astro-community/astro-embed-bluesky` used in `src/components/embeds/Bluesky.astro`
- GitHub Gist — code snippet embeds in blog posts
  - Static embed: `@astro-community/astro-embed-gist` used in `src/components/embeds/Gist.astro`
- CodePen — code demo embeds in blog posts
  - Static embed: `src/components/embeds/CodePen.astro`

**Accessibility Auditing (CI/dev only):**
- axe-core CLI — a11y testing against local dev server
  - Tool: `@axe-core/cli`
  - Command: `bun run test:a11y` targets live `http://localhost:4321/` routes
  - Not wired into the CI deploy pipeline; run manually

## Data Storage

**Databases:**
- None — no database of any kind. The site is fully static.

**Content:**
- Astro Content Collections (file-based)
  - `posts`: Markdown/MDX files in `src/content/posts/` — blog posts
  - `currently`: JSON file at `src/content/currently/now.json` — "what I'm up to now" widget data
  - Schemas defined in `src/content.config.ts`; validated via `astro/zod`
  - Types: `src/modules/content/types.ts`, `src/modules/currently/schema.ts`

**File Storage:**
- Local filesystem only — static assets in `src/assets/`
- OG image fonts: `src/assets/fonts/og/Sora-Regular.ttf` and `Sora-Bold.ttf` (loaded at build time by `src/modules/seo/og-image.ts`)

**Caching:**
- None at runtime
- Build-time CI cache: Bun module cache (`~/.bun/install/cache`) via `actions/cache@v4` in `.github/workflows/deploy.yml`

**Client-Side Storage:**
- `localStorage` — used exclusively by the "Nunotchi" virtual pet widget to persist pet state between sessions
  - Keys managed in `src/islands/lib/nunotchi-state.ts`
  - GoatCounter opt-out preference also stored in `localStorage`

## Authentication & Identity

**Auth Provider:**
- None — no authentication, sessions, or user identity of any kind.

## OG Image Generation

**Build-time image rendering:**
- Pipeline: satori (HTML→SVG) → @resvg/resvg-js (SVG→PNG)
- Entry: `src/pages/og/[...slug].png.ts`
- Logic: `src/modules/seo/og-image.ts`
- Fonts loaded from disk at build time: `src/assets/fonts/og/`
- Generates 1200×630px PNG images for all published posts plus `/index` and `/about`

## Static Search

**Pagefind:**
- Self-hosted, fully static search index — no external search service
- Index generated post-build: `pagefind --site dist/`
- Loaded lazily in the browser via dynamic `import('/pagefind/pagefind.js')`
- Implementation: `src/components/SearchBox.astro`
- Type declarations: `src/env.d.ts`

## Monitoring & Observability

**Error Tracking:**
- None — no error tracking service (Sentry, Rollbar, etc.)

**Logs:**
- None at runtime — static site has no server-side logs
- Build logs available via GitHub Actions

## CI/CD & Deployment

**Hosting:**
- GitHub Pages — fully static hosting
- Custom domain: `felipeo.me` (configured via `CNAME` at repo root)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/deploy.yml`
- Triggers: push to `main` branch only
- Steps in order:
  1. Checkout with `actions/checkout@v4`
  2. Install Bun via `oven-sh/setup-bun@v2` (bun version "1")
  3. Restore Bun module cache via `actions/cache@v4`
  4. `bun install --frozen-lockfile`
  5. `bun run check` (Astro type-check)
  6. `bun run lint` (Biome)
  7. `bun run test` (Vitest)
  8. `bun run build` (Astro build + pagefind index)
  9. Upload `dist/` artifact via `actions/upload-pages-artifact@v3`
  10. Deploy via `actions/deploy-pages@v4`

**Pre-commit Hooks (Lefthook):**
- Configured in `lefthook.yml`; runs sequentially on commit
- `biome check --write --staged` — auto-fix staged files
- `knip --no-exit-code` — unused exports check
- `bash scripts/loc-guard.sh` — lines-of-code guard
- `astro sync && bun run check` — type-check
- `npx impeccable detect --fast src/` — code quality gate

## RSS Feed

**Outgoing feed:**
- Endpoint: `/rss.xml`
- Implementation: `src/pages/rss.xml.ts`
- Uses `@astrojs/rss` with full post body rendered by `markdown-it` and sanitized by `sanitize-html`
- No incoming webhooks or subscriptions managed server-side

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (all third-party embeds load external scripts client-side; no server-to-server calls)

## Environment Configuration

**Required env vars:**
- None — the site has zero runtime environment variables
- No `.env` file present or expected

**Secrets:**
- No secrets of any kind; all data is public and build-time only

---

*Integration audit: 2026-05-15*
