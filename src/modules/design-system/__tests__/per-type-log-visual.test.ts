// @vitest-environment node
// Markers per design note 1-10-log-direction.md (Direction A + B-1 + B-3 ratified by Sally @ 2026-05-06):
//   layout literals: data-post-type="log", dateline-grid, date-col, content-col, back-link-footer, <TypeTag href="/log/" />
//   css literal: [data-post-type="log"] .prose / [data-post-type="log"].prose { max-width: 55ch; line-height: 1.6 }
//   routing literal: isLog = post.data.type === "log"
import { readFileSync } from "node:fs";
import path from "node:path";
import logLayoutSource from "@layouts/LogLayout.astro?raw";
import { describe, expect, it } from "vitest";
import slugPageSource from "../../../pages/posts/[...slug].astro?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const proseCss = readFileSync(path.join(PROJECT_ROOT, "src/styles/prose.css"), "utf-8");

describe("Story 1.10 — log per-type visual contract (Direction A — Nikki ratified)", () => {
  describe("Routing regression guard (AC 4, 16)", () => {
    it("[...slug].astro still routes log to LogLayout", () => {
      expect(slugPageSource).toMatch(/isLog\s*=\s*post\.data\.type\s*===\s*"log"/);
    });

    it('LogLayout.astro carries data-post-type="log"', () => {
      expect(logLayoutSource).toMatch(/data-post-type="log"/);
    });
  });

  describe("Nikki dateline structural markers — Direction A (AC 5, 7, 8, 16)", () => {
    it("LogLayout.astro declares the dateline-grid container", () => {
      expect(logLayoutSource).toMatch(/\bdateline-grid\b/);
    });

    it("LogLayout.astro declares the sticky date-col aside", () => {
      expect(logLayoutSource).toMatch(/\bdate-col\b/);
    });

    it("LogLayout.astro declares the content-col wrapper", () => {
      expect(logLayoutSource).toMatch(/\bcontent-col\b/);
    });

    it("LogLayout.astro declares the back-link-footer (AC 8)", () => {
      expect(logLayoutSource).toMatch(/\bback-link-footer\b/);
    });

    it("LogLayout.astro renders TypeTag pointing at /log/ (AC 7)", () => {
      expect(logLayoutSource).toMatch(/<TypeTag\s+type=\{type\}\s+href="\/log\/"\s*\/>/);
    });

    it('class="date-col" appears before the body <slot /> in source order (AC 5)', () => {
      const dateColIndex = logLayoutSource.indexOf('class="date-col"');
      const bodySlotMatch = logLayoutSource.match(/<slot\s*\/>/);
      expect(dateColIndex).toBeGreaterThan(-1);
      expect(bodySlotMatch).not.toBeNull();
      const bodySlotIndex = bodySlotMatch ? logLayoutSource.indexOf(bodySlotMatch[0]) : -1;
      expect(bodySlotIndex).toBeGreaterThan(dateColIndex);
    });
  });

  describe("Body falls back to .prose with the 55ch / 1.6 override (AC 6, 16)", () => {
    it("prose.css carries the [data-post-type=log] .prose 55ch + 1.6 override", () => {
      expect(proseCss).toMatch(
        /\[data-post-type="log"\]\s*\.prose,?[\s\S]*?\[data-post-type="log"\]\.prose\s*\{[^}]*max-width:\s*55ch[^}]*line-height:\s*1\.6/,
      );
    });
  });

  describe("Theme token hygiene (AC 12, 16)", () => {
    it("LogLayout.astro <style> block contains no hex color literals", () => {
      const styleMatch = logLayoutSource.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      expect(styleMatch).not.toBeNull();
      expect(styleMatch?.[1]).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    });
  });

  describe("Class-name stability — anti-pattern guard (AC 9, 16)", () => {
    it("LogLayout.astro does not introduce a kb-prose class", () => {
      expect(logLayoutSource).not.toMatch(/\bkb-prose\b/);
    });

    it("LogLayout.astro does not import any marginalia atom (AC 9)", () => {
      expect(logLayoutSource).not.toMatch(
        /\b(WashiTape|Polaroid|EkiStamp|MarginNote|PaperClip|Hanko|NunoDoodle)\b/,
      );
    });
  });

  describe("No-kanji-on-surface guard (AC 10, 16)", () => {
    it("LogLayout.astro raw source carries no kanji / hiragana / katakana glyphs", () => {
      expect(logLayoutSource).not.toMatch(/[　-〿぀-ゟ゠-ヿ一-龯]/);
    });
  });
});
