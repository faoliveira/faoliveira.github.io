// @vitest-environment node
// Markers per design note 1-11-project-direction.md (Direction A + B-2c ratified by Sally @ 2026-05-07):
//   layout literals: data-post-type="project", project-article, project-header, title-group, hud-stats,
//                    canvas-stage, canvas-container, data-canvas-mode={canvasMode}, back-link-footer,
//                    <TypeTag type={type} /> (no href), buildProjectStructuredData, <noscript> fallback
//   css literal (B-2c, in prose.css): [data-post-type="project"] .canvas-container[data-canvas-mode="prose"] .prose { max-width: 65ch }
//   routing literal: isProject = post.data.type === "project"
import { readFileSync } from "node:fs";
import path from "node:path";
import projectLayoutSource from "@layouts/ProjectLayout.astro?raw";
import { describe, expect, it } from "vitest";
import slugPageSource from "../../../pages/posts/[...slug].astro?raw";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");
const proseCss = readFileSync(path.join(PROJECT_ROOT, "src/styles/prose.css"), "utf-8");

describe("Story 1.11 — project per-type visual contract (Direction A + B-2c — Canvas ratified)", () => {
  describe("Routing regression guard (AC 4, 17)", () => {
    it("[...slug].astro still routes project to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/isProject\s*=\s*post\.data\.type\s*===\s*"project"/);
    });

    it('ProjectLayout.astro carries data-post-type="project"', () => {
      expect(projectLayoutSource).toMatch(/data-post-type="project"/);
    });

    it("[...slug].astro pipes stack to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/stack=\{post\.data\.stack\}/);
    });

    it("[...slug].astro pipes last_run to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/last_run=\{post\.data\.last_run\}/);
    });

    it("[...slug].astro pipes season to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/season=\{post\.data\.season\}/);
    });

    it("[...slug].astro pipes repo to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/repo=\{post\.data\.repo\}/);
    });

    it("[...slug].astro pipes liveUrl to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/liveUrl=\{post\.data\.liveUrl\}/);
    });

    it("[...slug].astro pipes hasIsland to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/hasIsland=\{post\.data\.hasIsland\}/);
    });

    it("[...slug].astro pipes canvasMode to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/canvasMode=\{post\.data\.canvasMode\}/);
    });

    it("[...slug].astro pipes image to ProjectLayout", () => {
      expect(slugPageSource).toMatch(/image=\{ogImage\}/);
    });
  });

  describe("Canvas structural markers — Direction A (AC 5, 6, 7, 17)", () => {
    it("ProjectLayout.astro declares the project-article wrapper", () => {
      expect(projectLayoutSource).toMatch(/\bproject-article\b/);
    });

    it("ProjectLayout.astro declares the project-header strip", () => {
      expect(projectLayoutSource).toMatch(/\bproject-header\b/);
    });

    it("ProjectLayout.astro declares the title-group region", () => {
      expect(projectLayoutSource).toMatch(/\btitle-group\b/);
    });

    it("ProjectLayout.astro declares the hud-stats region", () => {
      expect(projectLayoutSource).toMatch(/\bhud-stats\b/);
    });

    it("ProjectLayout.astro declares the canvas-stage outer wrapper", () => {
      expect(projectLayoutSource).toMatch(/\bcanvas-stage\b/);
    });

    it("ProjectLayout.astro declares the canvas-container visible stage", () => {
      expect(projectLayoutSource).toMatch(/\bcanvas-container\b/);
    });

    it("ProjectLayout.astro declares the back-link-footer (AC 9)", () => {
      expect(projectLayoutSource).toMatch(/\bback-link-footer\b/);
    });

    it("ProjectLayout.astro renders TypeTag without an href (AC 6)", () => {
      expect(projectLayoutSource).toMatch(/<TypeTag\s+type=\{type\}\s*\/>/);
    });

    it("project-header appears before canvas-stage in source order (AC 6, 7)", () => {
      const headerIndex = projectLayoutSource.indexOf("project-header");
      const canvasStageIndex = projectLayoutSource.indexOf("canvas-stage");
      expect(headerIndex).toBeGreaterThan(-1);
      expect(canvasStageIndex).toBeGreaterThan(-1);
      expect(canvasStageIndex).toBeGreaterThan(headerIndex);
    });

    it("canvas-stage appears before back-link-footer in source order (AC 7, 9)", () => {
      const canvasStageIndex = projectLayoutSource.indexOf("canvas-stage");
      const backLinkIndex = projectLayoutSource.indexOf("back-link-footer");
      expect(canvasStageIndex).toBeGreaterThan(-1);
      expect(backLinkIndex).toBeGreaterThan(-1);
      expect(backLinkIndex).toBeGreaterThan(canvasStageIndex);
    });
  });

  describe("Canvas-mode toggle — prose | interactive (AC 7)", () => {
    it("ProjectLayout.astro toggles on canvasMode === 'prose'", () => {
      expect(projectLayoutSource).toMatch(/canvasMode\s*===\s*"prose"/);
    });

    it("ProjectLayout.astro binds data-canvas-mode={canvasMode}", () => {
      expect(projectLayoutSource).toMatch(/data-canvas-mode=\{canvasMode\}/);
    });
  });

  describe("Canvas-mode prose width — B-2c (in prose.css) (AC 7, 17)", () => {
    it("prose.css carries the [data-post-type=project] canvas-mode 65ch override", () => {
      expect(proseCss).toMatch(
        /\[data-post-type="project"\][\s\S]*?\.canvas-container\[data-canvas-mode="prose"\][\s\S]*?\.prose[\s\S]*?\{[^}]*max-width:\s*65ch/,
      );
    });

    it("ProjectLayout.astro no longer carries the 65ch literal in its <style> block (B-2c moved it out)", () => {
      const styleMatch = projectLayoutSource.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      expect(styleMatch).not.toBeNull();
      expect(styleMatch?.[1]).not.toMatch(/max-width:\s*65ch/);
    });
  });

  describe("noscript fallback for hasIsland (AC 8, 17)", () => {
    it("ProjectLayout.astro renders the <noscript> fallback with the English copy", () => {
      expect(projectLayoutSource).toMatch(
        /<noscript>[\s\S]*This project requires JavaScript to display its interactive content[\s\S]*<\/noscript>/,
      );
    });
  });

  describe("Schema.org structured data wiring (AC 10, 17)", () => {
    it("ProjectLayout.astro imports and calls buildProjectStructuredData", () => {
      expect(projectLayoutSource).toMatch(/buildProjectStructuredData/);
    });
  });

  describe("Back-link footer (AC 9, 17)", () => {
    it("ProjectLayout.astro back-link targets /posts/", () => {
      expect(projectLayoutSource).toMatch(/<a href="\/posts\/" class="back-link">/);
    });

    it("ProjectLayout.astro back-link copy is '← all posts' (English)", () => {
      expect(projectLayoutSource).toMatch(/← all posts/);
    });
  });

  describe("External link safety — Source ↗ / Live ↗ (AC 13)", () => {
    it("ProjectLayout.astro carries target=_blank rel=noopener noreferrer on external links", () => {
      expect(projectLayoutSource).toMatch(/target="_blank" rel="noopener noreferrer"/);
    });
  });

  describe("Theme token hygiene (AC 14, 17)", () => {
    it("ProjectLayout.astro <style> block contains no hex color literals", () => {
      const styleMatch = projectLayoutSource.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      expect(styleMatch).not.toBeNull();
      expect(styleMatch?.[1]).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });
  });

  describe("Class-name stability — anti-pattern guards (AC 17)", () => {
    it("ProjectLayout.astro does not introduce a kb-prose class", () => {
      expect(projectLayoutSource).not.toMatch(/\bkb-prose\b/);
    });

    it("ProjectLayout.astro does not import any marginalia atom (AC 11)", () => {
      expect(projectLayoutSource).not.toMatch(
        /\b(WashiTape|Polaroid|EkiStamp|MarginNote|PaperClip|Hanko|NunoDoodle)\b/,
      );
    });

    it("ProjectLayout.astro does not introduce a portfolio-grid pattern (anti-portfolio guard)", () => {
      expect(projectLayoutSource).not.toMatch(/grid-template-columns:\s*repeat/);
    });

    it("ProjectLayout.astro does not declare portfolio / project-grid / project-tile / project-card classes", () => {
      expect(projectLayoutSource).not.toMatch(
        /\b(portfolio|project-grid|project-tile|project-card)\b/,
      );
    });
  });

  describe("No-kanji-on-surface guard (AC 12, 17)", () => {
    it("ProjectLayout.astro raw source carries no kanji / hiragana / katakana glyphs", () => {
      expect(projectLayoutSource).not.toMatch(/[　-〿぀-ゟ゠-ヿ一-龯]/);
    });
  });
});
