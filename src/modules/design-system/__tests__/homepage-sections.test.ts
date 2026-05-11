// @vitest-environment node
import featuredCardSource from "@components/FeaturedCard.astro?raw";
import featuredGridSource from "@components/FeaturedGrid.astro?raw";
import postRowSource from "@components/PostRow.astro?raw";
import { describe, expect, it } from "vitest";
import indexSource from "../../../pages/index.astro?raw";

describe("Homepage sections — Story 1.5 contract", () => {
  it("renders the canonical Featured label and preserves the zero-feature guard", () => {
    expect(featuredGridSource).toContain("Featured ——</h2>");
    expect(featuredGridSource).toContain("posts.length > 0 &&");
  });

  it("passes alternating washi tape metadata from the featured map index", () => {
    expect(featuredGridSource).toContain("posts.map((post, index)");
    expect(featuredGridSource).toContain('tapeSide={index % 2 === 0 ? "left" : "right"}');
    expect(featuredGridSource).toContain('tapeTone={index % 2 === 0 ? "matcha" : "vermillion"}');
  });

  it("uses card lift/shadow instead of the old border-left hover treatment", () => {
    expect(featuredCardSource).toContain("translateY(-2px)");
    expect(featuredCardSource).toContain("var(--shadow-card-hover)");
    expect(featuredCardSource).not.toContain("border-left-color");
  });

  it("keeps featured cards full-link, metadata-first, and decorated with non-focusable tape", () => {
    expect(featuredCardSource).toMatch(/<a[\s\S]*href=\{`\/posts\/\$\{post\.id\}`\}/);
    expect(featuredCardSource).toContain('class="card-meta"');
    expect(featuredCardSource).toContain('class="card-date-column"');
    expect(featuredCardSource).toContain('class="card-body"');
    expect(featuredCardSource).toContain('aria-hidden="true"');
  });

  it("keeps PostRow as a full-row link with a dotted separator", () => {
    expect(postRowSource).toMatch(/<a href=\{`\/posts\/\$\{post\.id\}`\}/);
    expect(postRowSource).toContain("border-block-start: 1px dotted var(--color-border)");
  });

  it("requests the full recent stream and renders the canonical Recent label", () => {
    expect(indexSource).toContain("getPublishedPosts({ limit: 5 })");
    expect(indexSource).not.toContain("excludeFeatured");
    expect(indexSource).toContain('headingText="Recent ——"');
  });
});
