// @vitest-environment node
import { describe, expect, it } from "vitest";
import pageSource from "../../../pages/search.astro?raw";

describe("KoubouSearch page contract (Story 1.16)", () => {
  it("renders inside BaseLayout with Search — fa. title", () => {
    expect(pageSource).toContain('title="Search — fa."');
    expect(pageSource).toContain("<BaseLayout");
  });

  it("renders WorkshopSearch component", () => {
    expect(pageSource).toContain("<WorkshopSearch");
  });

  it("has the MarginNote with personality copy", () => {
    expect(pageSource).toContain("<MarginNote");
    expect(pageSource).toContain("try a word.");
    expect(pageSource).toContain("any word.");
    expect(pageSource).toContain("(even 'dog'.)");
  });

  it("MarginNote uses side=left", () => {
    expect(pageSource).toContain('side="left"');
  });

  it("uses no hex / rgba / hsl / oklch literals in new CSS", () => {
    expect(pageSource).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\b/);
    expect(pageSource).not.toMatch(/rgba?\(\s*\d/i);
    expect(pageSource).not.toMatch(/hsla?\(\s*\d/i);
    expect(pageSource).not.toMatch(/oklch\(\s*\d/i);
  });

  it("contains no kanji / hiragana / katakana glyphs", () => {
    // The existing 間 glyph in .shelf-mark is design DNA tracked under Story 1.17.
    // Strip the known glyph before checking for any *new* CJK.
    const sourceWithoutKnownGlyph = pageSource.replace(/間/g, "");
    expect(sourceWithoutKnownGlyph).not.toMatch(/[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/);
  });

  it("has direct heading copy Find something.", () => {
    expect(pageSource).toContain("Find something.");
  });

  it("has search label and subtitle", () => {
    expect(pageSource).toContain("Search the workshop");
    expect(pageSource).toContain("Title, tag, or a loose idea");
  });
});
