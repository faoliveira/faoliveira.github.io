import { describe, expect, it } from "vitest";
import { isActivePath, NAV_ITEMS } from "../index";

describe("NAV_ITEMS", () => {
  it("has 3 items", () => {
    expect(NAV_ITEMS).toHaveLength(3);
  });

  it("has correct labels and hrefs", () => {
    expect(NAV_ITEMS[0]).toEqual({ label: "posts", href: "/posts/" });
    expect(NAV_ITEMS[1]).toEqual({ label: "about", href: "/about/" });
    expect(NAV_ITEMS[2]).toEqual({ label: "search", href: "/search/" });
  });
});

describe("isActivePath", () => {
  describe("exact matches", () => {
    it("returns true for exact path match", () => {
      expect(isActivePath("/posts/", "/posts/")).toBe(true);
    });

    it("returns true for homepage exact match", () => {
      expect(isActivePath("/", "/")).toBe(true);
    });

    it("returns true for about exact match", () => {
      expect(isActivePath("/about/", "/about/")).toBe(true);
    });

    it("returns true for /log/ exact match", () => {
      expect(isActivePath("/log/", "/log/")).toBe(true);
    });
  });

  describe("nested routes", () => {
    it("returns true for nested route under /posts/", () => {
      expect(isActivePath("/posts/hello-world", "/posts/")).toBe(true);
    });

    it("returns true for nested route with trailing slash", () => {
      expect(isActivePath("/posts/hello-world/", "/posts/")).toBe(true);
    });

    it("returns true for deeply nested route", () => {
      expect(isActivePath("/posts/2026/my-post", "/posts/")).toBe(true);
    });
  });

  describe("homepage isolation", () => {
    it("returns false when current is /posts/ and item is /", () => {
      expect(isActivePath("/posts/", "/")).toBe(false);
    });

    it("returns false when current is /about/ and item is /", () => {
      expect(isActivePath("/about/", "/")).toBe(false);
    });

    it("returns false when current is / and item is /posts/", () => {
      expect(isActivePath("/", "/posts/")).toBe(false);
    });
  });

  describe("trailing slash handling", () => {
    it("returns true when currentPath has no trailing slash but itemPath does", () => {
      expect(isActivePath("/posts", "/posts/")).toBe(true);
    });

    it("returns true when itemPath has no trailing slash but currentPath does", () => {
      expect(isActivePath("/posts/", "/posts")).toBe(true);
    });

    it("returns true when both lack trailing slashes", () => {
      expect(isActivePath("/posts", "/posts")).toBe(true);
    });
  });

  describe("non-matching paths", () => {
    it("returns false for unrelated sibling paths", () => {
      expect(isActivePath("/about/", "/posts/")).toBe(false);
    });

    it("returns false for paths that share a prefix but are distinct routes", () => {
      // /postsdraft/ should NOT match /posts/
      expect(isActivePath("/postsdraft/", "/posts/")).toBe(false);
    });

    it("returns false for partial prefix without segment boundary", () => {
      expect(isActivePath("/searching/", "/search/")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty currentPath", () => {
      expect(isActivePath("", "/posts/")).toBe(false);
    });

    it("returns false for empty itemPath", () => {
      expect(isActivePath("/posts/", "")).toBe(false);
    });

    it("returns true for currentPath with query string", () => {
      expect(isActivePath("/posts/?page=2", "/posts/")).toBe(true);
    });

    it("returns true for currentPath with hash fragment", () => {
      expect(isActivePath("/posts/#section", "/posts/")).toBe(true);
    });

    it("returns false when empty currentPath does not activate homepage", () => {
      expect(isActivePath("", "/")).toBe(false);
    });
  });
});
