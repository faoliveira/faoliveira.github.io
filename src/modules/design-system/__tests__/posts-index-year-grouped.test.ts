// @vitest-environment node
import { describe, expect, it } from "vitest";
import indexSource from "../../../pages/posts/index.astro?raw";
import pagedSource from "../../../pages/posts/page/[page].astro?raw";

describe("Posts index — year-grouped contract (Story 1.14)", () => {
  it("[index + paged] derives years from the page slice via getUTCFullYear() (AC #1, #9)", () => {
    expect(indexSource).toMatch(/post\.data\.date\.getUTCFullYear\(\)/);
    expect(pagedSource).toMatch(/post\.data\.date\.getUTCFullYear\(\)/);
  });

  it("[index + paged] sorts year keys descending via spread + sort (AC #1, #9)", () => {
    const sortPattern = /\[\.\.\.byYear\.keys\(\)\]\.sort\(\(a,\s*b\)\s*=>\s*b\s*-\s*a\)/;
    expect(indexSource).toMatch(sortPattern);
    expect(pagedSource).toMatch(sortPattern);
  });

  it("[index + paged] renders one PostList per year with the canonical year label (AC #2, #10)", () => {
    const trail = String.fromCharCode(0x2014).repeat(2);
    const labelPattern = new RegExp(`headingText=\\{\`\\$\\{year\\}\\s${trail}\`\\}`);
    expect(indexSource).toMatch(labelPattern);
    expect(pagedSource).toMatch(labelPattern);
  });

  it("[index + paged] reuses showHeading={true} on the per-year PostList (AC #10)", () => {
    expect(indexSource).toMatch(/showHeading=\{true\}/);
    expect(pagedSource).toMatch(/showHeading=\{true\}/);
  });

  it("[index + paged] does not introduce a PostListByYear component or widen PostList API (AC #10)", () => {
    expect(indexSource).not.toMatch(/<PostListByYear/);
    expect(indexSource).not.toMatch(/groupByYear=\{/);
    expect(pagedSource).not.toMatch(/<PostListByYear/);
    expect(pagedSource).not.toMatch(/groupByYear=\{/);
  });

  it("[index] preserves the page-1 totalPages > 1 guard on Pagination (AC #7)", () => {
    expect(indexSource).toMatch(/totalPages\s*>\s*1\s*&&\s*\(\s*<Pagination/);
  });

  it("[paged] preserves the getStaticPaths slice from page 2 onward (AC #8)", () => {
    expect(pagedSource).toMatch(/Array\.from\(\{\s*length:\s*totalPages\s*-\s*1\s*\}/);
    expect(pagedSource).toMatch(/const\s+page\s*=\s*i\s*\+\s*2/);
  });

  it("[index + paged] preserves the page-header chrome (h1 Posts + tagline) (AC #7)", () => {
    expect(indexSource).toContain("<h1>Posts</h1>");
    expect(indexSource).toContain("Everything I couldn't leave alone, written down.");
    expect(pagedSource).toContain("<h1>Posts</h1>");
    expect(pagedSource).toContain("Everything I couldn't leave alone, written down.");
  });

  it("[index + paged] frontmatter does not extract a shared groupBy utility import (AC #9)", () => {
    const importPattern = /from\s+["']@modules\/content\/group-by-year["']/;
    expect(indexSource).not.toMatch(importPattern);
    expect(pagedSource).not.toMatch(importPattern);
  });

  it("[index + paged] uses no hex / rgba / hsl / oklch literals (AC #12)", () => {
    const hex = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\b/;
    const rgba = /rgba?\(\s*\d/;
    const hsla = /hsla?\(\s*\d/i;
    const oklch = /oklch\(\s*\d/i;
    for (const src of [indexSource, pagedSource]) {
      expect(src).not.toMatch(hex);
      expect(src).not.toMatch(rgba);
      expect(src).not.toMatch(hsla);
      expect(src).not.toMatch(oklch);
    }
  });

  it("[index + paged] contains no kanji / hiragana / katakana glyphs (AC #13)", () => {
    const cjk = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
    expect(indexSource).not.toMatch(cjk);
    expect(pagedSource).not.toMatch(cjk);
  });
});
