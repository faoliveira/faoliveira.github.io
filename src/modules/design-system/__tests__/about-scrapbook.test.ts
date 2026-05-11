// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import polaroidSource from "@components/Polaroid.astro?raw";
import washiTapeSource from "@components/WashiTape.astro?raw";
import { describe, expect, it } from "vitest";
import aboutSource from "../../../pages/about.astro?raw";

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
const RGB_LITERAL = /rgba?\(\s*\d/;

describe("About page — scrapbook composition contract", () => {
  it("centers the prose at the literal 580px scrapbook width (not the global 62ch)", () => {
    expect(aboutSource).toMatch(/\.about-spread\s*>\s*\.prose\s*\{[\s\S]*?max-width:\s*580px/);
  });

  it("renders four Polaroid frames (3 desktop marginalia + 1 mobile fallback)", () => {
    const matches = aboutSource.match(/<Polaroid\b/g) ?? [];
    expect(matches.length).toBe(4);
  });

  it("never references the EkiStamp atom (FA scope decision 2026-05-09)", () => {
    expect(aboutSource).not.toMatch(/<EkiStamp/);
    expect(aboutSource).not.toMatch(/import\s+EkiStamp/);
  });

  it("ships exactly one yellow post-it backed by --color-postit-yellow", () => {
    const classMatches = aboutSource.match(/class="post-it"/g) ?? [];
    expect(classMatches.length).toBe(1);
    expect(aboutSource).toContain("var(--color-postit-yellow)");
  });

  it("preserves the canonical 5-paragraph prose verbatim", () => {
    expect(aboutSource).toContain(
      "I don't have a five-year plan. I have seventeen browser tabs open and a dog who won't rest until someone throws the ball again.",
    );
    expect(aboutSource).toContain("My name is Felipe Augusto");
    expect(aboutSource).toContain("This site is inspired by the koubou");
    expect(aboutSource).toContain("So this is where I write");
    expect(aboutSource).toContain("If this sounds like your kind of thing");
  });

  it("contains zero kanji glyphs anywhere on the page (no-kanji rule)", () => {
    expect(aboutSource).not.toMatch(KANJI_RANGE);
  });

  it("never mentions eki-stamps in any surface copy (FA scope decision)", () => {
    expect(aboutSource).not.toMatch(/eki-stamps?/i);
  });

  it("never references stamps or Japan trips in the margin notes (per Sally's review)", () => {
    expect(aboutSource).not.toMatch(/\bjapan\b/i);
    expect(aboutSource).not.toMatch(/\bstamps?\b/i);
  });

  it("preserves the rot13 email-obfuscation script", () => {
    expect(aboutSource).toContain("'sryvcr@sryvcrb.zr'");
  });

  it("preserves the .fa-highlight rule", () => {
    expect(aboutSource).toContain(".fa-highlight {");
    expect(aboutSource).toContain("var(--color-accent-tint)");
  });

  it("hides the marginalia layer below 1024px (gutter pinch + tablet fallback)", () => {
    expect(aboutSource).toMatch(
      /@media\s*\(max-width:\s*1023\.98px\)\s*\{[\s\S]*?\.marginalia\s*\{[\s\S]*?display:\s*none/,
    );
  });

  it("ships the workshop-is-open margin note (FA cut the second note 2026-05-09)", () => {
    expect(aboutSource).toContain("the workshop is open →");
    expect(aboutSource).not.toContain("more here than here");
  });

  it("does not place aria-hidden on the marginalia wrapper (polaroid alt text stays accessible)", () => {
    expect(aboutSource).not.toMatch(/class="marginalia"[^>]*aria-hidden/);
    expect(aboutSource).not.toMatch(/aria-hidden="true"[^>]*class="marginalia"/);
  });

  it("provides a mobile-only inline polaroid below the prose", () => {
    expect(aboutSource).toContain("mobile-polaroid");
    expect(aboutSource).toMatch(/\.mobile-polaroid\s*\{[^}]*display:\s*none/);
  });

  it("overrides post-it ink and shadow for nightfall via inherited custom properties", () => {
    expect(aboutSource).toContain("--color-postit-ink");
    expect(aboutSource).toContain("--postit-shadow");
  });
});

describe("Polaroid — atom contract", () => {
  it("uses the cream surface token (overridable via --polaroid-surface), not a hex literal", () => {
    expect(polaroidSource).toContain("--polaroid-surface");
    expect(polaroidSource).toContain("var(--color-surface)");
    expect(polaroidSource).not.toMatch(HEX_LITERAL);
  });

  it("renders the Caveat caption through --font-script + --color-margin-ink (no hex)", () => {
    expect(polaroidSource).toContain("var(--font-script)");
    expect(polaroidSource).toContain("var(--color-margin-ink)");
  });

  it("locks the photo wrapper to the canonical 1 / 1.08 aspect ratio", () => {
    expect(polaroidSource).toMatch(/aspect-ratio:\s*1\s*\/\s*1\.08/);
  });

  it("expresses the polaroid drop shadow in oklch (not rgba)", () => {
    expect(polaroidSource).not.toMatch(RGB_LITERAL);
    expect(polaroidSource).toMatch(/box-shadow:[\s\S]*?oklch\(/);
  });

  it("applies rotation via CSS custom property --polaroid-rotate (not inline transform)", () => {
    expect(polaroidSource).toContain("--polaroid-rotate");
    expect(polaroidSource).toMatch(/transform:\s*rotate\(var\(--polaroid-rotate/);
  });

  it("ships the forced-colors fallback (zero rotation, CanvasText caption)", () => {
    expect(polaroidSource).toContain("forced-colors: active");
    expect(polaroidSource).toContain("forced-color-adjust: none");
    expect(polaroidSource).toContain("CanvasText");
    expect(polaroidSource).toMatch(/--polaroid-rotate:\s*0deg/);
  });

  it("types Polaroid src as ImageMetadata (not a string path)", () => {
    expect(polaroidSource).toContain("import type { ImageMetadata }");
    expect(polaroidSource).toMatch(/src:\s*ImageMetadata/);
  });
});

describe("WashiTape — atom contract", () => {
  it("consumes the global --tape-matcha and --tape-vermillion tokens", () => {
    expect(washiTapeSource).toContain("var(--tape-matcha)");
    expect(washiTapeSource).toContain("var(--tape-vermillion)");
  });

  it("marks the rendered span aria-hidden", () => {
    expect(washiTapeSource).toContain('aria-hidden="true"');
  });

  it("contains zero hex literals and zero rgba()", () => {
    expect(washiTapeSource).not.toMatch(HEX_LITERAL);
    expect(washiTapeSource).not.toMatch(RGB_LITERAL);
  });

  it("uses the global --tape-shadow token for elevation", () => {
    expect(washiTapeSource).toContain("var(--tape-shadow)");
  });
});

describe("Marginalia tokens — registration", () => {
  it("registers --color-postit-yellow as a transitionable @property", () => {
    expect(tokensSource).toMatch(/@property\s+--color-postit-yellow\s*\{/);
    expect(tokensSource).toMatch(/--color-postit-yellow:\s*oklch\(0\.92\s+0\.1\s+92\)/);
  });

  it("provides a nightfall override for the post-it surface", () => {
    expect(nightfallSource).toMatch(/--color-postit-yellow:\s*oklch\(/);
  });

  it("includes --color-postit-yellow in the theme-animated transition list", () => {
    const transitionMatch = nightfallSource.match(
      /html\[data-theme\]\.theme-animated\s*\{[\s\S]*?transition:\s*([\s\S]*?);\s*\}/,
    );
    expect(transitionMatch).not.toBeNull();
    expect(transitionMatch?.[1]).toContain("--color-postit-yellow");
  });

  it("provides @supports-not-oklch hex fallbacks for the post-it surface", () => {
    expect(tokensSource).toMatch(/@supports not \(color: oklch\(0 0 0\)\)/);
    expect(tokensSource).toMatch(/--color-postit-yellow:\s*#[0-9a-fA-F]{3,6}/);
    expect(nightfallSource).toMatch(/@supports not \(color: oklch\(0 0 0\)\)/);
    expect(nightfallSource).toMatch(/--color-postit-yellow:\s*#[0-9a-fA-F]{3,6}/);
  });

  it("hoists --tape-matcha / --tape-vermillion / --tape-shadow into global tokens", () => {
    expect(tokensSource).toContain("--tape-matcha");
    expect(tokensSource).toContain("--tape-vermillion");
    expect(tokensSource).toContain("--tape-shadow");
    expect(nightfallSource).toContain("--tape-matcha");
    expect(nightfallSource).toContain("--tape-vermillion");
    expect(nightfallSource).toContain("--tape-shadow");
  });
});
