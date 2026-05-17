# Coding Conventions

**Analysis Date:** 2026-05-15

## Tooling

**Formatter / Linter:** Biome 2.x — single source of truth for both formatting and lint rules. Config: `biome.json`.

- Indent: 2 spaces
- Line width: 100 chars
- `noConsole`: **error** — `console.*` calls require explicit `// biome-ignore` suppression with a reason
- `noExcessiveCognitiveComplexity`: **error** — keeps individual functions narrow
- Import ordering enforced (see recent commit `787d159 style: biome import ordering on cyberdeck lib modules`)

**Dead Code:** `knip` (config: `knip.json` if present, otherwise defaults) — flags unused exports and dependencies. Runs in pre-commit.

**Pre-commit Pipeline:** `lefthook` (config: `lefthook.yml`) runs in order:
1. Biome lint + format check
2. `knip` (dead code)
3. `scripts/loc-guard.sh` — enforces 600-line ceiling per file
4. Astro type-check (`astro check`)
5. `impeccable` — additional quality gate

## TypeScript

- **Strict mode** via `astro/tsconfigs/strict` — no `any`, no implicit returns
- **Explicit return types** on all exported functions
- **Path aliases** for clean imports: `@modules/*`, `@components/*`, `@layouts/*`, `@styles/*`, `@islands/*`, `@assets/*`
- Local relative imports only inside a single module; cross-module imports go through the alias

## File Naming

| Kind | Convention | Example |
|------|------------|---------|
| TypeScript module file | `kebab-case.ts` | `src/modules/seo/og-image.ts` |
| Astro component | `PascalCase.astro` | `src/components/PostCard.astro` |
| Svelte island | `PascalCase.svelte` | `src/islands/CurrentlyWidget.svelte` |
| Test file | `<name>.test.ts` under `__tests__/` | `src/modules/seo/__tests__/og-image.test.ts` |
| Style file | `kebab-case.css` | `src/styles/design-system.css` |

## Identifier Naming

| Kind | Convention |
|------|------------|
| Functions | `camelCase` |
| Variables | `camelCase` |
| Constants (module-level, exported) | `SCREAMING_SNAKE_CASE` |
| Types / Interfaces | `PascalCase` |
| Astro / Svelte components | `PascalCase` |

## Module Structure (Deep Modules)

Every capability under `src/modules/` follows the **barrel pattern**:

```
src/modules/<capability>/
├── index.ts          # barrel — single public API surface
├── <internal>.ts     # implementation files
└── __tests__/        # co-located tests
    └── <name>.test.ts
```

**Rule:** Pages and other modules import only from the barrel (`@modules/seo`), never from internal files (`@modules/seo/og-image`). The barrel hides implementation; the internal files are private to the module.

This enforces John Ousterhout's deep-modules principle: small public APIs, complexity hidden inside. Project-level guidance is in `CLAUDE.md`.

## Error Handling Patterns

Three patterns dominate based on the operation's criticality:

1. **Swallow-and-continue** — for non-critical I/O (e.g. analytics writes, optional file reads). The function catches, logs nothing or logs at low severity, and returns a safe default. Used when failure should never block the user-visible path.
2. **Guard-and-return** — for null / undefined inputs at module boundaries. Early return with a typed default value, no exception thrown.
3. **Validate-then-reset** — for state persistence (e.g. localStorage reads in islands). If parsed state fails a runtime schema check, clear the slot and return the default state. Prevents poisoned state from a previous version.

No global try/catch at the page level — Astro's static build will fail loudly if any module throws during render.

## Logging / `console`

`console.*` is a lint error. To emit a console call you must add a Biome ignore with a reason:

```ts
// biome-ignore lint/suspicious/noConsole: <reason>
console.warn(message)
```

The only suppression in source is in `CurrentlyWidget.svelte` (a development-only debug path).

## File Size

`scripts/loc-guard.sh` enforces a **600-line maximum** per source file. Pre-commit blocks any commit that breaks the cap. This is the structural pressure that keeps modules deep — once a file approaches the cap, the team extracts a sub-module rather than letting the file grow.

See the recent extractions: `903dbf5 refactor: extract deep modules for workshop search and currently widget` and `37db6c5 feat(currently): rescue extracted lib modules + pocket-organizer mobile`.

## Imports

- Always use the path alias when crossing module boundaries (`@modules/content` not `../../modules/content`)
- Inside a single module, relative imports are fine and preferred
- Biome enforces import grouping/sorting (external → aliased → relative)

## Comments

- Default to **no comments**. Names and structure carry intent.
- Add a one-line comment only when the **why** is non-obvious (hidden constraint, workaround, surprising invariant).
- Never use comments to describe what the code does — Biome and TypeScript already enforce that names are clear.

## Astro / Svelte-Specific

- **Pages stay thin** (`src/pages/`) — they import from `src/modules/`, render layouts, and pass props. Transforms, normalization, and vendor logic live in modules.
- **Smallest island** — client-side JS only for isolated high-value interaction. Prefer HTML/CSS first.
- **Content is a domain** — use Astro Content Collections with explicit Zod schemas in `src/content/config.ts`. Derived fields are computed in one place, not scattered through templates.
- **External integrations are wrapped** — never call third-party APIs from a page. Wrap them in a module under `src/modules/`.

---

*Conventions analysis: 2026-05-15*
