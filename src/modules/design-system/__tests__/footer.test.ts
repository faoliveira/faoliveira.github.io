// @vitest-environment node
import footerSource from "@components/Footer.astro?raw";
import { describe, expect, it } from "vitest";

describe("Footer — FA's rules", () => {
  it("renders the three social links as text labels in order rss → github → linkedin", () => {
    const rssIndex = footerSource.indexOf(">rss<");
    const githubIndex = footerSource.indexOf(">github<");
    const linkedinIndex = footerSource.indexOf(">linkedin<");

    expect(rssIndex).toBeGreaterThan(-1);
    expect(githubIndex).toBeGreaterThan(rssIndex);
    expect(linkedinIndex).toBeGreaterThan(githubIndex);
  });

  it("does not surface 'no cookies' or 'rss-first' copy", () => {
    const lower = footerSource.toLowerCase();
    expect(lower).not.toContain("no cookies");
    expect(lower).not.toContain("rss-first");
    expect(lower).not.toContain("cookies free");
  });

  it("keeps the 'built with' colophon and coffee SVG", () => {
    expect(footerSource).toContain("built with");
    // Discriminating segment of the coffee-cup outline (Rule 1 KEEP)
    expect(footerSource).toContain("M18 8h1a4 4");
  });

  it("does not ship SVG glyphs for the three social links", () => {
    // Coffee SVG is allowed; rss/github/linkedin SVG hooks must be gone.
    expect(footerSource).not.toMatch(/data-rss=/);
    expect(footerSource).not.toMatch(/data-github=/);
    expect(footerSource).not.toMatch(/data-linkedin=/);
  });
});
