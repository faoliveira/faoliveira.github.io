// @vitest-environment node
import siteConfigSource from "@modules/seo/site-config.ts?raw";
import { describe, expect, it } from "vitest";
import timestampSource from "../../../components/content/Timestamp.astro?raw";
import kitchenSinkSource from "../../../content/posts/kitchen-sink.mdx?raw";
import sampleLogSource from "../../../content/posts/sample-log-entry.md?raw";
import dataEssayLayoutSource from "../../../layouts/DataEssayLayout.astro?raw";
import logLayoutSource from "../../../layouts/LogLayout.astro?raw";
import postLayoutSource from "../../../layouts/PostLayout.astro?raw";
import formatDateSource from "../../../modules/content/format-date.ts?raw";
import notFoundSource from "../../../pages/404.astro?raw";
import aboutSource from "../../../pages/about.astro?raw";
import designSystemSource from "../../../pages/design-system.astro?raw";
import indexSource from "../../../pages/index.astro?raw";
import logSource from "../../../pages/log.astro?raw";
import postsIndexSource from "../../../pages/posts/index.astro?raw";
import privacySource from "../../../pages/privacy.astro?raw";
import searchSource from "../../../pages/search.astro?raw";

// Broadened CJK range from Story 1.13 — kanji + hiragana + katakana + halfwidth.
const CJK_RANGE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;

// Unicode emoji proper — scoped to the SMP emoji blocks so it does NOT collide with
// functional notation in CurrentlyWidget (◀▶⏸♥♡★█░, all U+2500-U+2700-ish range).
const EMOJI_RANGE = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/u;

// Pages that ship to the public, indexed surface. design-system.astro is a
// noindex+nopagefind developer reference and is scanned separately.
const PRODUCTION_PAGES = [
  ["index.astro", indexSource],
  ["about.astro", aboutSource],
  ["posts/index.astro", postsIndexSource],
  ["log.astro", logSource],
  ["search.astro", searchSource],
  ["privacy.astro", privacySource],
  ["404.astro", notFoundSource],
] as const;

describe("Voice & copy + kanji audit (Story 1.17)", () => {
  it("[CJK] every production page is free of kanji/hiragana/katakana glyphs (AC #4)", () => {
    for (const [name, src] of PRODUCTION_PAGES) {
      expect(src, `${name} should be CJK-clean`).not.toMatch(CJK_RANGE);
    }
  });

  it("[CJK] layouts (PostLayout, DataEssayLayout, LogLayout) are CJK-clean (AC #4)", () => {
    expect(postLayoutSource).not.toMatch(CJK_RANGE);
    expect(dataEssayLayoutSource).not.toMatch(CJK_RANGE);
    expect(logLayoutSource).not.toMatch(CJK_RANGE);
  });

  it("[CJK] design-system.astro is the only page that intentionally renders CJK and is sealed noindex + nopagefind (AC #4)", () => {
    expect(designSystemSource).toMatch(CJK_RANGE);
    expect(designSystemSource).toMatch(/noindex=\{true\}/);
    expect(designSystemSource).toMatch(/nopagefind=\{true\}/);
    expect(designSystemSource).toMatch(/CJK intentional/);
  });


  it("[AI-tells] site-config descriptions avoid banned phrases (AC #1, #2, #3)", () => {
    const lower = siteConfigSource.toLowerCase();
    expect(lower).not.toMatch(/welcome to my blog/);
    expect(lower).not.toMatch(/\bultimate\b/);
    expect(lower).not.toMatch(/\bpivotal\b/);
    expect(lower).not.toMatch(/\btapestry\b/);
    expect(lower).not.toMatch(/\bdelve into\b/);
    expect(lower).not.toMatch(/\bin the realm of\b/);
    expect(lower).not.toMatch(/\btestament\b/);
    expect(lower).not.toMatch(/exciting times/);
  });

  it("[titles] core pages follow the '{Page} — fa.' pattern (homepage = bare 'fa.') (AC #1)", () => {
    expect(indexSource).toMatch(/title="fa\."/);
    expect(aboutSource).toMatch(/title="About — fa\."/);
    expect(postsIndexSource).toMatch(/title="Posts — fa\."/);
    expect(logSource).toMatch(/title="Log — fa\."/);
    expect(searchSource).toMatch(/title="Search — fa\."/);
    expect(privacySource).toMatch(/title="Privacy — fa\."/);
    expect(notFoundSource).toMatch(/title="Page not found — fa\."/);
  });

  it("[dates] formatDate() uses 2-digit day padding (AC #6)", () => {
    expect(formatDateSource).toMatch(/day:\s*["']2-digit["']/);
    expect(formatDateSource).not.toMatch(/day:\s*["']numeric["']/);
  });

  it("[dates] PostLayout + Timestamp use 2-digit day in their inline Intl date formats (AC #6)", () => {
    expect(postLayoutSource).toMatch(/day:\s*["']2-digit["']/);
    expect(postLayoutSource).not.toMatch(/day:\s*["']numeric["']/);
    expect(timestampSource).toMatch(/day:\s*["']2-digit["']/);
    expect(timestampSource).not.toMatch(/day:\s*["']numeric["']/);
  });

  it("[dates] layouts that build the day separately zero-pad via padStart(2, '0') (AC #6)", () => {
    const padPattern = /getUTCDate\(\)\)\.padStart\(2,\s*["']0["']\)/;
    expect(dataEssayLayoutSource).toMatch(padPattern);
    expect(logLayoutSource).toMatch(padPattern);
    expect(logSource).toMatch(padPattern);
  });

  it("[fixtures] kitchen-sink.mdx and sample-log-entry.md are sealed draft: true (AC #4)", () => {
    expect(kitchenSinkSource).toMatch(/^draft:\s*true\s*$/m);
    expect(sampleLogSource).toMatch(/^draft:\s*true\s*$/m);
  });

  it("[emoji] production page sources contain no SMP Unicode emoji except documented design-DNA exceptions (AC #5)", () => {
    // Known design-DNA exception: the 🐾 paw trail in 404.astro is aria-hidden, decorative,
    // tracked per AC #5 functional-notation clause. Strip the known glyph before scanning so
    // the test still catches any NEW emoji that creeps in.
    const sanitized404 = notFoundSource.replace(/🐾/g, "");

    expect(indexSource).not.toMatch(EMOJI_RANGE);
    expect(aboutSource).not.toMatch(EMOJI_RANGE);
    expect(postsIndexSource).not.toMatch(EMOJI_RANGE);
    expect(logSource).not.toMatch(EMOJI_RANGE);
    expect(searchSource).not.toMatch(EMOJI_RANGE);
    expect(privacySource).not.toMatch(EMOJI_RANGE);
    expect(sanitized404).not.toMatch(EMOJI_RANGE);

    expect(postLayoutSource).not.toMatch(EMOJI_RANGE);
    expect(dataEssayLayoutSource).not.toMatch(EMOJI_RANGE);
    expect(logLayoutSource).not.toMatch(EMOJI_RANGE);
  });
});
