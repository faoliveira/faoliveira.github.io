// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import postLayoutSource from "@layouts/PostLayout.astro?raw";
import { describe, expect, it } from "vitest";
import slugPageSource from "../../../pages/posts/[...slug].astro?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const typographySource = readFileSync(
  path.join(PROJECT_ROOT, "src/styles/typography.css"),
  "utf-8",
);
const proseSource = readFileSync(path.join(PROJECT_ROOT, "src/styles/prose.css"), "utf-8");

describe("Story 1.8 — kb-prose reading layout contract", () => {
  describe("Container width (AC 1)", () => {
    it("caps .prose at 62ch", () => {
      expect(typographySource).toMatch(/\.prose\s*\{[^}]*max-width:\s*62ch/);
    });

    it("does not declare the legacy 65ch cap on .prose", () => {
      expect(typographySource).not.toMatch(/\.prose\s*\{[^}]*max-width:\s*65ch/);
    });

    it("aligns the PostLayout article wrapper to 62ch", () => {
      expect(postLayoutSource).toMatch(/article\s*\{[^}]*max-width:\s*62ch/);
    });
  });

  describe("Paragraph rhythm (AC 3)", () => {
    it("uses 1.5x leading-base for p + p spacing", () => {
      expect(typographySource).toMatch(
        /\.prose\s+p\s*\+\s*p\s*\{\s*margin-top:\s*calc\(var\(--leading-base\)\s*\*\s*1\.5rem\)\s*;?\s*\}/,
      );
    });
  });

  describe("Inline links (AC 4)", () => {
    it("uses --color-accent on .prose a", () => {
      expect(typographySource).toMatch(/\.prose\s+a\s*\{[^}]*color:\s*var\(--color-accent\)/);
    });

    it("declares 1px text-decoration-thickness", () => {
      expect(typographySource).toMatch(/text-decoration-thickness:\s*1px/);
    });

    it("declares 0.15em text-underline-offset", () => {
      expect(typographySource).toMatch(/text-underline-offset:\s*0\.15em/);
    });

    it("hover shifts to --color-accent-hover", () => {
      expect(typographySource).toMatch(
        /\.prose\s+a:hover\s*\{[^}]*color:\s*var\(--color-accent-hover\)/,
      );
    });
  });

  describe("Blockquote matcha rule (AC 5)", () => {
    it("uses a 2px matcha tint border-inline-start in prose.css", () => {
      expect(proseSource).toMatch(
        /\.prose\s+blockquote\s*\{[^}]*border-inline-start:\s*2px\s+solid\s+var\(--color-accent-tint\)/,
      );
    });
  });

  describe("Inline code surface (AC 7)", () => {
    it("uses --color-code-surface as the inline code background", () => {
      expect(typographySource).toMatch(
        /\.prose\s+:not\(pre\)\s*>\s*code\s*\{[^}]*background:\s*var\(--color-code-surface\)/,
      );
    });
  });

  describe("Default-on derivation (AC 8 + AC 9)", () => {
    it("uses ?? so explicit reading: false wins over the implicit default", () => {
      const stripped = slugPageSource.replace(/\s+/g, " ");
      expect(stripped).toMatch(
        /reading=\{post\.data\.reading\s*\?\?\s*\(!post\.data\.type\s*\|\|\s*post\.data\.type\s*===\s*"reflection"\)\}/,
      );
    });
  });

  describe("Theme token hygiene (AC 13)", () => {
    it("does not embed hex color literals inside typography.css", () => {
      expect(typographySource).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    });

    it("does not embed hex color literals inside prose.css", () => {
      expect(proseSource).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    });
  });

  describe("Class-name stability (anti-pattern guard)", () => {
    it("does not declare a kb-prose class in typography.css", () => {
      expect(typographySource).not.toMatch(/\.kb-prose\b/);
    });

    it("does not declare a kb-prose class in prose.css", () => {
      expect(proseSource).not.toMatch(/\.kb-prose\b/);
    });
  });
});
