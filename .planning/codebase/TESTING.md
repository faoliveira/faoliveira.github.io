# Testing

**Analysis Date:** 2026-05-15

## Framework

**Vitest 4.x** is the only test runner. Config: `vitest.config.ts`.

- Default environment: **jsdom** (29.x) — covers most module and island tests
- Per-file override: add `// @vitest-environment node` at the top of a file to switch to Node (used by tests that touch the file system or Node-only APIs like satori)
- Path aliases mirror `tsconfig.json` so tests import via `@modules/...` etc.
- No coverage thresholds configured — coverage is informational, not gated

**Accessibility:** `@axe-core/cli` runs against the live dev server via `bun run test:a11y` — not part of the unit suite.

## Layout

Tests are **co-located** with the module they cover, under a `__tests__/` subdirectory:

```
src/modules/<capability>/
├── index.ts
├── <internal>.ts
└── __tests__/
    └── <internal>.test.ts
```

**Count:** ~36 test files across modules and islands.

This makes the test the closest neighbor of the code under test, and a refactor that moves a module moves its tests with it.

## Mocking

**Astro Content Collections:**
- Tests `vi.mock('astro:content', ...)` and use `vi.mocked()` for type-safe mock helpers
- `src/__mocks__/astro-content.ts` is the Vitest alias target for `astro:content` and provides a shared mock surface (`getCollection`, `getEntry`)

**Storage / Browser globals:**
- Manual storage stubs implemented as small classes (e.g. `MemoryStorage`) so tests can assert on read/write call patterns, not just final values
- Browser globals injected via `vi.stubGlobal()` (e.g. `localStorage`, `matchMedia`, `IntersectionObserver`)

**Module mocks:**
- `vi.mock()` with factory functions for ES module mocks
- Spies via `vi.spyOn()` for partial mocking of real implementations

## Test Patterns

Two dominant styles:

### 1. Pure transform / function tests

Most modules export pure functions: schema validators, date formatters, slug normalizers, OG image template helpers. Tests import the function, feed it inputs, assert on outputs. No DOM, no async.

### 2. Source-as-string snapshot / contract tests

Some tests use Vite's `?raw` import suffix to load a source file as a string and assert on its content:

```ts
import componentSource from '../Component.astro?raw'

it('locks the wrapper class', () => {
  expect(componentSource).toContain('class="wrapper"')
})
```

This is used to lock CSS class names and markup contracts that downstream styles depend on. It catches the case where a refactor accidentally renames a hook class.

## Lifecycle Hooks

- `beforeEach(() => vi.clearAllMocks())` — reset call history between tests
- `afterEach(() => vi.restoreAllMocks())` — restore original implementations after spies
- Set up fresh storage / globals in `beforeEach` so tests are order-independent

## What Gets Tested

**Always tested:**
- Schema validators (Zod schemas in `src/content/config.ts` and module input shapes)
- Pure transforms (slug generation, date normalization, derived field computation)
- Module barrels — the public API surface of each module
- OG image template generators (regression-prone Satori HTML)
- RSS / sitemap generation logic
- State persistence (localStorage read/write/reset cycles in islands)

**Not tested:**
- Static Astro markup (no value testing what the template renderer already validates)
- Third-party library internals — wrapper modules are tested; the wrapped library is trusted
- Visual presentation — covered by manual review and the design-system page

## Running Tests

```bash
bun run test              # vitest run (one-shot)
bun run check             # astro check (TypeScript validation)
bun run test:a11y         # axe-core against live dev server
```

CI runs `bun run test` plus `astro check` on every push (see `.github/workflows/deploy.yml`).

## Gaps / Notes

- No explicit coverage thresholds — coverage is not enforced, so untested code can ship
- No end-to-end browser tests — accessibility is the only browser-level check
- Snapshot tests are avoided in favor of explicit assertions; the `?raw` pattern is preferred over `toMatchSnapshot()` for markup contracts

---

*Testing analysis: 2026-05-15*
