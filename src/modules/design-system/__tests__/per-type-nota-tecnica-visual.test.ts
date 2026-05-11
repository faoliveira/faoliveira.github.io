// @vitest-environment node
// Markers per design note 1-12-nota-tecnica-direction.md (Direction A ratified by Sally @ 2026-05-09 — no amendments):
//   layout literals: data-post-type={type}, [data-post-type="nota-tecnica"] .post-header / .post-header h1 / .post-meta blocks,
//                    <TypeTag type={type} /> (no href), .post-header before body <slot /> in source order
//   routing literal: nota-tecnica falls through [...slug].astro chained ternary to <PostLayout>
//   negative guards: no isNotaTecnica branch, no NotaTecnicaLayout import, no `post.data.type === "nota-tecnica"` in the
//                    .prose predicate (Drift 2 ratified opt-in)
//   TypeTag literal: LABELS["nota-tecnica"] = "Technical Note"
//   value pins: border 1px (DESIGN.md side-stripe-ban threshold), predicate operator ?? (Drift 2 explicit-false respect)
import typeTagSource from "@components/TypeTag.astro?raw";
import postLayoutSource from "@layouts/PostLayout.astro?raw";
import { describe, expect, it } from "vitest";
import slugPageSource from "../../../pages/posts/[...slug].astro?raw";

describe("Story 1.12 — nota-tecnica per-type visual contract (Direction A — Story 2.2 ratified)", () => {
  describe("Routing regression guard — fall-through to PostLayout (AC 4, 16, 17)", () => {
    it("[...slug].astro chained ternary still routes nota-tecnica through the else branch to <PostLayout>", () => {
      expect(slugPageSource).toMatch(/<PostLayout/);
    });

    it("[...slug].astro pipes type to PostLayout", () => {
      expect(slugPageSource).toMatch(/type=\{post\.data\.type\}/);
    });

    it("[...slug].astro pipes reading to PostLayout via the opt-in predicate (Drift 2 — A ratified)", () => {
      // Direction A on Drift 2: the predicate defaults on for reflection / no-type only.
      // A B-4 amendment would add `post.data.type === "nota-tecnica"` here — guard against silent drift.
      expect(slugPageSource).toMatch(/reading=\{post\.data\.reading/);
      expect(slugPageSource).toMatch(/post\.data\.type\s*===\s*"reflection"/);
      // Drift 2 plus operator pin: shipped form uses `??` for reading fallback (not `||`).
      // `||` would short-circuit on `reading: false` and force the type-default; `??` respects explicit false.
      expect(slugPageSource).toMatch(/post\.data\.reading\s*\?\?\s*\(/);
    });
  });

  describe("Header chrome structural markers — Direction A (AC 6, 7, 16)", () => {
    it("PostLayout.astro carries the data-post-type={type} template binding on <article>", () => {
      expect(postLayoutSource).toMatch(/data-post-type=\{type\}/);
    });

    it("PostLayout.astro <style> block declares [data-post-type=nota-tecnica] .post-header (left rule + padding-left) (1px — at side-stripe-ban threshold)", () => {
      expect(postLayoutSource).toMatch(
        /\[data-post-type="nota-tecnica"\]\s+\.post-header\s*\{[^}]*border-left:\s*1px\s+solid\s+var\(--color-text-secondary\)[^}]*padding-left:\s*var\(--ma-base\)/,
      );
    });

    it("PostLayout.astro <style> block declares [data-post-type=nota-tecnica] .post-header h1 (mono --type-xl + tight tracking)", () => {
      expect(postLayoutSource).toMatch(
        /\[data-post-type="nota-tecnica"\]\s+\.post-header\s+h1\s*\{[^}]*font-family:\s*var\(--font-mono\)[^}]*font-size:\s*var\(--type-xl\)[^}]*letter-spacing:\s*-0\.02em/,
      );
    });

    it("PostLayout.astro <style> block declares [data-post-type=nota-tecnica] .post-meta (compact gap + tighter line-height)", () => {
      expect(postLayoutSource).toMatch(
        /\[data-post-type="nota-tecnica"\]\s+\.post-meta\s*\{[^}]*gap:\s*var\(--ma-thin\)[^}]*line-height:\s*1\.2/,
      );
    });

    it("PostLayout.astro renders <TypeTag type={type} /> without an href (AC 7 — no /nota-tecnica/ listing exists)", () => {
      expect(postLayoutSource).toMatch(/<TypeTag\s+type=\{type\}\s*\/>/);
    });

    it(".post-header appears before the body <slot /> in source order (AC 6)", () => {
      const headerIndex = postLayoutSource.indexOf('class="post-header"');
      const bodySlotMatch = postLayoutSource.match(/<slot\s*\/>/);
      expect(headerIndex).toBeGreaterThan(-1);
      expect(bodySlotMatch).not.toBeNull();
      const bodySlotIndex = bodySlotMatch ? postLayoutSource.indexOf(bodySlotMatch[0]) : -1;
      expect(bodySlotIndex).toBeGreaterThan(headerIndex);
    });
  });

  describe("TypeTag label literal — regression guard (AC 7, 16)", () => {
    it('TypeTag.astro carries LABELS["nota-tecnica"] = "Technical Note"', () => {
      expect(typeTagSource).toMatch(/"nota-tecnica":\s*"Technical Note"/);
    });
  });

  describe("Negative regression guards — no Direction-B-4 drift (AC 17)", () => {
    it("[...slug].astro predicate does NOT include nota-tecnica in the default-on list (Drift 2 stays opt-in)", () => {
      expect(slugPageSource).not.toMatch(/post\.data\.type\s*===\s*"nota-tecnica"/);
    });
  });

  describe("Negative regression guards — no Direction-C drift (AC 17)", () => {
    it("[...slug].astro does not introduce an isNotaTecnica branch", () => {
      expect(slugPageSource).not.toMatch(/isNotaTecnica/);
    });

    it("[...slug].astro does not import a NotaTecnicaLayout", () => {
      expect(slugPageSource).not.toMatch(/NotaTecnicaLayout/);
    });
  });

  describe("Theme token hygiene (AC 13, 17)", () => {
    it("PostLayout.astro <style> block contains no hex color literals", () => {
      const styleMatch = postLayoutSource.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      expect(styleMatch).not.toBeNull();
      expect(styleMatch?.[1]).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    });
  });

  describe("Class-name stability and anti-pattern guards (AC 10, 17)", () => {
    it("PostLayout.astro does not introduce a kb-prose class (.prose is the global selector per commit c88a2a0)", () => {
      expect(postLayoutSource).not.toMatch(/\bkb-prose\b/);
    });

    it("PostLayout.astro does not import any marginalia atom (AC 10 — no marginalia on posts per ux-design-specification.md:683)", () => {
      expect(postLayoutSource).not.toMatch(
        /\b(WashiTape|Polaroid|EkiStamp|MarginNote|PaperClip|Hanko|NunoDoodle)\b/,
      );
    });
  });

  describe("No-kanji-on-surface guard (AC 11, 17)", () => {
    it("PostLayout.astro raw source carries no kanji / hiragana / katakana glyphs", () => {
      expect(postLayoutSource).not.toMatch(/[　-〿぀-ゟ゠-ヿ一-龯]/);
    });
  });
});
