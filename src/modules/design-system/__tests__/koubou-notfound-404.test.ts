// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import nunoDoodleSource from "@components/NunoDoodle.astro?raw";
import { describe, expect, it } from "vitest";
import notFoundSource from "../../../pages/404.astro?raw";

const tokensSource = readFileSync(
  fileURLToPath(new URL("../../../styles/tokens.css", import.meta.url)),
  "utf8",
);
const nightfallSource = readFileSync(
  fileURLToPath(new URL("../../../styles/nightfall.css", import.meta.url)),
  "utf8",
);

const KANJI_RANGE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const HEX_LITERAL = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\b/;
const RGB_LITERAL = /rgba?\(\s*\d/i;
const HSL_LITERAL = /hsla?\(\s*\d/i;
const OKLCH_LITERAL = /oklch\(\s*\d/i;

describe("404 page — KoubouNotFound contract (Story 1.15)", () => {
  it("[AC #1] composes inside <BaseLayout>", () => {
    expect(notFoundSource).toMatch(/from\s+["']@layouts\/BaseLayout\.astro["']/);
    expect(notFoundSource).toMatch(/<BaseLayout\b[\s\S]*?>[\s\S]*?<\/BaseLayout>/);
  });

  it("[AC #2] sets noindex={true} on BaseLayout", () => {
    expect(notFoundSource).toMatch(/<BaseLayout\b[^>]*\bnoindex=\{true\}/);
  });

  it("[AC #3] imports and renders NunoDoodle", () => {
    expect(notFoundSource).toMatch(/from\s+["']@components\/NunoDoodle\.astro["']/);
    expect(notFoundSource).toMatch(/<NunoDoodle\b/);
  });

  it("[AC #4] NunoDoodle SVG carries aria-hidden and the canonical viewBox", () => {
    expect(nunoDoodleSource).toMatch(/<svg[^>]*viewBox="0 0 80 80"/);
    expect(nunoDoodleSource).toMatch(/aria-hidden="true"/);
  });

  it("[AC #5] page renders a Caveat-script voice line", () => {
    expect(notFoundSource).toContain("var(--font-script)");
  });

  it("[AC #7] embeds <SearchBox> for recovery", () => {
    expect(notFoundSource).toMatch(/from\s+["']@components\/SearchBox\.astro["']/);
    expect(notFoundSource).toMatch(/<SearchBox\b/);
  });

  it("[AC #8] passes autofocus={false} and gates focus on (pointer: fine)", () => {
    expect(notFoundSource).toMatch(/<SearchBox\b[^>]*\bautofocus=\{false\}/);
    expect(notFoundSource).toMatch(/matchMedia\(\s*['"](\(pointer: fine\))['"]\s*\)\.matches/);
    expect(notFoundSource).not.toMatch(/\u003cSearchBox\b[^\u003e]*\bautofocus\b(?!={false\})/);
  });

  it("[AC #9] links back to home", () => {
    expect(notFoundSource).toMatch(/<a\b[^>]*href="\/"/);
  });

  it("[AC #10] contains zero kanji / hiragana / katakana glyphs", () => {
    expect(notFoundSource).not.toMatch(KANJI_RANGE);
    expect(nunoDoodleSource).not.toMatch(KANJI_RANGE);
  });

  it("[AC #11] contains no hex / rgba / hsla / oklch literal numerics", () => {
    for (const src of [notFoundSource, nunoDoodleSource]) {
      expect(src).not.toMatch(HEX_LITERAL);
      expect(src).not.toMatch(RGB_LITERAL);
      expect(src).not.toMatch(HSL_LITERAL);
      expect(src).not.toMatch(OKLCH_LITERAL);
    }
  });

  it("[AC #13] removes the click-counter easter egg artefacts", () => {
    const patterns = [
      /\.display-number\b/,
      /\.collect-badge\b/,
      /\.number-wrapper\b/,
      /@keyframes\s+float\b/,
      /@keyframes\s+squish\b/,
      /milestones?\b/i,
      /\bflee\(/,
    ];
    for (const pattern of patterns) {
      expect(notFoundSource).not.toMatch(pattern);
    }
  });

  it("[AC #14] does not implement the haul mini-mechanic", () => {
    const patterns = [
      /NUNO_BRINGS_BACK\b/,
      /HaulList\b/,
      /HaulAction\b/,
      /PawPrint\b/,
      /pages?\s+turned/i,
      /morale\b/i,
    ];
    for (const pattern of patterns) {
      expect(notFoundSource).not.toMatch(pattern);
    }
  });

  it("[AC #17] the inline focus script survives Astro ClientRouter navigation", () => {
    expect(notFoundSource).toMatch(/<script>[\s\S]*?astro:page-load[\s\S]*?<\/script>/);
  });

  it("[NunoDoodle atom] declares a typed Props interface with size/color/tongue", () => {
    expect(nunoDoodleSource).toMatch(/interface\s+Props\b/);
    expect(nunoDoodleSource).toMatch(/size\?:\s*number/);
    expect(nunoDoodleSource).toMatch(/color\?:\s*string/);
    expect(nunoDoodleSource).toMatch(/tongue\?:\s*boolean/);
  });

  it("[NunoDoodle atom] ships the forced-colors fallback", () => {
    expect(nunoDoodleSource).toContain("forced-colors: active");
    expect(nunoDoodleSource).toContain("forced-color-adjust: none");
  });

  it("[Tokens] --color-tongue is registered as a transitionable @property + nightfall override + hex fallback", () => {
    expect(tokensSource).toMatch(/@property\s+--color-tongue\s*\{/);
    expect(tokensSource).toMatch(/--color-tongue:\s*oklch\(/);
    expect(nightfallSource).toMatch(/--color-tongue:\s*oklch\(/);
    expect(tokensSource).toMatch(
      /@supports not \(color: oklch\(0 0 0\)\)[\s\S]*?--color-tongue:\s*#[0-9a-fA-F]{3,6}/,
    );
    expect(nightfallSource).toMatch(
      /@supports not \(color: oklch\(0 0 0\)\)[\s\S]*?--color-tongue:\s*#[0-9a-fA-F]{3,6}/,
    );
  });
});
