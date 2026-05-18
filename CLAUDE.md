# CLAUDE.md — felipeo.me

Personal blog (felipeo.me) — Astro 6, TypeScript strict, Bun, Vitest. Hosted on GitHub Pages.

## Commands

```bash
bun install                # install deps
bun run dev                # dev server (localhost:4321)
bun run build              # production build (dist/)
bun run preview            # preview production build
bun run test               # vitest
bun run check              # astro check (types)
```

## Architecture Principles

Follow Deep Modules (John Ousterhout): small public APIs, complexity hidden inside.

- **Static-first.** No SSR, no auth, no database unless explicitly required.
- **Organize by capability**, not by layer: `src/modules/content/`, `src/modules/seo/`, etc.
- **Pages stay thin.** Transforms, normalization, and vendor logic go in modules.
- **Content is a first-class domain.** Use Astro Content Collections with explicit schemas. Compute derived fields in one place.
- **Smallest island.** Add client-side JS only for isolated, high-value interaction. Prefer HTML/CSS.
- **Wrap external integrations** behind internal modules — never call third-party APIs from pages.

## Code Style

- TypeScript strict, no `any`.
- Prefer fewer dependencies — check if Astro/TS already solves it.
- Test transforms, schemas, and critical paths. Don't over-test static markup.
- Use OKLCH for colors; follow the token system in `src/styles/tokens.css`.
- Respect the Ma (間) spacing system — no arbitrary pixel values.

## Harness Rules

- **Plan first.** For any non-trivial task (3+ steps or architectural decisions), enter plan mode before coding. If something goes sideways, stop and re-plan.
- **Use subagents.** Offload research, exploration, and parallel analysis to subagents. One focused task per subagent.
- **Verify before done.** Never mark a task complete without proving it works. Run tests, check logs, ask "would a staff engineer approve this?"
- **Demand elegance.** For non-trivial changes, pause and ask "is there a more elegant way?"
- **Fix bugs autonomously.** When given a bug report: fix it. Point at logs, errors, failing tests — then resolve them.
- **Simplicity first.** Make every change as simple as possible. Impact minimal code. Find root causes — no temporary fixes.

## Quality Gates (run before committing)

```bash
bun run check    # type check — zero errors
bun run test     # vitest — all pass
bun run build    # production build succeeds
```

## Documentation Contract

**When you change anything in this repo that affects how the site works, you MUST update the corresponding documentation in `~/Documents/1_Projects/personal_website/koubou_docs/`.**

Examples:
- New component or embed → update `site/autoria.md`
- New terminal command or Nunotchi mechanic → update `nunotchi/terminal.md` or `nunotchi/gameplay.md`
- New sprite/sound asset → update `nunotchi/production.md`
- New deploy step or infra change → update `nunotchi/deploy.md`
- Design token or layout change → update `project/design-system.md`

The docs live outside this repo at `~/Documents/1_Projects/personal_website/koubou_docs/`. Do not create a `docs/` folder inside this repo.

## Boundaries

**Always:**
- Respect `.gitignore` — never commit or push ignored files.
- Read `koubou_docs/` for full documentation before making structural decisions.

**Never:**
- Introduce enterprise patterns without concrete need.
- Add SSR, sessions, cron jobs, or background workers.
- Commit secrets, `.env` files, or AI tool configs.
- Touch folders outside this repo (`../gds_loom/`, `../old_images_generator/`, etc.) unless explicitly asked.

## Project Context

BMAD workflow artifacts (stories, sprint-status, etc.) live outside this repo at:
`~/Documents/1_Projects/personal_website/_bmad-output/` (outputs) and
`~/Documents/1_Projects/personal_website/_bmad/` (inputs).
This repo contains only the site source code that ships to production.