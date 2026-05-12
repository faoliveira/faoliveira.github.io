// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import footerSource from "@components/Footer.astro?raw";
import navSource from "@components/Nav.astro?raw";
import nightfallToggleSource from "@components/NightfallToggle.astro?raw";
import paginationSource from "@components/Pagination.astro?raw";
import searchBoxSource from "@components/SearchBox.astro?raw";
import skipLinkSource from "@components/SkipLink.astro?raw";
import baseLayoutSource from "@layouts/BaseLayout.astro?raw";
import { describe, expect, it } from "vitest";

const cssSource = (relPath: string) =>
  readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf8");

const tokensSource = cssSource("../../../styles/tokens.css");
const nightfallSource = cssSource("../../../styles/nightfall.css");
const animationsSource = cssSource("../../../styles/animations.css");
const globalSource = cssSource("../../../styles/global.css");

describe("Accessibility sweep — Story 1.18 invariants", () => {
  it("SearchBox input has role=combobox and aria-expanded (AC #1)", () => {
    // Astro attribute order is not guaranteed, so assert presence on the input declaration.
    const inputBlock = searchBoxSource.match(/<input[\s\S]*?\/>/);
    expect(inputBlock, "search-input declaration").not.toBeNull();
    expect(inputBlock?.[0]).toMatch(/role="combobox"/);
    expect(inputBlock?.[0]).toMatch(/aria-expanded="false"/);
  });

  it("SearchBox JS toggles aria-expanded when results show / hide (AC #1)", () => {
    expect(searchBoxSource).toMatch(/aria-expanded['"]?,\s*['"]true['"]/);
    expect(searchBoxSource).toMatch(/aria-expanded['"]?,\s*['"]false['"]/);
  });

  it("Pagination has aria-current=page on the current-page indicator (AC #1)", () => {
    expect(paginationSource).toMatch(/aria-current="page"/);
  });

  it("BaseLayout sets lang=en on the html element (AC #1)", () => {
    expect(baseLayoutSource).toMatch(/lang = ["']en["']/);
    expect(baseLayoutSource).toMatch(/<html lang=\{lang\}/);
  });

  it("SkipLink targets #main-content (AC #1, #5)", () => {
    expect(skipLinkSource).toMatch(/href="#main-content"/);
  });

  it("Nav has aria-label='Main navigation' (AC #1)", () => {
    expect(navSource).toMatch(/<nav aria-label="Main navigation">/);
  });

  it("Footer social nav has aria-label='Social links' (AC #1)", () => {
    expect(footerSource).toMatch(/<nav aria-label="Social links"/);
  });

  it("NightfallToggle has role=switch and aria-label (AC #1)", () => {
    expect(nightfallToggleSource).toMatch(/role="switch"/);
    expect(nightfallToggleSource).toMatch(/aria-label="Nightfall mode"/);
  });

  it("global :focus-visible rule uses --color-accent + 2px outline + 2px offset (AC #5)", () => {
    // Whitespace-tolerant: matches the rule body even across line breaks.
    expect(globalSource).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+var\(--color-accent\)[^}]*outline-offset:\s*2px/,
    );
  });

  it("reduced-motion kill-switch exists in animations.css with 0.01ms guard (AC #7)", () => {
    expect(animationsSource).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(animationsSource).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(animationsSource).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("all 13 @property color tokens are registered in tokens.css (AC #6)", () => {
    // @property --color-… registrations enable smooth interpolation across theme toggle.
    // Count tracked separately from raw token assignments to avoid false positives.
    const matches = tokensSource.match(/@property\s+--color-[a-z-]+\s*\{/g) ?? [];
    expect(matches.length, `expected 13 @property color tokens, found ${matches.length}`).toBe(13);
  });

  it("nightfall.css overrides all 13 base color tokens (AC #6)", () => {
    // Extract just the html[data-theme="nightfall"] block (not fallback @supports block).
    const blockMatch = nightfallSource.match(/html\[data-theme="nightfall"\]\s*\{([\s\S]*?)\n\}/);
    expect(blockMatch, "nightfall override block").not.toBeNull();
    const block = blockMatch?.[1] ?? "";
    const baseTokens = [
      "--color-surface",
      "--color-surface-alt",
      "--color-text-primary",
      "--color-text-secondary",
      "--color-text-tertiary",
      "--color-accent",
      "--color-accent-hover",
      "--color-accent-tint",
      "--color-border",
      "--color-code-surface",
      "--color-margin-ink",
      "--color-postit-yellow",
      "--color-tongue",
    ];
    for (const token of baseTokens) {
      // Match assignment, e.g. `--color-surface:` (with leading whitespace, not as substring of a longer token).
      const re = new RegExp(`(^|\\s)${token}:`, "m");
      expect(block, `nightfall must override ${token}`).toMatch(re);
    }
  });

  it("touch-target minimum is 44px (WCAG 2.5.8)", () => {
    expect(tokensSource).toMatch(/--touch-target-min:\s*44px/);
  });

  it("SearchBox has aria-live status region (AC #1)", () => {
    expect(searchBoxSource).toMatch(/aria-live="polite"/);
  });

  it("--color-text-tertiary day-mode L meets WCAG AA on surface + surface-alt (AC #6)", () => {
    // Day-mode tertiary at L0.50 = 5.36:1 on surface, 4.61:1 on surface-alt.
    // The @property registration and :root assignment must stay in sync.
    expect(tokensSource).toMatch(
      /@property --color-text-tertiary[\s\S]*?initial-value:\s*oklch\(0\.5\s+0\.015\s+60\)/,
    );
    // Whitespace-tolerant inside the oklch() — biome may wrap long lines.
    expect(tokensSource).toMatch(/--color-text-tertiary:\s*oklch\(\s*0\.5\s+0\.015\s+60\s*\)/);
  });

  it("--color-text-tertiary nightfall L meets WCAG AA on surface + surface-alt (AC #6)", () => {
    // Nightfall tertiary at L0.66 = 5.59:1 on surface, 4.72:1 on surface-alt.
    expect(nightfallSource).toMatch(/--color-text-tertiary:\s*oklch\(0\.66\s+0\.01\s+80\)/);
  });

  it("--color-accent + accent-tint nightfall L stays at 0.65 (AC #6)", () => {
    // Accent at L0.65 = 5.63:1 on surface, 4.75:1 on surface-alt.
    expect(nightfallSource).toMatch(/--color-accent:\s*oklch\(0\.65\s+0\.1\s+155\)/);
    expect(nightfallSource).toMatch(
      /--color-accent-tint:\s*oklch\(0\.65\s+0\.1\s+155\s*\/\s*0\.15\)/,
    );
  });
});
