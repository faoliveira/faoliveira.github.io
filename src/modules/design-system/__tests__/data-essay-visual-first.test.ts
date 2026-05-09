// @vitest-environment node
// Markers per design note 1-9-data-essay-direction.md:
//   primary: name="hero" (slot literal)
//   secondary: data-essay-header--with-hero (modifier class literal)
import { readFileSync } from "node:fs";
import path from "node:path";
import dataEssayLayoutSource from "@layouts/DataEssayLayout.astro?raw";
import { describe, expect, it } from "vitest";
import slugPageSource from "../../../pages/posts/[...slug].astro?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const dataEssayCss = readFileSync(path.join(PROJECT_ROOT, "src/styles/data-essay.css"), "utf-8");

describe("Story 1.9 — data-essay visual-first contract (Direction A)", () => {
  describe("Routing regression guard (AC 4, 16)", () => {
    it("[...slug].astro still routes data-essay to DataEssayLayout", () => {
      expect(slugPageSource).toMatch(/isDataEssay\s*=\s*post\.data\.type\s*===\s*"data-essay"/);
    });

    it('DataEssayLayout.astro carries data-post-type="data-essay"', () => {
      expect(dataEssayLayoutSource).toMatch(/data-post-type="data-essay"/);
    });
  });

  describe("Lead-island slot — Direction A markers (AC 5, 16)", () => {
    it("DataEssayLayout.astro declares the hero named slot", () => {
      expect(dataEssayLayoutSource).toMatch(/name="hero"/);
    });

    it("DataEssayLayout.astro declares the with-hero header modifier", () => {
      expect(dataEssayLayoutSource).toMatch(/data-essay-header--with-hero/);
    });

    it("hero slot appears before the body slot in source order", () => {
      const heroSlotIndex = dataEssayLayoutSource.indexOf('name="hero"');
      // Match the bare body slot, not the named hero slot. Use a
      // negative-lookahead-ish approach via regex to find <slot /> with no name attr.
      const bodySlotMatch = dataEssayLayoutSource.match(/<slot\s*\/>/);
      expect(heroSlotIndex).toBeGreaterThan(-1);
      expect(bodySlotMatch).not.toBeNull();
      const bodySlotIndex = bodySlotMatch ? dataEssayLayoutSource.indexOf(bodySlotMatch[0]) : -1;
      expect(bodySlotIndex).toBeGreaterThan(heroSlotIndex);
    });
  });

  describe("Hero wrapper region (AC 13, 16)", () => {
    it("data-essay.css declares .data-essay-hero with an 85ch rail", () => {
      expect(dataEssayCss).toMatch(/\.data-essay-hero\s*\{[^}]*max-width:\s*85ch/);
    });

    it("data-essay.css declares the with-hero header modifier", () => {
      expect(dataEssayCss).toMatch(/\.data-essay-header--with-hero\b/);
    });

    it("with-hero modifier shrinks the title to --type-2xl", () => {
      expect(dataEssayCss).toMatch(
        /\.data-essay-header--with-hero\s+\.data-essay-title\s*\{[^}]*font-size:\s*var\(--type-2xl\)/,
      );
    });
  });

  describe("Existing 85ch prose override preserved (AC 7)", () => {
    it("data-essay.css keeps .data-essay-article .prose at 85ch", () => {
      expect(dataEssayCss).toMatch(/\.data-essay-article\s+\.prose\s*\{[^}]*max-width:\s*85ch/);
    });
  });

  describe("Theme token hygiene (AC 13, 16)", () => {
    it("data-essay.css contains no hex color literals", () => {
      expect(dataEssayCss).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    });

    it("data-essay.css contains no rgb/rgba color literals", () => {
      expect(dataEssayCss).not.toMatch(/rgba?\(/i);
    });

    it("data-essay.css contains no hsl/hsla color literals", () => {
      expect(dataEssayCss).not.toMatch(/hsla?\(/i);
    });

    it("data-essay.css contains no oklch/oklab/lab/lch/color() literals", () => {
      expect(dataEssayCss).not.toMatch(/\b(oklch|oklab|lab|lch|color)\(/i);
    });
  });

  describe("Class-name stability — anti-pattern guard (AC 16)", () => {
    it("data-essay.css does not declare a kb-prose class", () => {
      expect(dataEssayCss).not.toMatch(/\.kb-prose\b/);
    });
  });
});

describe("Routing — hero forwarding (Story 1.23)", () => {
  it("[...slug].astro reads post.data.hero from frontmatter", () => {
    expect(slugPageSource).toMatch(/post\.data\.hero/);
  });

  it('[...slug].astro forwards <HeroImage slot="hero" /> when hero is set', () => {
    // Anchor the slot attribute inside a single <HeroImage ...> tag — non-greedy
    // [^>]*? prevents matching across unrelated elements.
    expect(slugPageSource).toMatch(/<HeroImage\b[^>]*?\bslot="hero"/);
  });

  it("hero forwarding lives inside the isDataEssay branch", () => {
    const dataEssayBranch = slugPageSource.match(/isDataEssay \? \([\s\S]*?<\/DataEssayLayout>/);
    expect(dataEssayBranch).not.toBeNull();
    if (!dataEssayBranch) return;
    expect(dataEssayBranch[0]).toContain("<HeroImage");
    expect(dataEssayBranch[0]).toContain('slot="hero"');
  });

  it("hero forwarding does NOT appear in the isProject, isLog, or default branches", () => {
    const projectBranch = slugPageSource.match(/isProject \? \([\s\S]*?<\/ProjectLayout>/);
    const logBranch = slugPageSource.match(/isLog \? \([\s\S]*?<\/LogLayout>/);
    const defaultBranch = slugPageSource.match(/: \(\s*<PostLayout[\s\S]*?<\/PostLayout>/);

    expect(projectBranch).not.toBeNull();
    expect(logBranch).not.toBeNull();
    expect(defaultBranch).not.toBeNull();
    if (!projectBranch || !logBranch || !defaultBranch) return;

    expect(projectBranch[0]).not.toContain("<HeroImage");
    expect(projectBranch[0]).not.toContain('slot="hero"');
    expect(logBranch[0]).not.toContain("<HeroImage");
    expect(logBranch[0]).not.toContain('slot="hero"');
    expect(defaultBranch[0]).not.toContain("<HeroImage");
    expect(defaultBranch[0]).not.toContain('slot="hero"');
  });
});
