# CLAUDE.md

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

## Working Style

- **Plan first.** For any non-trivial task (3+ steps or architectural decisions), enter plan mode before coding. If something goes sideways, stop and re-plan — don't keep pushing.
- **Use subagents.** Offload research, exploration, and parallel analysis to subagents to keep the main context clean. One focused task per subagent.
- **Verify before done.** Never mark a task complete without proving it works. Run tests, check logs, ask "would a staff engineer approve this?"
- **Demand elegance.** For non-trivial changes, pause and ask "is there a more elegant way?" Skip for simple, obvious fixes.
- **Fix bugs autonomously.** When given a bug report: fix it. Point at logs, errors, failing tests — then resolve them. Zero hand-holding needed.
- **Capture lessons.** After any correction from the user, update `_bmad-output/project_knowledge/lessons.md` with the pattern to prevent repeating it.
- **Simplicity first.** Make every change as simple as possible. Impact minimal code. Find root causes — no temporary fixes.

## Boundaries

**Always:**
- Respect `.gitignore` — never commit or push ignored files (including `_bmad-output/`, `_bmad/`, `docs/`, `.claude/`, `.agent/`).
- Read `_bmad-output/project-context.md` for full architectural rules when making structural decisions.

**Never:**
- Introduce enterprise patterns without concrete need.
- Add SSR, sessions, cron jobs, or background workers.
- Commit secrets, `.env` files, or AI tool configs.
