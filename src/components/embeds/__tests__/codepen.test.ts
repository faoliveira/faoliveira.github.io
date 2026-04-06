import { describe, expect, it } from "vitest";
import type { CodePenTab } from "../codepen-utils";
import { buildCodePenLink, buildCodePenUrl, sanitizeCodePenSlug } from "../codepen-utils";

describe("sanitizeCodePenSlug()", () => {
  it("passes through clean alphanumeric slugs unchanged", () => {
    expect(sanitizeCodePenSlug("abcDEF123")).toBe("abcDEF123");
  });

  it("preserves hyphens (valid in CodePen usernames and pen IDs)", () => {
    expect(sanitizeCodePenSlug("cassie-codes")).toBe("cassie-codes");
    expect(sanitizeCodePenSlug("my-pen-123")).toBe("my-pen-123");
  });

  it("strips underscores", () => {
    expect(sanitizeCodePenSlug("abc_def")).toBe("abcdef");
  });

  it("strips characters that could enable URL injection", () => {
    expect(sanitizeCodePenSlug("abc?evil=1")).toBe("abcevil1");
    expect(sanitizeCodePenSlug('abc"def')).toBe("abcdef");
    expect(sanitizeCodePenSlug("abc/../../etc")).toBe("abcetc");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeCodePenSlug("")).toBe("");
  });
});

describe("buildCodePenUrl()", () => {
  it("builds correct embed URL with default tab and theme", () => {
    const url = buildCodePenUrl("cassie-codes", "abcdef");
    expect(url).toBe(
      "https://codepen.io/cassie-codes/embed/abcdef?default-tab=result&theme-id=light",
    );
  });

  it("builds URL with custom tab", () => {
    const tabs: CodePenTab[] = ["result", "html", "css", "js"];
    for (const tab of tabs) {
      const url = buildCodePenUrl("user", "abc123", tab);
      expect(url).toContain(`default-tab=${tab}`);
    }
  });

  it("builds URL with dark theme", () => {
    const url = buildCodePenUrl("user", "abc123", "result", "dark");
    expect(url).toContain("theme-id=dark");
  });

  it("builds URL with light theme", () => {
    const url = buildCodePenUrl("user", "abc123", "result", "light");
    expect(url).toContain("theme-id=light");
  });

  it("sanitizes user and id in the URL", () => {
    const url = buildCodePenUrl("evil?user", "evil?id");
    expect(url).not.toContain("?user");
    expect(url).not.toContain("?id");
    expect(url).toContain("eviluser");
    expect(url).toContain("evilid");
  });
});

describe("buildCodePenLink()", () => {
  it("builds correct canonical pen link", () => {
    const link = buildCodePenLink("cassie-codes", "abcdef");
    expect(link).toBe("https://codepen.io/cassie-codes/pen/abcdef");
  });

  it("sanitizes user and id in the link", () => {
    const link = buildCodePenLink("evil/user", "evil?id");
    expect(link).toBe("https://codepen.io/eviluser/pen/evilid");
  });
});
