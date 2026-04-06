import { describe, expect, it } from "vitest";
import { generateMeta } from "../meta";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../site-config";

describe("generateMeta", () => {
  it("returns all fields when fully provided", () => {
    const result = generateMeta({
      title: "My Post",
      description: "A custom description",
      url: "/my-post/",
      type: "article",
      image: "https://felipeo.me/og.png",
    });

    expect(result.title).toBe("My Post");
    expect(result.description).toBe("A custom description");
    expect(result.url).toBe("/my-post/");
    expect(result.type).toBe("article");
    expect(result.image).toBe("https://felipeo.me/og.png");
  });

  it("falls back to SITE_DESCRIPTION when description is missing", () => {
    const result = generateMeta({ title: "No Desc", url: "/no-desc/" });
    expect(result.description).toBe(SITE_DESCRIPTION);
  });

  it("falls back to SITE_DESCRIPTION when description is an empty string", () => {
    const result = generateMeta({ title: "Empty Desc", url: "/empty/", description: "" });
    expect(result.description).toBe(SITE_DESCRIPTION);
  });

  it("defaults type to website", () => {
    const result = generateMeta({ title: "Homepage", url: "/" });
    expect(result.type).toBe("website");
  });

  it("constructs canonical URL from relative path", () => {
    const result = generateMeta({ title: "About", url: "/about/" });
    expect(result.canonicalUrl).toBe(`${SITE_URL}/about/`);
  });

  it("preserves absolute URL as canonical without modification", () => {
    const absUrl = "https://felipeo.me/post/custom/";
    const result = generateMeta({ title: "Post", url: absUrl });
    expect(result.canonicalUrl).toBe(absUrl);
  });

  it("preserves type: article", () => {
    const result = generateMeta({ title: "Post", url: "/post/", type: "article" });
    expect(result.type).toBe("article");
  });

  it("omits image when not provided", () => {
    const result = generateMeta({ title: "Page", url: "/page/" });
    expect(result.image).toBeUndefined();
  });

  it("includes siteName from SITE_TITLE", () => {
    const result = generateMeta({ title: "Page", url: "/page/" });
    expect(result.siteName).toBe(SITE_TITLE);
  });
});
