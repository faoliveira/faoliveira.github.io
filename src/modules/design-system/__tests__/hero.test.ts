// @vitest-environment node
import heroSource from "@components/Hero.astro?raw";
import marginNoteSource from "@components/MarginNote.astro?raw";
import { describe, expect, it } from "vitest";

describe("Hero — Koubou v.04.26 contract", () => {
  it("ships the canonical Sora 800 statement", () => {
    expect(heroSource).toContain("Seventeen tabs open and a restless dog.");
  });

  it("ships the accepted trimmed subtitle copy", () => {
    expect(heroSource).toContain(
      "A workshop site about projects, data, and things I noticed and couldn't leave alone.",
    );
    expect(heroSource).not.toContain("Final Fantasy Tactics");
    expect(heroSource).not.toContain("ESP32");
  });

  it("renders both margin notes with the correct sides and only the right one is emphatic", () => {
    expect(heroSource).toMatch(/<MarginNote\s+side="left">[\s\S]*?the tabs are/);
    expect(heroSource).toMatch(/<MarginNote\s+side="right"\s+emphatic>[\s\S]*?his name/);
  });

  it("hides margin notes on narrow viewports", () => {
    expect(heroSource).toContain(".hero-notes");
    expect(heroSource).toContain("@media (max-width: 767.98px)");
    expect(heroSource).toMatch(/\.hero-notes\s*\{[\s\S]*?display:\s*none/);
  });

  it("preserves the literal U+2192 arrow in the left note (not &rarr;)", () => {
    expect(heroSource).toContain("a feature →");
    expect(heroSource).not.toContain("&rarr;");
  });

  it("avoids AI-tells / template copy in the hero", () => {
    const lower = heroSource.toLowerCase();
    expect(lower).not.toContain("welcome to my blog");
    expect(lower).not.toContain("ultimate");
    expect(lower).not.toMatch(/\bbest\b/);
    expect(lower).not.toContain("exciting times");
  });

  it("keeps the 3ch × 2px matcha rule", () => {
    expect(heroSource).toMatch(/width:\s*3ch/);
    expect(heroSource).toMatch(/height:\s*2px/);
    expect(heroSource).toContain("var(--color-accent)");
  });
});

describe("MarginNote — atom contract", () => {
  it("renders Caveat via --font-script and uses --color-margin-ink by default", () => {
    expect(marginNoteSource).toContain("var(--font-script)");
    expect(marginNoteSource).toContain("var(--color-margin-ink)");
  });

  it("uses the accepted post-review smaller margin-note size range", () => {
    expect(marginNoteSource).toContain("font-size: clamp(13px, 1.25vw, 17px)");
  });

  it("flips to --color-accent when emphatic", () => {
    expect(marginNoteSource).toMatch(/\.margin-note--emphatic\s*\{[\s\S]*var\(--color-accent\)/);
  });
});
