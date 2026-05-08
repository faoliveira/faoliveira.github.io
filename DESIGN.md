---
name: felipeo.me — Koubou
description: Cream paper, matcha ink, mono in the gutter — a workshop, not a blog template.
colors:
  surface: "oklch(0.96 0.012 80)"
  surface-alt: "oklch(0.91 0.018 80)"
  code-surface: "oklch(0.94 0.008 80)"
  border: "oklch(0.85 0.01 80)"
  text-primary: "oklch(0.22 0.02 60)"
  text-secondary: "oklch(0.45 0.02 60)"
  text-tertiary: "oklch(0.55 0.015 60)"
  accent: "oklch(0.45 0.10 155)"
  accent-hover: "oklch(0.44 0.11 155)"
  accent-tint: "oklch(0.45 0.10 155 / 0.10)"
  margin-ink: "oklch(0.40 0.04 40)"
  washi-matcha: "oklch(0.75 0.08 155 / 0.55)"
  washi-vermillion: "oklch(0.78 0.09 30 / 0.55)"
  washi-amber: "oklch(0.78 0.09 65 / 0.55)"
  post-it-yellow: "oklch(0.92 0.10 92)"
  stamp-red: "oklch(0.52 0.16 25)"
  surface-night: "oklch(0.22 0.035 280)"
  surface-alt-night: "oklch(0.28 0.035 280)"
  text-primary-night: "oklch(0.90 0.01 80)"
  text-secondary-night: "oklch(0.68 0.035 70)"
  accent-night: "oklch(0.62 0.10 155)"
  amber-night: "oklch(0.75 0.14 70)"
  amber-muted-night: "oklch(0.65 0.08 70)"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.14em"
  script:
    fontFamily: "Caveat, cursive"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sharp: "0px"
  xs: "3px"
  md: "6px"
spacing:
  hair: "2px"
  thin: "4px"
  narrow: "8px"
  base: "16px"
  wide: "24px"
  broad: "32px"
  spacious: "48px"
  vast: "64px"
  breath: "96px"
  silence: "128px"
components:
  accent-link:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "0"
  accent-link-hover:
    textColor: "{colors.accent-hover}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "8px 0"
  nav-item-active:
    textColor: "{colors.accent}"
  type-tag:
    backgroundColor: "transparent"
    textColor: "{colors.text-tertiary}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  post-row:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "8px 0"
  post-row-hover:
    textColor: "{colors.accent}"
  featured-card:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "24px"
  featured-card-hover:
    backgroundColor: "{colors.surface-alt}"
  code-inline:
    backgroundColor: "{colors.code-surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 5px"
  section-label:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "0"
  margin-note:
    backgroundColor: "transparent"
    textColor: "{colors.margin-ink}"
    typography: "{typography.script}"
    rounded: "{rounded.sharp}"
    padding: "0"
---

# Design System: felipeo.me — Koubou

## 1. Overview

**Creative North Star: "The Koubou — a small workshop on cream paper."**

This is a personal workshop, not a marketing site and never a dev-blog template. The page should read like a notebook page that survived a coffee: cream surface, warm-black ink, soft borders, mono in the captions, a Caveat note in the gutter, the occasional washi-taped feature card or eki-stamp. The Japanese craft DNA — Muji restraint, risograph warmth, ma spacing — is felt through paper, breathing room, and named scale, never announced through CJK glyphs or stereotype iconography. FA is Brazilian and doesn't read Japanese; performative kanji is forbidden.

The site rejects every template tell that personal sites converge on: SaaS-cream landing pages, identical card grids, hero-metric templates, gradient text, "Read more →" affordances, hamburger menus on desktop, dark-mode-by-inversion, newsletter modals. Restraint is the signal. One flower in a vase: the matcha accent shows up sparingly so it still lands when it appears.

**Key Characteristics:**
- Paper before pixels — cream surface (`oklch(0.96 0.012 80)`), never `#fff`.
- Borders, not shadows — 1px lifts cards; shadows belong to things actually pinned (washi tape, polaroids, eki-stamps).
- Marginalia in Caveat — a wink, an aside, never replacing meaning with handwriting.
- Mono for metadata — JetBrains Mono on dates, tags, labels, code, file paths.
- Ma is structure — every gap is a named token, never an arbitrary px.
- Quiet by default — no auto-play motion, no parallax; motion responds to intent.
- Nightfall is designed, not computed — warm indigo with amber lanterns, parallel to day.

## 2. Colors: The Paper-and-Matcha Palette

Tinted neutrals at hue 60–80 (warm cream / warm-black ink) carry roughly 90% of the surface. The matcha accent (hue 155) carries the rest. This is a **Restrained** strategy by design: the accent earns attention by being rare. Nightfall keeps the same hue logic and shifts to indigo (hue 280) surfaces with amber (hue 70) warmth.

### Primary
- **Matcha Ink** (`oklch(0.45 0.10 155)`): the only accent color. Used on prose links, active nav indicator (`[aria-current="page"]`), `:focus-visible` outlines, the active code-group tab, the current-section ToC mark, pagination links, footnote refs, the blockquote rule, the skip link, and embed CTAs. **Nowhere else.**
- **Matcha Ink (Hover)** (`oklch(0.44 0.11 155)`): one notch deeper for `:hover` and pressed states.
- **Matcha Tint** (`oklch(0.45 0.10 155 / 0.10)`): translucent halo for selection/highlight contexts. Never a flat fill.

### Neutral
- **Cream Surface** (`oklch(0.96 0.012 80)`): the page. Warm, not white. Every other surface is a tonal cousin.
- **Cream Surface Alt** (`oklch(0.91 0.018 80)`): footer, alt sections, featured-card bed, code blocks where the page surface would be too pale.
- **Code Surface** (`oklch(0.94 0.008 80)`): inline `<code>` and fenced blocks. A breath darker than the page, never gray.
- **Paper Border** (`oklch(0.85 0.01 80)`): 1px structural dividers and card edges. Barely visible; the lift comes from the line, not a shadow.
- **Warm-Black Ink** (`oklch(0.22 0.02 60)`): body text and headings. Never `#000`.
- **Warm Gray Ink** (`oklch(0.45 0.02 60)`): metadata, captions, timestamps, secondary text.
- **Warm Pale Ink** (`oklch(0.55 0.015 60)`): placeholders, disabled, and decorative tag borders.
- **Margin Ink** (`oklch(0.40 0.04 40)`): default Caveat color in gutters; warmer than body text by hue, lower in chroma to read as ink, not accent.

### Marginalia Atoms (personality, never meaning)
These hues live only on brand atoms — washi tape strips, post-its, eki-stamps. Always semi-transparent so paper grain shows through. They never carry information, only voice.
- **Washi · Matcha** (`oklch(0.75 0.08 155 / 0.55)`): default tape on featured cards.
- **Washi · Vermillion** (`oklch(0.78 0.09 30 / 0.55)`): alternate tape, secondary featured.
- **Washi · Amber** (`oklch(0.78 0.09 65 / 0.55)`): tertiary tape, polaroid corners.
- **Post-It Yellow** (`oklch(0.92 0.10 92)`): About-page sticky notes, Caveat copy inside.
- **Stamp Red** (`oklch(0.52 0.16 25)`): hanko / eki seals; never on body text.

### Nightfall (Warm Indigo + Amber Lantern)
Designed parallel to day, not inverted from it. Triggered by `html[data-theme="nightfall"]` (also auto from `prefers-color-scheme: dark`). Surfaces shift to indigo (hue 280); the matcha accent brightens to L=0.62; amber tokens (hue 70) light up only here, like chōchin paper-lanterns in the gutter.
- **Indigo Surface** (`oklch(0.22 0.035 280)`): page background; deep indigo, never black.
- **Indigo Surface Alt** (`oklch(0.28 0.035 280)`): elevated surfaces, footer.
- **Off-White Ink** (`oklch(0.90 0.01 80)`): body text in nightfall. Warm, not bluish.
- **Amber Ink** (`oklch(0.68 0.035 70)`): metadata, captions in nightfall.
- **Matcha Lantern** (`oklch(0.62 0.10 155)`): nightfall accent — same hue, brightened.
- **Lantern Amber** (`oklch(0.75 0.14 70)`): nightfall-only warmth carrier on the toggle and hover halos.

### Named Rules

**The One-Flower Rule.** No page renders more than three matcha-accent elements simultaneously in the viewport. `:focus-visible` rings are exempt — accessibility never counts against accent budget. If a fourth element wants accent, something else gives it up.

**The Tinted-Neutral Rule.** No `#000` and no `#fff` anywhere. Every neutral is tinted toward the warm hue family (60–80 day, 280 nightfall). A cool gray on this page would read as foreign object.

**The Marginalia-Never-Means Rule.** Washi tape, polaroid frames, post-it yellow, hanko red, and other atom hues are personality, not information. Never use them to indicate state, type, or status. The reader can ignore every marginalia hue and lose nothing.

## 3. Typography

**Display Font:** Sora (with Sora Fallback / system-ui).
**Body Font:** Sora (same family carries reading; weight contrast does the work).
**System Font:** JetBrains Mono (variable, with JetBrains Mono Fallback / ui-monospace) — dates, tags, file paths, code, section labels.
**Marginalia Font:** Caveat (with Caveat Fallback / Bradley Hand) — gutter notes, polaroid captions, post-its.
**Display Alt (Latin only):** Zen Maru Gothic Medium 500 — soft-rounded labels for eki-stamps ("KYOTO STN", "OSAKA"). The Japanese subset (工, 房, 間) is loaded as a font-design artifact for the system's name plate, never rendered to readers.

**Character:** A geometric sans (Sora) holds the prose with quiet weight contrast; a coding monospace (JetBrains Mono) speaks for the metadata; a handwriting (Caveat) leans into the margins. Three voices, three jobs, no trading.

### Hierarchy
- **Display** (Sora 800, `clamp(1.875rem, 5vw, 3rem)`, line-height 1.1, tracking -0.02em): homepage hero only — the bold typographic statement that lands the 5-second smile.
- **Headline** (Sora 600, `clamp(1.5rem, 4vw, 1.875rem)`, line-height 1.3, tracking -0.01em): h2 inside posts, page titles.
- **Title** (Sora 500, 1.25rem, line-height 1.5): h3 / h4, featured-card titles, section sub-headers.
- **Body** (Sora 400, 1rem, line-height 1.7, no tracking): all reading prose. Cap line length at **62ch** in `.prose`; never exceed 75ch on any text surface.
- **Label** (JetBrains Mono 500, 0.8125rem, UPPERCASE, letter-spacing 0.14em): section labels (`FEATURED ——`, `RECENT ——`, `CURRENTLY ——` — the trailing em-dashes are part of the label and are typographic atoms, not the AI-tell em-dash banned in copy), tags, dates, file paths.
- **Script** (Caveat 400, ~1.125rem, rotated ±5°): margin notes only. Always slightly off-axis; never used for content the reader needs to parse.

### Named Rules

**The Three-Faces Rule.** Sora carries personality and prose; JetBrains Mono carries metadata; Caveat carries marginalia. Faces never trade jobs. Caveat in body copy is forbidden. Mono in headlines is forbidden. Sora on a date is forbidden.

**The 62ch Rule.** Reading prose is capped at 62ch (`.prose` max-width). Sustained reading lives in the comfort zone; longer measures degrade focus, shorter ones break rhythm.

**The Section-Label Em-Dash Exception.** Body copy bans em dashes (see Do's and Don'ts). Section labels keep them — `FEATURED ——`, `RECENT ——` — because the trailing em-dashes are a typographic glyph, part of the label's silhouette, not punctuation in a sentence. They appear only in mono uppercase labels.

## 4. Elevation

**The koubou is flat by default.** Surfaces lift via 1px borders and tonal alt surfaces (`--color-surface-alt`), not via shadow. Where a shadow does appear, it earns the right by representing a physical fact about the element: a featured card hovers because the cursor pinned it, a polaroid casts a shadow because it's taped to the page, an eki-stamp stamps because it's pressed into paper.

### Shadow Vocabulary

- **Card Rest** (`box-shadow: 0 1px 3px oklch(0 0 0 / 0.04)`): the breath under a featured card at rest. Almost invisible; signals "this is liftable" without lifting.
- **Card Hover** (`box-shadow: 0 4px 12px oklch(0 0 0 / 0.08)`): featured-card on `:hover`, paired with `translateY(-2px)`. The card responds to the cursor; reads as pinned, not floating.
- **Polaroid Pin** (`0 2px 5px rgba(0,0,0,0.10), 0 6px 18px rgba(0,0,0,0.08)`): physical-object shadow on washi-taped polaroids and pinned items. The two-stop stack reads as a near shadow plus a diffuse ambient — like an actual photograph pressed onto a page.
- **System-1 Drop** (`3px 3px 0 #1a1a1a`): 1-bit retro Mac drop on the System-1 Currently widget. Intentional skeuomorph; only this widget uses it.

### Named Rules

**The Borders-Not-Shadows Rule.** Containers lift via 1px borders and surface-alt tints. Shadows are reserved for objects that should feel physically pinned, taped, stamped, or hovered. A "card with a shadow" without a physical metaphor is forbidden.

**The Glassmorphism Veto.** No `backdrop-filter: blur()` as decoration. No translucent glass cards. Translucency exists only on washi-tape semi-transparency (where the paper grain is the point) and on `--color-accent-tint` (where the alpha is the structural feature). Decorative blur is never the answer.

## 5. Components

### Buttons (Accent Link, not a Button)
The site has no filled buttons in the reading surface. The primary action is **AccentLink** — text in matcha (`oklch(0.45 0.10 155)`) with a 1px underline at 0.15em offset. Hover deepens to `--color-accent-hover` and the underline thickens by an imperceptible hair. **The reading experience contains zero button chrome.** Filled `<button>` elements live only inside Svelte islands (search, code-copy, the Nunotchi mini-game) and the nightfall toggle.

- **Shape:** sharp-edged text (rounded `0px`); never pill, never outlined card.
- **Primary (AccentLink):** matcha text + matcha 1px underline at 0.15em offset; transition `color 150ms ease-out`.
- **Hover / Focus:** color shifts to `--color-accent-hover`. Focus shows a `2px solid var(--color-accent)` outline at `2px` offset — never removed, never `outline: none` without an equivalent visible replacement.

### Type Tags (kb-tag)
Optional post-type label rendered only when frontmatter has `type:`. Mono caps with a subtle border, never a pill.
- **Style:** JetBrains Mono 500 at 0.8125rem, letter-spacing 0.14em, 1px border in `--color-text-tertiary`, radius `3px`, `2px 6px` padding.
- **State:** decorative only — `aria-hidden="true"` when redundant with surrounding context. Never carries semantic state via color.
- **Forbidden:** pill shape (`border-radius: 999px`), filled background, accent color.

### Featured Cards
Surface-alt bed, sharp-cornered (`0px`), 1px border, with a washi-tape strip pinned at one corner. Tape side alternates by index (left/right) in the `FeaturedGrid`; tape tone defaults to matcha and shifts to vermillion on every other card.
- **Corner Style:** `0px` (sharp paper edge). Never rounded.
- **Background:** `--color-surface-alt`.
- **Border:** `1px solid --color-border`.
- **Shadow Strategy:** `--shadow-card` at rest, `--shadow-card-hover` + `translateY(-2px)` on hover (transition 200ms ease-out). Reduced-motion disables the lift.
- **Internal Padding:** `--ma-wide` (24px).
- **Anchor target:** the entire card is one `<a>` with `aria-labelledby={titleId}` so screen readers collapse the link name to the post title (recent harden pass).

### Post Rows
Tabular post-list row: title + optional `TypeTag` + JetBrains Mono date, separated by 1px dotted dividers. Whole row clickable. No card chrome.
- **Style:** `display: grid` with title taking the flex column, tag and date pinned to the end. Padding `--ma-narrow` block, dotted top border in `--color-border`.
- **Hover / Focus:** title color shifts to `--color-accent` (the `--color-accent-hover` deepening only happens on `.prose a:hover` since rows aren't prose). Transition 150ms ease-out.
- **Mobile (<480px):** collapses to single column; title on top, tag and date stacked below.
- **Anchor target:** `aria-labelledby={titleId}` (recent harden pass).

### Inputs / Search
Pagefind-backed search input on `/search` and the 404 page.
- **Style:** 1px border in `--color-border`, sharp corners, mono font, surface background.
- **Focus:** standard accent outline (`2px solid var(--color-accent)` at `2px` offset).
- **Empty state:** "Nenhum resultado para [query]" + link to all posts and homepage. Never a sad illustration; never "Try again."

### Navigation
Persistent top nav: `fa.` wordmark (Sora 700, period in `--color-accent`) + page links (Home / Posts / About / Search) + nightfall toggle (`◐` glyph).
- **Style:** Sora body weight, secondary text color at rest, `--color-accent` on `[aria-current="page"]`.
- **Active state:** color only — no underline, no background pill, no chrome. The accent does the indicating.
- **Mobile:** identical horizontal layout. **No hamburger menu, ever.** If space tightens, link labels abbreviate before the layout collapses.

### Margin Notes (Signature)
Caveat copy in the page gutters, rotated ±5° off-axis, drawn in `--color-margin-ink`. On viewports ≥1280px, the left note translates outside the centered hero column to read like a hand-written marginal annotation; below 768px, margin notes are hidden because at that width they read as stray labels rather than notes. The notes live inside a real `<aside>` element with `aria-label`, never `display: contents`, and never `<div>` (recent harden pass).

### Section Labels (Signature)
`FEATURED ——`, `RECENT ——`, `CURRENTLY ——`, `ABOUT ——`. JetBrains Mono 500 at 13px, UPPERCASE, letter-spacing 0.14em, secondary text color, with literal trailing em-dashes as a typographic glyph. The em-dashes are part of the label's silhouette and are an exception to the body-copy em-dash ban. Section labels carry the section-label tone — they never replace headings, only frame them.

### Currently Widget · System-1 Paper (Signature)
The single skeuomorphic component on the site. A paper-edition System-1 desktop (dotted-grid floor via `radial-gradient` 4×4px) holds windows for "Currently — felipeo," Now Playing, an alert dialog, Reading.txt (rotated -1.5°), and the **Nunotchi.app** mini-game. 1.5px black border + `3px 3px 0 #1a1a1a` drop shadow. This is the home page's signature gracejo; no other component on the site uses System-1 chrome.

**Local-palette exception.** The widget runs on its own `--ink` and `--paper` custom properties scoped to `.widget-frame`, parallel to the global tokens but intentionally sharper: ink is set deeper (`oklch(0.18 0.02 80)` vs body `0.22`) and paper is set brighter (`oklch(0.97 0.012 82)` vs surface `0.96`) so the 1-bit chrome reads with more contrast than the surrounding reading surface. Nightfall mirrors this with its own pair (`oklch(0.92 0.02 80)` ink on `oklch(0.22 0.035 280)` paper). These locals are deliberately **not** aliased to `--color-text-primary` / `--color-surface`; aliasing would soften the System-1 silhouette and erase the only place on the site where ink and paper want to feel pressed, not printed. Every `--ink-secondary`, `--ink-tertiary`, and `--ink-soft` derives from the local pair via `color-mix`, so the widget stays self-contained — change `--ink` and `--paper`, the rest follows. This exception is the only sanctioned divergence from the global color tokens; the rule everywhere else remains *use the token, never re-declare it*.

## 6. Do's and Don'ts

### Do:
- **Do** keep the matcha accent on ≤3 simultaneous elements per viewport (the One-Flower Rule). Focus rings exempt.
- **Do** write all colors in `oklch()` and tint neutrals to hue 60–80 (day) or 280 (nightfall).
- **Do** lift surfaces with `1px solid var(--color-border)` and `--color-surface-alt`; reserve shadows for things physically pinned, taped, or stamped.
- **Do** use Sora for prose, JetBrains Mono for metadata, Caveat strictly for marginalia. Three faces, three jobs.
- **Do** snap every gap to a named `--ma-*` token. If a value isn't named, it doesn't ship.
- **Do** cap reading prose at 62ch (`.prose` max-width).
- **Do** rotate margin notes ±5° and place them in real `<aside>` landmarks with descriptive `aria-label`.
- **Do** wrap card / row anchors with `aria-labelledby` pointing at the title id so screen readers read just the title, not the whole card.
- **Do** design nightfall as a parallel palette (warm indigo + amber lantern), not as an inversion or auto-`filter: invert(1)`.
- **Do** respect `prefers-reduced-motion: reduce` at every motion tier; the nightfall toggle and page transitions degrade to instant swap.
- **Do** verify WCAG 2.1 AA contrast on every text/surface pair in both modes before shipping.

### Don't:
- **Don't** ship `#000` or `#fff` anywhere — they read as foreign objects on cream.
- **Don't** put kanji (or any CJK glyph) in surface UI. The koubou idea lives in design DNA, never in performative typography. (FA is Brazilian; visible kanji is the bazinga rule violation.)
- **Don't** use Caveat for body copy, Mono for headlines, or Sora for dates. Three faces, three jobs.
- **Don't** add SaaS-template patterns: card grids of identical icon+heading+text tiles, hero-metric blocks, gradient-text headlines, "Read more →" affordances, Substack/Medium clones.
- **Don't** add hamburger menus on desktop (or anywhere — the link list scales mobile-first).
- **Don't** use side-stripe `border-left`/`border-right` >1px as an accent on cards, callouts, or alerts. Rewrite with a full border, a tint, or a leading icon.
- **Don't** apply `background-clip: text` gradients to type. Solid color only; emphasis via weight or size.
- **Don't** decorate with `backdrop-filter: blur()`. Glassmorphism is never the answer here.
- **Don't** modal-as-first-thought. The site has zero modals; recovery flows (404, no-results) are inline.
- **Don't** auto-play motion or parallax. Motion is reactive — a hover, a click, a toggle — never ambient.
- **Don't** use newsletter modals, cookie banners, tracking beacons, or any anxiety-inducing chrome. Trust is manifested as absence.
- **Don't** write em-dashes (or `--`) in body copy or UI strings — typographic AI-tell. Use commas, colons, semicolons, periods, or parentheses. The trailing `——` in section labels is the only sanctioned use, because there it's a glyph silhouette, not punctuation.
- **Don't** ship "in the realm of," "delve into," inflated symbolism, or rule-of-three flourishes. All copy follows `humanizer` anti-AI patterns.
- **Don't** synthesize a "dark mode" by inverting day-mode tokens. Nightfall has its own designed palette.
- **Don't** display empty-state placeholder cards or "coming soon" badges. The space contracts; absence is graceful.
