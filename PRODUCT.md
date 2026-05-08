# Product

## Register

brand

## Users

**Primary: the maker himself.** Felipe — Senior Data Analyst, serial tinkerer, sole maintainer. If opening felipeo.me doesn't pass the pride test for him, nothing else matters. The redesigned container creates the desire to write and share — the space inspires content, not the other way around.

**Secondary: the curious stranger.** Someone who clicks a shared link, lands on the homepage during a commute, and smiles within five seconds. A reader, a designer, an employer, or a fellow tinkerer — never targeted, only welcomed. Casual browsing on personal time, not task-driven enterprise use.

There is no mass audience target, no business model, no growth metric, no analytics theatre. The audience is FA and the occasional stranger.

## Product Purpose

Personal website and workshop (koubou) at felipeo.me. A place where a multi-interest tinkerer makes things and shares them with disproportionate care: writing, projects, visual essays, current obsessions. The site is tended, not optimized.

The container quality IS the credential. Visitors leave with a clear, memorable impression of the person behind the work without needing a resume or a list of skills. The design itself demonstrates the craft the site writes about.

This is a redesign of an existing Hugo/PaperMod site. The migration's whole point is to escape template-blog sameness and replace it with something distinctive enough that "this is beautiful" lands as a real reaction, not a polite one.

## Brand Personality

Restrained, typographic, handcrafted. **One flower in a vase** — the accent stays sparse so it lands when it appears. **Muji meets risograph**: cream + wood + ink palette, one warm accent, subtle paper texture. **Japanese typographic craft as design DNA** — informed but not imitative; felt by everyone, recognized by those who know. Anti-pasteurization with intention: warm through imperfection, human on purpose. The site rewards attention without demanding it.

**Nightfall mode** is the same space at evening time — deep indigo and warm amber — not inverted day mode. The mode shift is atmospheric, not chromatic gymnastics.

## Anti-references

- **Hugo/PaperMod sameness.** The before-state. Indistinguishable developer-blog template aesthetic. Escaping this is the whole reason for the redesign.
- **Medium / Substack clones.** Content-mill chrome, reading-time-as-engagement-bait, "claps."
- **SaaS template patterns.** Gradient heroes, identical card grids, hero-metric templates (big number + small label + supporting stats), generic dashboard clichés.
- **Performative Japanese.** No kanji in the visible logo or branding — FA isn't Asian and doesn't speak Japanese. Influence lives in typography, spacing, and *ma*, never in surface decoration.
- **Engagement optimization.** No newsletter pop-ups, no related-posts walls, no "you might also like," no share-counters.
- **Corporate apology copy.** 404s, errors, and empty states stay human and in voice.

## Design Principles

- **Practice what you preach.** The site itself demonstrates the craft it writes about. Design quality IS the credential.
- **Show, don't tell.** Let the work speak; meta-commentary minimal.
- **Expert confidence.** No hedging, no filler. Every element earns its place — every word too.
- **Restraint as signal.** Whitespace, silence, and absence are deliberate. *Ma* is structural, not decorative.
- **Static-first honesty.** Zero JS by default. Interactive islands hydrate only when they earn the JavaScript. The site is what it is — no dynamism for show.
- **Visual-first when it earns it.** Data essays open with spectacle (chart, image), methodology scrolls below. Two acts. Quiet posts get quiet treatment.
- **Per-type visual differentiation.** Posts vary by type (reflection, data-essay, hardware build, project) — same design system, different emphasis. One template that flexes, not parallel grids that compete.
- **Pride over polish.** Ship three exceptional things, not ten "good enough" ones.

## Voice

Copy passes two filters: (1) humanizer anti-AI patterns — no inflated symbolism, no rule-of-three reflex, no negative parallelisms, no AI vocabulary words, no vague attributions; (2) João Baldi Jr's tone — direct, unhedged, dry warmth, sentences with weight.

**No em dashes** in body copy or headings. Use commas, colons, semicolons, periods, or parentheses instead. The site's words sound like a person wrote them on purpose.

**Language split.** Functional UI strings (aria-label, button text, nav labels, system messages) stay English. Long-form content can be Portuguese or English depending on the post. UI doesn't switch with content.

## Accessibility & Inclusion

- Semantic HTML with ARIA landmarks; proper heading hierarchy.
- WCAG 2.1 AA contrast targets in both day and nightfall modes — 4.5:1 body, 3:1 large text.
- Forced-colors support for Windows High Contrast Mode.
- `prefers-reduced-motion` respected — animations off, not weaker.
- Fully keyboard-navigable; visible focus indicators on every interactive element.
- No decorative motion without purpose. Scroll-driven entrance animations are subtle and skippable.
- Images carry meaningful alt text or are explicitly marked decorative.
