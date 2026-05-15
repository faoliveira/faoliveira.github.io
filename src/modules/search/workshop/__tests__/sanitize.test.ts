import { describe, expect, it } from "vitest";
import { escapeHtml, hasSubstantialMatch, isSafeUrl, sanitizeExcerpt } from "../sanitize";

describe("escapeHtml", () => {
  it("escapes <, >, &, \", '", () => {
    expect(escapeHtml(`<script>"&'</script>`)).toBe(
      "&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;",
    );
  });

  it("leaves benign text untouched", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

describe("sanitizeExcerpt", () => {
  it("preserves <mark> tags", () => {
    const result = sanitizeExcerpt("hello <mark>world</mark>");
    expect(result).toBe("hello <mark>world</mark>");
  });

  it("strips non-mark tags but keeps their text content", () => {
    const result = sanitizeExcerpt(`hello <b>bold</b> <i>italic</i> world`);
    expect(result).toBe("hello bold italic world");
  });

  it("does not preserve <script> tags as executable HTML", () => {
    const result = sanitizeExcerpt(`<script>alert(1)</script>after`);
    expect(result).not.toContain("<script");
    expect(result).toContain("after");
  });

  it("escapes text inside <mark>", () => {
    const result = sanitizeExcerpt("<mark>a & b</mark>");
    expect(result).toBe("<mark>a &amp; b</mark>");
  });

  it("escapes text outside marks", () => {
    const result = sanitizeExcerpt(`a < b & c > d`);
    expect(result).toContain("&lt;");
    expect(result).toContain("&amp;");
    expect(result).toContain("&gt;");
  });
});

describe("isSafeUrl", () => {
  it("accepts site-absolute paths", () => {
    expect(isSafeUrl("/posts/hello")).toBe(true);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeUrl("//evil.example.com")).toBe(false);
  });

  it("rejects absolute external URLs", () => {
    expect(isSafeUrl("https://evil.example.com")).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("hasSubstantialMatch", () => {
  const mk = (mark: string) => `prefix <mark>${mark}</mark> suffix`;

  it("passes when query is a prefix of the mark (find-as-you-type)", () => {
    expect(hasSubstantialMatch(mk("koubou"), "kou")).toBe(true);
  });

  it("passes when mark covers ≥75% of the query (minor typo)", () => {
    expect(hasSubstantialMatch(mk("koubou"), "koubous")).toBe(true);
  });

  it("rejects gibberish queries that match only a tiny prefix", () => {
    expect(hasSubstantialMatch(mk("test"), "testesddvxzdf")).toBe(false);
  });

  it("rejects empty/short queries", () => {
    expect(hasSubstantialMatch(mk("hello"), "")).toBe(false);
    expect(hasSubstantialMatch(mk("hello"), "a")).toBe(false);
  });

  it("rejects when excerpt has no marks", () => {
    expect(hasSubstantialMatch("plain text", "hello")).toBe(false);
  });

  it("requires every query word to match (AND logic)", () => {
    const excerpt = `<mark>kou</mark> and <mark>bou</mark>`;
    expect(hasSubstantialMatch(excerpt, "kou bou")).toBe(true);
    expect(hasSubstantialMatch(excerpt, "kou xyz")).toBe(false);
  });

  it("strips outer punctuation but keeps inner hyphens literal", () => {
    expect(hasSubstantialMatch(mk("koubou"), "kou-bou")).toBe(false);
  });
});
